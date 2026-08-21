import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SAMPLE_RATE = 16_000;
const WINDOW_MS = 100;
const WINDOW_SAMPLES = SAMPLE_RATE * WINDOW_MS / 1_000;
const MIN_SPEECH_RMS = 0.012;
const MIN_PAUSE_MS = 450;
const MAX_MEDIA_BYTES = 24 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;

export const MEDIA_ANALYSIS_VERSION = "blue-blazer-acoustic-v1";

export type AcousticMetrics = {
  available: boolean;
  source: "stored_recording_waveform" | "unavailable";
  durationSeconds: number;
  speakingSeconds: number;
  silenceSeconds: number;
  silencePercentage: number;
  pauseCount: number;
  averagePauseMs: number;
  longestPauseMs: number;
  averageLoudnessDbfs: number | null;
  loudnessVariationDb: number | null;
  clippingPercentage: number;
  analysisVersion: string;
  reason?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dbfs(rms: number) {
  return 20 * Math.log10(Math.max(rms, 0.000_001));
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

export function analyzePcmWaveform(pcm: Buffer): AcousticMetrics {
  const sampleCount = Math.floor(pcm.length / 2);
  if (sampleCount < WINDOW_SAMPLES) {
    return {
      available: false,
      source: "unavailable",
      durationSeconds: Number((sampleCount / SAMPLE_RATE).toFixed(2)),
      speakingSeconds: 0,
      silenceSeconds: Number((sampleCount / SAMPLE_RATE).toFixed(2)),
      silencePercentage: 100,
      pauseCount: 0,
      averagePauseMs: 0,
      longestPauseMs: 0,
      averageLoudnessDbfs: null,
      loudnessVariationDb: null,
      clippingPercentage: 0,
      analysisVersion: MEDIA_ANALYSIS_VERSION,
      reason: "The recording was too short to produce reliable acoustic metrics.",
    };
  }

  const windows: Array<{ rms: number; speech: boolean }> = [];
  let clipped = 0;
  for (let offset = 0; offset + WINDOW_SAMPLES <= sampleCount; offset += WINDOW_SAMPLES) {
    let sumSquares = 0;
    for (let index = offset; index < offset + WINDOW_SAMPLES; index += 1) {
      const sample = pcm.readInt16LE(index * 2) / 32_768;
      sumSquares += sample * sample;
      if (Math.abs(sample) >= 0.98) clipped += 1;
    }
    const rms = Math.sqrt(sumSquares / WINDOW_SAMPLES);
    windows.push({ rms, speech: rms >= MIN_SPEECH_RMS });
  }

  const durationSeconds = Number((sampleCount / SAMPLE_RATE).toFixed(2));
  const speechWindows = windows.filter((window) => window.speech);
  const speakingSeconds = Number(((speechWindows.length * WINDOW_MS) / 1_000).toFixed(2));
  const silenceSeconds = Number(Math.max(0, durationSeconds - speakingSeconds).toFixed(2));
  const pauses: number[] = [];
  let activePauseWindows = 0;
  for (const window of windows) {
    if (!window.speech) {
      activePauseWindows += 1;
      continue;
    }
    if (activePauseWindows * WINDOW_MS >= MIN_PAUSE_MS) pauses.push(activePauseWindows * WINDOW_MS);
    activePauseWindows = 0;
  }
  if (activePauseWindows * WINDOW_MS >= MIN_PAUSE_MS) pauses.push(activePauseWindows * WINDOW_MS);

  const loudness = speechWindows.map((window) => dbfs(window.rms));
  const meanLoudness = average(loudness);
  const deviation = loudness.length ? Math.sqrt(average(loudness.map((value) => (value - meanLoudness) ** 2))) : 0;
  const silencePercentage = durationSeconds ? Number(((silenceSeconds / durationSeconds) * 100).toFixed(1)) : 100;
  const speechCoverage = durationSeconds ? speakingSeconds / durationSeconds : 0;

  if (speechCoverage < 0.08) {
    return {
      available: false,
      source: "unavailable",
      durationSeconds,
      speakingSeconds,
      silenceSeconds,
      silencePercentage,
      pauseCount: pauses.length,
      averagePauseMs: Math.round(average(pauses)),
      longestPauseMs: Math.max(0, ...pauses),
      averageLoudnessDbfs: loudness.length ? Number(meanLoudness.toFixed(1)) : null,
      loudnessVariationDb: loudness.length ? Number(deviation.toFixed(1)) : null,
      clippingPercentage: Number(((clipped / Math.max(sampleCount, 1)) * 100).toFixed(2)),
      analysisVersion: MEDIA_ANALYSIS_VERSION,
      reason: "The saved recording contained too little detectable speech for reliable delivery analysis.",
    };
  }

  return {
    available: true,
    source: "stored_recording_waveform",
    durationSeconds,
    speakingSeconds,
    silenceSeconds,
    silencePercentage,
    pauseCount: pauses.length,
    averagePauseMs: Math.round(average(pauses)),
    longestPauseMs: Math.max(0, ...pauses),
    averageLoudnessDbfs: Number(meanLoudness.toFixed(1)),
    loudnessVariationDb: Number(deviation.toFixed(1)),
    clippingPercentage: Number(((clipped / Math.max(sampleCount, 1)) * 100).toFixed(2)),
    analysisVersion: MEDIA_ANALYSIS_VERSION,
  };
}

function runFfmpeg(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "s16le", outputPath]);
    let errorOutput = "";
    process.stderr.on("data", (chunk) => { errorOutput += String(chunk); });
    process.on("error", (error) => reject(error));
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(errorOutput.trim() || `ffmpeg exited with code ${code}`)));
  });
}

