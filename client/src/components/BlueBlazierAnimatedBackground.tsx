import React, { useEffect, useRef, useState } from 'react';
import { useMotionValue, useTransform, motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  depth: number;
}

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulsePhase: number;
}

export const BlueBlazierAnimatedBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nodesRef = useRef<NetworkNode[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent | Event) => {
      if (e instanceof MediaQueryListEvent) setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handler as EventListener);
    return () => mediaQuery.removeEventListener('change', handler as EventListener);
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize particles and nodes
  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    const particleCount = isMobile ? 30 : 80;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        depth: Math.random() * 3,
      });
    }
    particlesRef.current = particles;

    // Create network nodes
    const nodes: NetworkNode[] = [];
    const nodeCount = isMobile ? 4 : 8;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.random() * width * 0.7 + width * 0.15,
        y: Math.random() * height * 0.7 + height * 0.15,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    nodesRef.current = nodes;
  }, [isMobile, prefersReducedMotion]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let animationTime = 0;

    const animate = () => {
      animationTime += 1;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Gentle twinkle effect
        const twinkle = Math.sin(animationTime * 0.02 + particle.id) * 0.3 + 0.7;
        const depthOpacity = particle.opacity * (0.3 + particle.depth * 0.2) * twinkle;

        // Draw particle
        ctx.fillStyle = `rgba(59, 130, 246, ${depthOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw network nodes
      nodesRef.current.forEach((node, idx) => {
        // Update position slowly
        node.x += node.vx * 0.1;
        node.y += node.vy * 0.1;
        node.pulsePhase += 0.02;

        // Wrap around
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Breathing pulse effect
        const pulse = Math.sin(node.pulsePhase) * 0.3 + 0.7;
        const nodeSize = 2 + pulse;
        const nodeOpacity = 0.6 * pulse;

        // Draw node
        ctx.fillStyle = `rgba(96, 165, 250, ${nodeOpacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines to nearby nodes
        nodesRef.current.forEach((otherNode, otherIdx) => {
          if (otherIdx <= idx) return;
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            const lineOpacity = (1 - distance / 200) * 0.3 * pulse;
            ctx.strokeStyle = `rgba(96, 165, 250, ${lineOpacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw central glow with breathing effect
      const breathe = Math.sin(animationTime * 0.01) * 0.2 + 0.8;
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 300 * breathe);
      gradient.addColorStop(0, `rgba(59, 130, 246, ${0.15 * breathe})`);
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [prefersReducedMotion]);

  // Parallax effect reserved for future enhancement

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(to bottom, rgb(15, 23, 42), rgb(7, 12, 25))' }}
      />
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-slate-950/20 pointer-events-none" />
    </div>
  );
};

export default BlueBlazierAnimatedBackground;
