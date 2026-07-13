import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  angle: number;
}

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
}

interface NetworkEdge {
  from: number;
  to: number;
}

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nodesRef = useRef<NetworkNode[]>([]);
  const edgesRef = useRef<NetworkEdge[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateCanvasSize();

    // Initialize particles (the small dots)
    const particlePositions = [
      // Top-left area
      { x: 0.05, y: 0.08, size: 0.6 },
      { x: 0.12, y: 0.12, size: 0.4 },
      { x: 0.08, y: 0.18, size: 0.5 },
      { x: 0.18, y: 0.1, size: 0.45 },
      { x: 0.22, y: 0.15, size: 0.55 },
      { x: 0.1, y: 0.25, size: 0.5 },
      { x: 0.15, y: 0.3, size: 0.4 },
      { x: 0.25, y: 0.2, size: 0.6 },
      { x: 0.3, y: 0.28, size: 0.45 },
      { x: 0.05, y: 0.35, size: 0.5 },
      
      // Top-center area
      { x: 0.35, y: 0.08, size: 0.55 },
      { x: 0.42, y: 0.12, size: 0.4 },
      { x: 0.38, y: 0.18, size: 0.5 },
      { x: 0.48, y: 0.1, size: 0.45 },
      { x: 0.45, y: 0.22, size: 0.55 },
      { x: 0.52, y: 0.15, size: 0.4 },
      { x: 0.58, y: 0.2, size: 0.6 },
      { x: 0.55, y: 0.28, size: 0.45 },
      
      // Top-right area
      { x: 0.65, y: 0.08, size: 0.5 },
      { x: 0.72, y: 0.12, size: 0.45 },
      { x: 0.68, y: 0.18, size: 0.55 },
      { x: 0.78, y: 0.1, size: 0.4 },
      { x: 0.85, y: 0.15, size: 0.6 },
      { x: 0.92, y: 0.12, size: 0.5 },
      { x: 0.88, y: 0.22, size: 0.45 },
      { x: 0.95, y: 0.25, size: 0.55 },
      
      // Middle-left area
      { x: 0.02, y: 0.4, size: 0.5 },
      { x: 0.08, y: 0.45, size: 0.45 },
      { x: 0.12, y: 0.5, size: 0.55 },
      { x: 0.18, y: 0.42, size: 0.4 },
      { x: 0.22, y: 0.55, size: 0.6 },
      { x: 0.1, y: 0.6, size: 0.45 },
      { x: 0.28, y: 0.48, size: 0.5 },
      { x: 0.32, y: 0.58, size: 0.55 },
      
      // Middle-center area
      { x: 0.38, y: 0.4, size: 0.45 },
      { x: 0.45, y: 0.45, size: 0.5 },
      { x: 0.42, y: 0.52, size: 0.55 },
      { x: 0.52, y: 0.48, size: 0.4 },
      { x: 0.58, y: 0.55, size: 0.6 },
      { x: 0.48, y: 0.62, size: 0.45 },
      { x: 0.62, y: 0.5, size: 0.5 },
      
      // Middle-right area
      { x: 0.68, y: 0.42, size: 0.55 },
      { x: 0.75, y: 0.48, size: 0.4 },
      { x: 0.82, y: 0.45, size: 0.6 },
      { x: 0.88, y: 0.52, size: 0.45 },
      { x: 0.92, y: 0.58, size: 0.5 },
      { x: 0.78, y: 0.6, size: 0.55 },
      
      // Bottom-left area
      { x: 0.05, y: 0.68, size: 0.5 },
      { x: 0.12, y: 0.72, size: 0.45 },
      { x: 0.18, y: 0.75, size: 0.55 },
      { x: 0.08, y: 0.82, size: 0.4 },
      { x: 0.22, y: 0.8, size: 0.6 },
      { x: 0.28, y: 0.85, size: 0.45 },
      
      // Bottom-center area
      { x: 0.35, y: 0.7, size: 0.5 },
      { x: 0.42, y: 0.75, size: 0.55 },
      { x: 0.48, y: 0.78, size: 0.4 },
      { x: 0.52, y: 0.85, size: 0.6 },
      { x: 0.38, y: 0.88, size: 0.45 },
      
      // Bottom-right area
      { x: 0.62, y: 0.72, size: 0.5 },
      { x: 0.68, y: 0.78, size: 0.45 },
      { x: 0.75, y: 0.75, size: 0.55 },
      { x: 0.82, y: 0.8, size: 0.4 },
      { x: 0.88, y: 0.75, size: 0.6 },
      { x: 0.92, y: 0.82, size: 0.5 },
      { x: 0.98, y: 0.88, size: 0.55 },
    ];

    const particles: Particle[] = particlePositions.map((config, i) => {
      const x = config.x * canvas.width;
      const y = config.y * canvas.height;
      return {
        id: i,
        x,
        y,
        baseX: x,
        baseY: y,
        size: config.size,
        opacity: 0.5 + Math.random() * 0.3,
        angle: Math.random() * Math.PI * 2,
      };
    });

    particlesRef.current = particles;

    // Initialize network nodes (the larger bright nodes)
    const nodePositions = [
      { x: 0.35, y: 0.25 },
      { x: 0.65, y: 0.35 },
      { x: 0.5, y: 0.55 },
      { x: 0.75, y: 0.65 },
      { x: 0.25, y: 0.65 },
      { x: 0.9, y: 0.2 },
    ];

    const nodes: NetworkNode[] = nodePositions.map((config, i) => {
      const x = config.x * canvas.width;
      const y = config.y * canvas.height;
      return {
        id: i,
        x,
        y,
        baseX: x,
        baseY: y,
        size: 3,
      };
    });

    nodesRef.current = nodes;

    // Define network edges
    const edges: NetworkEdge[] = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 0, to: 2 },
      { from: 1, to: 4 },
      { from: 3, to: 5 },
      { from: 2, to: 4 },
      { from: 5, to: 1 },
    ];

    edgesRef.current = edges;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(15, 23, 42, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw central glow (the shining light)
      const glowX = canvas.width * 0.6;
      const glowY = canvas.height * 0.45;
      const glowRadius = Math.min(canvas.width, canvas.height) * 0.35;

      // Create radial gradient for glow
      const glowGradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
      glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      glowGradient.addColorStop(0.3, 'rgba(59, 130, 246, 0.15)');
      glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bright center
      ctx.fillStyle = 'rgba(147, 197, 253, 0.8)';
      ctx.beginPath();
      ctx.arc(glowX, glowY, glowRadius * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw network nodes
      nodes.forEach((node) => {
        // Cursor repulsion for nodes
        const dx = node.x - mousePos.x;
        const dy = node.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 150;

        let targetX = node.baseX;
        let targetY = node.baseY;

        if (distance < repulsionRadius && distance > 0) {
          const repulsionForce = (1 - distance / repulsionRadius) * 2;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * repulsionForce * 30;
          targetY += Math.sin(angle) * repulsionForce * 30;
        }

        // Smooth movement
        node.x += (targetX - node.x) * 0.12;
        node.y += (targetY - node.y) * 0.12;

        // Draw node
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw glow around node
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw network edges
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      edges.forEach((edge) => {
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      });

      // Update and draw particles
      particles.forEach((particle) => {
        // Slow orbital movement
        particle.angle += 0.0008;
        const orbitRadius = 12;
        const orbitX = Math.cos(particle.angle) * orbitRadius;
        const orbitY = Math.sin(particle.angle) * orbitRadius;

        let targetX = particle.baseX + orbitX;
        let targetY = particle.baseY + orbitY;

        // Cursor repulsion
        const dx = particle.x - mousePos.x;
        const dy = particle.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 120;

        if (distance < repulsionRadius && distance > 0) {
          const repulsionForce = (1 - distance / repulsionRadius) * 2.5;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * repulsionForce * 25;
          targetY += Math.sin(angle) * repulsionForce * 25;
        }

        // Smooth movement
        particle.x += (targetX - particle.x) * 0.1;
        particle.y += (targetY - particle.y) * 0.1;

        // Twinkle effect
        const twinkle = Math.sin(now * 0.003 + particle.id) * 0.25 + 0.75;

        // Draw particle
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default InteractiveBackground;