function runFfmpegAudioExtract(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", ["-v", "error", "-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", outputPath]);
    let errorOutput = "";
    process.stderr.on("data", (chunk) => { errorOutput += String(chunk); });
    process.on("error", (error) => reject(error));
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(errorOutput.trim() || `ffmpeg exited with code ${code}`)));
  });
}

export async function analyzeStoredRecording(recordingUrl: string): Promise<AcousticMetrics> {
  let workDir: string | null = null;
  try {
    const response = await fetch(recordingUrl);
    if (!response.ok) throw new Error(`The saved recording could not be downloaded (${response.status}).`);
    const media = Buffer.from(await response.arrayBuffer());
    if (!media.length || media.length > MAX_MEDIA_BYTES) throw new Error("The saved recording is unavailable or exceeds the media-analysis size limit.");
    workDir = await mkdtemp(join(tmpdir(), "blue-blazer-media-"));
    const inputPath = join(workDir, `${randomUUID()}.media`);
    const outputPath = join(workDir, `${randomUUID()}.pcm`);
    await writeFile(inputPath, media);
    await runFfmpeg(inputPath, outputPath);
    return analyzePcmWaveform(await readFile(outputPath));
  } catch (error) {
    return {
      available: false,
      source: "unavailable",
      durationSeconds: 0,
      speakingSeconds: 0,
      silenceSeconds: 0,
      silencePercentage: 0,
      pauseCount: 0,
      averagePauseMs: 0,
      longestPauseMs: 0,
      averageLoudnessDbfs: null,
      loudnessVariationDb: null,
      clippingPercentage: 0,
      analysisVersion: MEDIA_ANALYSIS_VERSION,
      reason: error instanceof Error ? error.message.slice(0, 320) : "Audio analysis could not be completed.",
    };
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

/** Converts the saved original media into a compact private audio derivative for transcription. */
export async function extractAudioForTranscription(recordingUrl: string) {
  let workDir: string | null = null;
  try {
    const response = await fetch(recordingUrl);
    if (!response.ok) throw new Error(`The saved recording could not be downloaded (${response.status}).`);
    const media = Buffer.from(await response.arrayBuffer());
    if (!media.length || media.length > MAX_MEDIA_BYTES) throw new Error("The saved recording is unavailable or exceeds the transcription preparation size limit.");
    workDir = await mkdtemp(join(tmpdir(), "blue-blazer-audio-"));
    const inputPath = join(workDir, `${randomUUID()}.media`);
    const outputPath = join(workDir, `${randomUUID()}.mp3`);
    await writeFile(inputPath, media);
    await runFfmpegAudioExtract(inputPath, outputPath);
    const audio = await readFile(outputPath);
    if (!audio.length || audio.length > 16 * 1024 * 1024) throw new Error("The extracted audio exceeds the supported transcription size limit.");
    return { audio, contentType: "audio/mpeg" as const };
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}

function runPdfToText(inputPath: string) {
  return new Promise<string>((resolve, reject) => {
    const process = spawn("pdftotext", [inputPath, "-"]);
    let output = "";
    let errorOutput = "";
    process.stdout.on("data", (chunk) => { output += String(chunk); });
    process.stderr.on("data", (chunk) => { errorOutput += String(chunk); });
    process.on("error", (error) => reject(error));
    process.on("close", (code) => code === 0 ? resolve(output) : reject(new Error(errorOutput.trim() || `pdftotext exited with code ${code}`)));
  });
}

export async function extractWrittenDocument(documentUrl: string, mimeType: string) {
  const response = await fetch(documentUrl);
  if (!response.ok) throw new Error(`The written entry could not be downloaded (${response.status}).`);
  const document = Buffer.from(await response.arrayBuffer());
  if (!document.length || document.length > MAX_DOCUMENT_BYTES) throw new Error("The written entry is unavailable or exceeds the supported document size limit.");
  if (mimeType === "text/plain") {
    const parsedContent = document.toString("utf8").trim();
    if (!parsedContent) throw new Error("The written entry did not contain readable text.");
    return { parsedContent: parsedContent.slice(0, 90_000), pageCount: 1 };
  }
  if (mimeType !== "application/pdf") throw new Error("Only PDF and plain-text written entries are currently supported for evidence extraction.");
  const workDir = await mkdtemp(join(tmpdir(), "blue-blazer-document-"));
  try {
    const inputPath = join(workDir, `${randomUUID()}.pdf`);
    await writeFile(inputPath, document);
    const parsedContent = (await runPdfToText(inputPath)).trim();
    if (!parsedContent) throw new Error("The PDF did not contain extractable text. Upload a text-based PDF or use a supported text entry.");
    return { parsedContent: parsedContent.slice(0, 90_000), pageCount: Math.max(1, parsedContent.split("\f").length) };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export function audioAnalysisConfidence(metrics: AcousticMetrics) {
  if (!metrics.available || metrics.durationSeconds < 15) return 0;
  const durationFactor = clamp(metrics.durationSeconds / 90, 0.25, 1);
  const speechFactor = clamp(1 - metrics.silencePercentage / 100, 0.2, 1);
  return Number((durationFactor * speechFactor).toFixed(2));
}
