import { useEffect, useRef } from "react";

export type BackgroundVariant = "hero" | "overview" | "study" | "practice" | "mockExam" | "roleplay" | "leaderboard" | "piLibrary" | "events" | "calendar" | "announcements" | "discussions" | "volunteer" | "feedback" | "banking" | "market" | "news" | "members" | "admin" | "chapter" | "profile";

type Star = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  phase: number;
};

type Node = {
  x: number;
  y: number;
  orbit?: number;
  phase: number;
  radius: number;
  intensity: number;
  drift: number;
};

type PointerPosition = { x: number; y: number };

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const alpha = (value: number) => clamp(finite(value), 0, 1);

type ConstellationShape = "horizon" | "orbit" | "compass" | "book" | "target" | "shield" | "dialogue" | "crown" | "library" | "starburst" | "calendar" | "beacon" | "speech" | "heart" | "quill" | "vault" | "chart" | "broadcast" | "people" | "grid" | "flag" | "profile";
type BackgroundConfiguration = { starCount: number; nodeCount: number; coreX: number; coreY: number; strength: number; shape: ConstellationShape; spread: number };

const constellationShapes: Record<ConstellationShape, Array<[number, number]>> = {
  horizon: [[-1, 0.35], [-0.65, 0.1], [-0.32, 0.28], [0, -0.15], [0.34, 0.15], [0.67, -0.08], [1, 0.2]],
  orbit: [],
  compass: [[0, -1], [0.32, -0.32], [1, 0], [0.32, 0.32], [0, 1], [-0.32, 0.32], [-1, 0], [-0.32, -0.32], [0, 0]],
  book: [[-1, -0.72], [-0.4, -0.95], [0, -0.3], [0.4, -0.95], [1, -0.72], [1, 0.75], [0.4, 0.52], [0, 0.86], [-0.4, 0.52], [-1, 0.75]],
  target: [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7], [0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]],
  shield: [[0, -1], [0.86, -0.52], [0.72, 0.4], [0, 1], [-0.72, 0.4], [-0.86, -0.52], [0, -0.15]],
  dialogue: [[-1, -0.55], [-0.35, -0.82], [0.1, -0.45], [-0.32, -0.1], [-0.85, -0.08], [-0.5, 0.14], [0.22, 0.22], [0.58, -0.08], [1, 0.2], [0.64, 0.75], [0.14, 0.65]],
  crown: [[-1, 0.52], [-0.8, -0.62], [-0.35, 0.05], [0, -1], [0.35, 0.05], [0.8, -0.62], [1, 0.52], [0.62, 0.9], [0, 0.72], [-0.62, 0.9]],
  library: [[-1, -0.88], [-1, 0.92], [-0.58, 0.92], [-0.58, -0.88], [-0.22, -0.65], [-0.22, 0.8], [0.18, 0.8], [0.18, -0.95], [0.58, -0.72], [0.58, 0.92], [1, 0.92], [1, -0.72]],
  starburst: [[0, 0], [0, -1], [0.68, -0.68], [1, 0], [0.68, 0.68], [0, 1], [-0.68, 0.68], [-1, 0], [-0.68, -0.68]],
  calendar: [[-1, -0.82], [1, -0.82], [1, 0.9], [-1, 0.9], [-1, -0.22], [1, -0.22], [-0.5, 0.15], [0, 0.15], [0.5, 0.15], [-0.5, 0.62], [0, 0.62], [0.5, 0.62]],
  beacon: [[0, -1], [0, 0.92], [-0.72, 0.92], [0.72, 0.92], [-1, -0.28], [1, -0.28], [-0.88, 0.3], [0.88, 0.3]],
  speech: [[-1, -0.62], [0.62, -0.75], [1, -0.24], [0.68, 0.35], [0.04, 0.35], [-0.45, 0.92], [-0.36, 0.35], [-1, 0.05]],
  heart: [[0, 1], [-0.92, -0.08], [-0.7, -0.72], [-0.22, -0.8], [0, -0.42], [0.22, -0.8], [0.7, -0.72], [0.92, -0.08], [0, 0.56]],
  quill: [[-0.86, 0.86], [-0.32, 0.42], [0.2, -0.1], [0.7, -0.95], [0.96, -0.7], [0.36, 0.22], [-0.14, 0.72], [0.52, 0.9]],
  vault: [[-0.95, -0.88], [0.95, -0.88], [0.95, 0.9], [-0.95, 0.9], [0, 0], [0, -0.5], [0.42, 0], [0, 0.42], [-0.42, 0]],
  chart: [[-1, 0.78], [-0.62, 0.35], [-0.25, 0.52], [0.12, -0.18], [0.48, 0.05], [1, -0.92], [0.78, -0.92], [1, -0.92], [1, -0.58]],
  broadcast: [[-0.85, 0.76], [-0.34, 0.22], [0, 0], [0.38, -0.18], [0.96, -0.75], [0.7, -0.3], [0.42, 0.08], [0.06, 0.4]],
  people: [[-0.72, -0.68], [-0.72, -0.05], [-0.72, 0.78], [0, -1], [0, -0.22], [0, 0.92], [0.72, -0.68], [0.72, -0.05], [0.72, 0.78]],
  grid: [[-0.9, -0.9], [0, -0.9], [0.9, -0.9], [-0.9, 0], [0, 0], [0.9, 0], [-0.9, 0.9], [0, 0.9], [0.9, 0.9]],
  flag: [[-0.9, -0.95], [-0.9, 0.95], [-0.35, 0.68], [-0.35, -0.72], [0.86, -0.82], [0.42, -0.25], [0.86, 0.32], [-0.35, 0.14]],
  profile: [[0, -1], [0.58, -0.58], [0.58, 0], [1, 0.72], [0.46, 0.96], [0, 0.5], [-0.46, 0.96], [-1, 0.72], [-0.58, 0], [-0.58, -0.58]],
};

