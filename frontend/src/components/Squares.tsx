/**
 * An animated grid background component consisting of moving squares.
 * Supports directional movement (up, down, left, right, diagonal), adjustable speed,
 * customizable square sizes, and interactive hover effects.
 */

import React, { useRef, useEffect } from 'react';

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface GridOffset {
  x: number;
  y: number;
}

export interface SquaresProps {
  /**
   * Direction of the grid movement
   * @default 'right'
   */
  direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
  /**
   * Movement speed of the squares
   * @default 1
   */
  speed?: number;
  /**
   * Color of the square borders
   * @default '#999'
   */
  borderColor?: CanvasStrokeStyle;
  /**
   * Size of each individual square in pixels
   * @default 40
   */
  squareSize?: number;
  /**
   * Background color when a square is hovered
   * @default '#222'
   */
  hoverFillColor?: CanvasStrokeStyle;
}

export const Squares: React.FC<SquaresProps> = ({
  direction = 'right',
  speed = 1,
  borderColor = '#999',
  squareSize = 40,
  hoverFillColor = '#222'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const numSquaresX = useRef<number>(0);
  const numSquaresY = useRef<number>(0);
  const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });
  const hoveredSquareRef = useRef<GridOffset | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const mouseTrailRef = useRef<{ x: number; y: number; time: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      numSquaresX.current = Math.ceil(canvas.width / squareSize) + 1;
      numSquaresY.current = Math.ceil(canvas.height / squareSize) + 1;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawGrid = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;

      const now = performance.now();

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize);
          const squareY = y - (gridOffset.current.y % squareSize);

          const gridX = Math.floor((x - startX) / squareSize);
          const gridY = Math.floor((y - startY) / squareSize);

          const isHovered = hoveredSquareRef.current &&
            gridX === hoveredSquareRef.current.x &&
            gridY === hoveredSquareRef.current.y;

          let currentStroke = borderColor as string;
          let currentFill = 'transparent';
          let lineW = 0.5;

          // Process fading trail effect
          let maxStrength = 0;
          for (let i = 0; i < mouseTrailRef.current.length; i++) {
            const point = mouseTrailRef.current[i];
            const dx = point.x - (squareX + squareSize / 2);
            const dy = point.y - (squareY + squareSize / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) { 
              const age = now - point.time;
              const ageFactor = Math.max(0, 1 - (age / 1200)); 
              const distFactor = Math.pow(1 - dist / 150, 1.2);
              const strength = distFactor * ageFactor;
              if (strength > maxStrength) maxStrength = strength;
            }
          }

          if (maxStrength > 0) {
              currentStroke = `rgba(96, 165, 250, ${Math.max(0.1, maxStrength * 0.9)})`;
              currentFill = `rgba(96, 165, 250, ${maxStrength * 0.4})`;
              lineW = 0.5 + (maxStrength * 1.5);
          }

          if (isHovered) {
             currentFill = hoverFillColor as string;
             currentStroke = `rgba(255, 255, 255, 0.9)`;
             lineW = 2;
          }

          if (currentFill !== 'transparent') {
             ctx.fillStyle = currentFill;
             ctx.fillRect(squareX, squareY, squareSize, squareSize);
          }

          ctx.lineWidth = lineW;
          ctx.strokeStyle = currentStroke;
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        }
      }

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2)) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(6, 0, 16, 0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const updateAnimation = () => {
      const now = performance.now();
      mouseTrailRef.current = mouseTrailRef.current.filter(p => now - p.time < 1200);

      const effectiveSpeed = Math.max(speed, 0.1);
      switch (direction) {
        case 'right':
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
          break;
        case 'left':
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize;
          break;
        case 'up':
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize;
          break;
        case 'down':
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;
          break;
        case 'diagonal':
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;
          break;
        default:
          break;
      }
      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      mouseRef.current = { x: mouseX, y: mouseY };

      // Add to trail with simple throttling
      const trail = mouseTrailRef.current;
      const lastPt = trail[trail.length - 1];
      if (!lastPt || Math.abs(lastPt.x - mouseX) > 15 || Math.abs(lastPt.y - mouseY) > 15) {
         trail.push({ x: mouseX, y: mouseY, time: performance.now() });
      } else if (lastPt) {
         lastPt.time = performance.now();
      }

      const hoveredSquareX = Math.floor((mouseX + (gridOffset.current.x % squareSize)) / squareSize);
      const hoveredSquareY = Math.floor((mouseY + (gridOffset.current.y % squareSize)) / squareSize);

      hoveredSquareRef.current = { x: hoveredSquareX, y: hoveredSquareY };
    };

    const handleMouseLeave = () => {
      hoveredSquareRef.current = null;
      mouseRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full border-none block bg-transparent"
    />
  );
};
