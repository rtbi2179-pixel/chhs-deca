import { describe, expect, it } from "vitest";
import { analyzePcmWaveform, audioAnalysisConfidence, MEDIA_ANALYSIS_VERSION } from "./mediaAnalysis";

function pcm(seconds: Array<{ duration: number; amplitude: number }>) {
  const samples = seconds.flatMap(({ duration, amplitude }) => Array.from({ length: Math.round(16_000 * duration) }, (_, index) => Math.round(Math.sin(index / 9) * amplitude * 32_000)));
  const result = Buffer.alloc(samples.length * 2);
  samples.forEach((sample, index) => result.writeInt16LE(sample, index * 2));
  return result;
}

describe("stored-recording acoustic analysis", () => {
  it("measures pauses and speech coverage from waveform samples rather than transcript text", () => {
    const metrics = analyzePcmWaveform(pcm([{ duration: 1, amplitude: 0.25 }, { duration: 0.7, amplitude: 0 }, { duration: 1, amplitude: 0.25 }]));
    expect(metrics.available).toBe(true);
    expect(metrics.source).toBe("stored_recording_waveform");
    expect(metrics.pauseCount).toBe(1);
    expect(metrics.longestPauseMs).toBeGreaterThanOrEqual(600);
    expect(metrics.silencePercentage).toBeGreaterThan(20);
    expect(metrics.analysisVersion).toBe(MEDIA_ANALYSIS_VERSION);
    expect(audioAnalysisConfidence(metrics)).toBe(0);
  });

  it("does not fabricate delivery coaching when the stored audio has too little speech", () => {
    const metrics = analyzePcmWaveform(pcm([{ duration: 2, amplitude: 0 }]));
    expect(metrics.available).toBe(false);
    expect(metrics.reason).toMatch(/too little detectable speech/i);
    expect(audioAnalysisConfidence(metrics)).toBe(0);
  });
});