const configurationByVariant: Record<BackgroundVariant, BackgroundConfiguration> = {
  hero: { starCount: 76, nodeCount: 19, coreX: 0.67, coreY: 0.38, strength: 1.15, shape: "horizon", spread: 0.38 },
  overview: { starCount: 58, nodeCount: 16, coreX: 0.76, coreY: 0.3, strength: 1, shape: "orbit", spread: 0.31 },
  study: { starCount: 48, nodeCount: 11, coreX: 0.8, coreY: 0.24, strength: 0.76, shape: "book", spread: 0.27 },
  practice: { starCount: 50, nodeCount: 14, coreX: 0.76, coreY: 0.28, strength: 0.84, shape: "target", spread: 0.29 },
  mockExam: { starCount: 46, nodeCount: 12, coreX: 0.76, coreY: 0.3, strength: 0.8, shape: "shield", spread: 0.28 },
  roleplay: { starCount: 52, nodeCount: 14, coreX: 0.22, coreY: 0.28, strength: 0.84, shape: "dialogue", spread: 0.27 },
  leaderboard: { starCount: 54, nodeCount: 15, coreX: 0.75, coreY: 0.26, strength: 0.9, shape: "crown", spread: 0.29 },
  piLibrary: { starCount: 50, nodeCount: 15, coreX: 0.78, coreY: 0.25, strength: 0.82, shape: "library", spread: 0.26 },
  events: { starCount: 54, nodeCount: 14, coreX: 0.2, coreY: 0.3, strength: 0.86, shape: "starburst", spread: 0.29 },
  calendar: { starCount: 44, nodeCount: 14, coreX: 0.22, coreY: 0.25, strength: 0.76, shape: "calendar", spread: 0.25 },
  announcements: { starCount: 48, nodeCount: 12, coreX: 0.22, coreY: 0.25, strength: 0.8, shape: "beacon", spread: 0.27 },
  discussions: { starCount: 50, nodeCount: 13, coreX: 0.2, coreY: 0.28, strength: 0.82, shape: "speech", spread: 0.28 },
  volunteer: { starCount: 46, nodeCount: 12, coreX: 0.22, coreY: 0.28, strength: 0.76, shape: "heart", spread: 0.27 },
  feedback: { starCount: 42, nodeCount: 11, coreX: 0.2, coreY: 0.26, strength: 0.74, shape: "quill", spread: 0.25 },
  banking: { starCount: 48, nodeCount: 13, coreX: 0.77, coreY: 0.22, strength: 0.88, shape: "vault", spread: 0.28 },
  market: { starCount: 54, nodeCount: 13, coreX: 0.78, coreY: 0.22, strength: 0.94, shape: "chart", spread: 0.3 },
  news: { starCount: 50, nodeCount: 12, coreX: 0.76, coreY: 0.22, strength: 0.86, shape: "broadcast", spread: 0.28 },
  members: { starCount: 46, nodeCount: 13, coreX: 0.22, coreY: 0.24, strength: 0.76, shape: "people", spread: 0.25 },
  admin: { starCount: 46, nodeCount: 12, coreX: 0.24, coreY: 0.23, strength: 0.74, shape: "grid", spread: 0.25 },
  chapter: { starCount: 44, nodeCount: 11, coreX: 0.26, coreY: 0.23, strength: 0.7, shape: "flag", spread: 0.25 },
  profile: { starCount: 48, nodeCount: 12, coreX: 0.78, coreY: 0.24, strength: 0.78, shape: "profile", spread: 0.26 },
};

