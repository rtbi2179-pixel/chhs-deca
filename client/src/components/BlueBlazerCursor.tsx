import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

function place(element: HTMLElement | null, point: Point) {
  if (!element) return;
  element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
}

export function BlueBlazerCursor() {
  const coreRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target: Point = { x: -80, y: -80 };
    let frame = 0;
    let isEnabled = false;
    let hasPointer = false;

    const hide = () => {
      coreRef.current?.classList.remove("is-visible");
      pulseRef.current?.classList.remove("is-pulsing");
    };

    const renderAtPointer = () => {
      frame = 0;
      if (!isEnabled || !hasPointer) return;
      place(coreRef.current, target);
    };

    const schedulePointerRender = () => {
      if (!frame) frame = window.requestAnimationFrame(renderAtPointer);
    };

    const setEnabled = () => {
      isEnabled = finePointer.matches && !reducedMotion.matches;
      root.classList.toggle("blueblazer-cursor-active", isEnabled);
      if (!isEnabled) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        hide();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isEnabled || event.pointerType && event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      if (!hasPointer) {
        hasPointer = true;
        coreRef.current?.classList.add("is-visible");
      }
      schedulePointerRender();
    };

    const onPointerLeave = () => {
      hasPointer = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
      hide();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isEnabled || event.pointerType && event.pointerType !== "mouse") return;
      const interactiveTarget = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']");
      if (interactiveTarget) return;
      const point = { x: event.clientX, y: event.clientY };
      target.x = point.x;
      target.y = point.y;
      hasPointer = true;
      coreRef.current?.classList.add("is-visible");
      place(coreRef.current, point);
      place(pulseRef.current, point);
      pulseRef.current?.classList.remove("is-pulsing");
      void pulseRef.current?.offsetWidth;
      pulseRef.current?.classList.add("is-pulsing");
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    finePointer.addEventListener("change", setEnabled);
    reducedMotion.addEventListener("change", setEnabled);
    setEnabled();

    return () => {
      window.cancelAnimationFrame(frame);
      root.classList.remove("blueblazer-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      finePointer.removeEventListener("change", setEnabled);
      reducedMotion.removeEventListener("change", setEnabled);
    };
  }, []);

  return <>
    <div ref={pulseRef} aria-hidden="true" className="blueblazer-cursor-pulse"><span /></div>
    <div ref={coreRef} aria-hidden="true" className="blueblazer-cursor-core"><span className="blueblazer-cursor-burn" /><span className="blueblazer-cursor-ring" /><span className="blueblazer-cursor-dot" /></div>
  </>;
}
