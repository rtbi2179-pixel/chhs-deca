import { useEffect, useRef } from "react";

const TRAIL_PARTICLE_COUNT = 4;

type Point = { x: number; y: number };

function place(element: HTMLElement | null, point: Point, scale = 1) {
  if (!element) return;
  element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${scale})`;
}

export function BlueBlazerCursor() {
  const coreRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target: Point = { x: -80, y: -80 };
    const core: Point = { ...target };
    const glow: Point = { ...target };
    const trail = Array.from({ length: TRAIL_PARTICLE_COUNT }, () => ({ ...target }));
    let frame = 0;
    let isEnabled = false;
    let hasPointer = false;

    const setEnabled = () => {
      isEnabled = finePointer.matches && !reducedMotion.matches;
      root.classList.toggle("blueblazer-cursor-active", isEnabled);
      if (!isEnabled) {
        window.cancelAnimationFrame(frame);
        coreRef.current?.classList.remove("is-visible");
        glowRef.current?.classList.remove("is-visible");
        pulseRef.current?.classList.remove("is-pulsing");
        trailRefs.current.forEach((particle) => particle?.classList.remove("is-visible"));
      } else if (hasPointer) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const render = () => {
      if (!isEnabled) return;
      core.x += (target.x - core.x) * 0.34;
      core.y += (target.y - core.y) * 0.34;
      glow.x += (target.x - glow.x) * 0.15;
      glow.y += (target.y - glow.y) * 0.15;
      place(coreRef.current, core);
      place(glowRef.current, glow, 1.2);

      trail.forEach((particle, index) => {
        const lead = index === 0 ? core : trail[index - 1];
        const easing = 0.32 - index * 0.02;
        particle.x += (lead.x - particle.x) * easing;
        particle.y += (lead.y - particle.y) * easing;
        place(trailRefs.current[index], particle, 1 - index * 0.11);
      });

      frame = window.requestAnimationFrame(render);
    };

    const show = () => {
      coreRef.current?.classList.add("is-visible");
      glowRef.current?.classList.add("is-visible");
      trailRefs.current.forEach((particle) => particle?.classList.add("is-visible"));
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isEnabled || event.pointerType && event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      if (!hasPointer) {
        hasPointer = true;
        show();
        frame = window.requestAnimationFrame(render);
      }
    };

    const onPointerLeave = () => {
      hasPointer = false;
      window.cancelAnimationFrame(frame);
      coreRef.current?.classList.remove("is-visible");
      glowRef.current?.classList.remove("is-visible");
      pulseRef.current?.classList.remove("is-pulsing");
      trailRefs.current.forEach((particle) => particle?.classList.remove("is-visible"));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isEnabled || event.pointerType && event.pointerType !== "mouse") return;
      const interactiveTarget = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']");
      if (interactiveTarget) return;
      const point = { x: event.clientX, y: event.clientY };
      target.x = point.x;
      target.y = point.y;
      place(pulseRef.current, point);
      pulseRef.current?.classList.remove("is-pulsing");
      void pulseRef.current?.offsetWidth;
      pulseRef.current?.classList.add("is-pulsing");
    };

    const onPointerEnter = () => {
      if (isEnabled) hasPointer = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.documentElement.addEventListener("pointerenter", onPointerEnter);
    finePointer.addEventListener("change", setEnabled);
    reducedMotion.addEventListener("change", setEnabled);
    setEnabled();

    return () => {
      window.cancelAnimationFrame(frame);
      root.classList.remove("blueblazer-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.documentElement.removeEventListener("pointerenter", onPointerEnter);
      finePointer.removeEventListener("change", setEnabled);
      reducedMotion.removeEventListener("change", setEnabled);
    };
  }, []);

  return <>
    <div ref={glowRef} aria-hidden="true" className="blueblazer-cursor-glow" />
    <div ref={pulseRef} aria-hidden="true" className="blueblazer-cursor-pulse"><span /></div>
    {Array.from({ length: TRAIL_PARTICLE_COUNT }, (_, index) => <span key={index} ref={(element) => { trailRefs.current[index] = element; }} aria-hidden="true" className="blueblazer-cursor-trail" style={{ "--trail-index": index } as React.CSSProperties} />)}
    <div ref={coreRef} aria-hidden="true" className="blueblazer-cursor-core"><span className="blueblazer-cursor-burn" /><span className="blueblazer-cursor-ring" /><span className="blueblazer-cursor-dot" /></div>
  </>;
}