export function InteractiveBackground({ variant = "hero" }: { variant?: BackgroundVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<PointerPosition>({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let isPageVisible = !document.hidden;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;
    const stars: Star[] = [];
    const nodes: Node[] = [];
    const isInteractive = variant === "overview";
    const lowPowerDevice = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined
      && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
    const dpr = Math.min(window.devicePixelRatio || 1, lowPowerDevice ? 1 : 1.5);
    const targetFrameMs = isInteractive ? (lowPowerDevice ? 1000 / 24 : 1000 / 30) : 1000 / 18;
    let lastDrawTime = -Infinity;
    const configuration = configurationByVariant[variant];

    const createScene = () => {
      stars.length = 0;
      nodes.length = 0;
      const densityScale = clamp((width * height) / 700_000, 0.65, 1.2) * (isInteractive ? (lowPowerDevice ? 0.72 : 0.86) : (lowPowerDevice ? 0.52 : 0.62));
      const starCount = Math.round(configuration.starCount * densityScale);
      const nodeCount = Math.round(configuration.nodeCount * densityScale);

      for (let index = 0; index < starCount; index += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          depth: 0.3 + Math.random() * 0.95,
          radius: 0.35 + Math.random() * 1.25,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const isCircularOrbit = configuration.shape === "orbit";
      if (isCircularOrbit) {
        for (let index = 0; index < nodeCount; index += 1) {
          const angle = (index / nodeCount) * Math.PI * 2 + Math.random() * 0.42;
          const orbit = (0.12 + Math.random() * 0.36) * Math.min(width, height);
          nodes.push({
            x: width * configuration.coreX + Math.cos(angle) * orbit,
            y: height * configuration.coreY + Math.sin(angle) * orbit * 0.48,
            orbit,
            phase: angle,
            radius: 1.2 + Math.random() * 1.9,
            intensity: 0.45 + Math.random() * 0.55,
            drift: 0,
          });
        }
      } else {
        const shape = constellationShapes[configuration.shape];
        const constellationRadius = Math.min(width, height) * configuration.spread;
        for (let index = 0; index < nodeCount; index += 1) {
          const templatePoint = shape[index % shape.length];
          const layer = Math.floor(index / shape.length);
          const layerScale = layer === 0 ? 1 : 0.62 + layer * 0.08;
          const offset = layer === 0 ? 0 : ((index % 3) - 1) * constellationRadius * 0.045;
          nodes.push({
            x: width * configuration.coreX + templatePoint[0] * constellationRadius * layerScale + offset,
            y: height * configuration.coreY + templatePoint[1] * constellationRadius * 0.72 * layerScale + offset * 0.45,
            phase: index * 0.89 + layer * 0.42,
            radius: 1.2 + Math.random() * 1.9,
            intensity: 0.45 + Math.random() * 0.55,
            drift: 1.2 + Math.random() * 2.2,
          });
        }
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createScene();
    };

    const drawRoundedFrame = (time: number) => {
      const frameOpacity = variant === "overview" ? 0.14 : variant === "hero" ? 0.2 : 0.1;
      const gradient = context.createLinearGradient(width * 0.12, 0, width * 0.88, height);
      gradient.addColorStop(0, `rgba(59, 130, 246, ${frameOpacity * 0.15})`);
      gradient.addColorStop(0.5, `rgba(125, 211, 252, ${frameOpacity})`);
      gradient.addColorStop(1, `rgba(59, 130, 246, ${frameOpacity * 0.1})`);
      context.strokeStyle = gradient;
      context.lineWidth = 0.6;

      const horizon = height * 0.74;
      for (let row = 0; row < 7; row += 1) {
        const offset = ((time * 0.000022 + row * 0.14) % 1 + 1) % 1;
        const y = horizon + Math.pow(offset, 1.9) * height * 0.46;
        context.globalAlpha = (1 - offset) * 0.5;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      for (let column = -5; column <= 5; column += 1) {
        context.globalAlpha = 0.45;
        context.beginPath();
        context.moveTo(width * 0.5, horizon);
        context.lineTo(width * (0.5 + column * 0.18), height);
        context.stroke();
      }
      context.globalAlpha = 1;
    };

    const drawScene = (time: number) => {
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
      context.clearRect(0, 0, width, height);
      const pointer = pointerRef.current;
      const normalizedPointerX = clamp(pointer.x / Math.max(width, 1), 0, 1);
      const normalizedPointerY = clamp(pointer.y / Math.max(height, 1), 0, 1);
      const pointerIsNear = isInteractive && pointer.x > -1000 && pointer.y > -1000;
      const coreX = width * configuration.coreX + (pointerIsNear ? (normalizedPointerX - 0.5) * 22 : 0);
      const coreY = height * configuration.coreY + (pointerIsNear ? (normalizedPointerY - 0.5) * 18 : 0);
      const coreRadius = Math.min(width, height) * (variant === "overview" ? 0.33 : variant === "hero" ? 0.39 : 0.29);

      const atmosphere = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreRadius * 1.45);
      atmosphere.addColorStop(0, "rgba(96, 165, 250, 0.2)");
      atmosphere.addColorStop(0.22, "rgba(37, 99, 235, 0.12)");
      atmosphere.addColorStop(0.55, "rgba(15, 23, 42, 0.08)");
      atmosphere.addColorStop(1, "rgba(2, 6, 23, 0)");
      context.fillStyle = atmosphere;
      context.fillRect(0, 0, width, height);

      const aurora = context.createLinearGradient(0, height * 0.08, width, height * 0.88);
      aurora.addColorStop(0, "rgba(37, 99, 235, 0.04)");
      aurora.addColorStop(0.42, "rgba(14, 165, 233, 0.095)");
      aurora.addColorStop(0.72, "rgba(30, 64, 175, 0.05)");
      aurora.addColorStop(1, "rgba(2, 6, 23, 0)");
      context.fillStyle = aurora;
      context.fillRect(0, 0, width, height);

      drawRoundedFrame(time);

      stars.forEach((star) => {
        const parallaxX = pointerIsNear ? (normalizedPointerX - 0.5) * star.depth * -10 : 0;
        const parallaxY = pointerIsNear ? (normalizedPointerY - 0.5) * star.depth * -8 : 0;
        const twinkle = 0.45 + (Math.sin(time * 0.0015 * star.depth + star.phase) + 1) * 0.18;
        context.fillStyle = `rgba(191, 219, 254, ${twinkle * star.depth})`;
        context.beginPath();
        context.arc(star.x + parallaxX, star.y + parallaxY, star.radius * star.depth, 0, Math.PI * 2);
        context.fill();
      });

      const isCircularOrbit = configuration.shape === "orbit";
      const activeNodes = nodes.map((node, index) => {
        if (isCircularOrbit) {
          const orbitalVelocity = prefersReducedMotion ? 0 : time * (0.00004 + index * 0.0000015);
          const orbitX = Math.cos(node.phase + orbitalVelocity) * (node.orbit ?? 0);
          const orbitY = Math.sin(node.phase + orbitalVelocity * 1.18) * (node.orbit ?? 0) * 0.48;
          const mouseInfluence = pointerIsNear ? 10 * (1 - clamp(Math.hypot(coreX + orbitX - pointer.x, coreY + orbitY - pointer.y) / 420, 0, 1)) : 0;
          return { ...node, x: coreX + orbitX + mouseInfluence, y: coreY + orbitY - mouseInfluence * 0.35 };
        }
        const driftVelocity = prefersReducedMotion ? 0 : time * (0.00042 + index * 0.000007);
        const driftX = Math.cos(node.phase + driftVelocity) * node.drift;
        const driftY = Math.sin(node.phase * 1.2 + driftVelocity * 1.35) * node.drift * 0.62;
        const mouseInfluence = pointerIsNear ? 10 * (1 - clamp(Math.hypot(node.x + driftX - pointer.x, node.y + driftY - pointer.y) / 420, 0, 1)) : 0;
        return { ...node, x: node.x + driftX + mouseInfluence, y: node.y + driftY - mouseInfluence * 0.35 };
      });

      for (let index = 0; index < activeNodes.length; index += 1) {
        const from = activeNodes[index];
        for (let candidate = index + 1; candidate < activeNodes.length; candidate += 1) {
          const to = activeNodes[candidate];
          const distance = Math.hypot(from.x - to.x, from.y - to.y);
          const connectionRange = Math.max(Math.min(width, height) * 0.32, 1);
          if (distance > connectionRange) continue;
          const opacity = alpha((1 - distance / connectionRange) * 0.18 * finite(configuration.strength, 1));
          const beam = context.createLinearGradient(from.x, from.y, to.x, to.y);
          beam.addColorStop(0, `rgba(96, 165, 250, ${opacity})`);
          beam.addColorStop(0.5, `rgba(186, 230, 253, ${alpha(opacity * 1.45)})`);
          beam.addColorStop(1, `rgba(59, 130, 246, ${alpha(opacity * 0.7)})`);
          context.strokeStyle = beam;
          context.lineWidth = 0.7;
          context.beginPath();
          context.moveTo(from.x, from.y);
          context.lineTo(to.x, to.y);
          context.stroke();
        }
      }

      [0.42, 0.67, 0.92].forEach((scale, index) => {
        context.save();
        context.translate(coreX, coreY);
        context.rotate((prefersReducedMotion ? 0 : time * 0.000045) * (index % 2 ? -1 : 1));
        context.scale(1, 0.48);
        context.strokeStyle = `rgba(125, 211, 252, ${0.1 - index * 0.018})`;
        context.lineWidth = index === 0 ? 1.2 : 0.7;
        context.setLineDash(index === 1 ? [3, 8] : index === 2 ? [1, 11] : []);
        context.beginPath();
        context.arc(0, 0, coreRadius * scale, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      });
      context.setLineDash([]);

      activeNodes.forEach((node, index) => {
        const pulse = 0.7 + (Math.sin(time * 0.0019 + node.phase * 4) + 1) * 0.18;
        const bloom = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 9);
        bloom.addColorStop(0, `rgba(191, 219, 254, ${node.intensity * 0.85})`);
        bloom.addColorStop(0.25, `rgba(59, 130, 246, ${node.intensity * 0.35})`);
        bloom.addColorStop(1, "rgba(59, 130, 246, 0)");
        context.fillStyle = bloom;
        context.beginPath();
        context.arc(node.x, node.y, node.radius * 9, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = `rgba(219, 234, 254, ${pulse})`;
        context.beginPath();
        context.arc(node.x, node.y, node.radius * 1.35, 0, Math.PI * 2);
        context.fill();

        if (index % 4 === 0) {
          const target = activeNodes[(index + 5) % activeNodes.length];
          const progress = (time * 0.00015 + index * 0.19) % 1;
          const signalX = node.x + (target.x - node.x) * progress;
          const signalY = node.y + (target.y - node.y) * progress;
          context.fillStyle = "rgba(224, 242, 254, 0.9)";
          context.beginPath();
          context.arc(signalX, signalY, 1.5, 0, Math.PI * 2);
          context.fill();
        }
      });

      const core = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreRadius * 0.2);
      core.addColorStop(0, "rgba(224, 242, 254, 0.84)");
      core.addColorStop(0.12, "rgba(96, 165, 250, 0.48)");
      core.addColorStop(0.46, "rgba(37, 99, 235, 0.1)");
      core.addColorStop(1, "rgba(37, 99, 235, 0)");
      context.fillStyle = core;
      context.beginPath();
      context.arc(coreX, coreY, coreRadius * 0.2, 0, Math.PI * 2);
      context.fill();
    };

    const render = (time: number) => {
      if (time - lastDrawTime >= targetFrameMs) {
        drawScene(time);
        lastDrawTime = time;
      }
      if (isPageVisible && !prefersReducedMotion) animationFrame = window.requestAnimationFrame(render);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      lastDrawTime = -Infinity;
      if (prefersReducedMotion) drawScene(0);
      else if (isPageVisible) animationFrame = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerRef.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const onPointerLeave = () => { pointerRef.current = { x: -9999, y: -9999 }; };
    const onVisibilityChange = () => {
      isPageVisible = !document.hidden;
      start();
    };
    const onMotionChange = () => {
      prefersReducedMotion = motionQuery.matches;
      start();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      start();
    });
    resizeObserver.observe(canvas);
    if (isInteractive) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerout", onPointerLeave, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);
    resize();
    start();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      if (isInteractive) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerout", onPointerLeave);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}

export default InteractiveBackground;
