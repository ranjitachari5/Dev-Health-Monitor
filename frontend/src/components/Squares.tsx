import React, { useRef, useEffect } from 'react';

export interface SquaresProps {
  direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
}

export const Squares: React.FC<SquaresProps> = ({
  direction = 'right',
  speed = 1,
  borderColor = 'rgba(59,130,246,0.08)',
  squareSize = 60,
  hoverFillColor = 'rgba(30,64,175,0.15)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const numSquaresX = useRef<number>(0);
  const numSquaresY = useRef<number>(0);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquareRef = useRef<{ x: number; y: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;
      ctx.lineWidth = 0.5;

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize);
          const squareY = y - (gridOffset.current.y % squareSize);
          const gridX = Math.floor((x - startX) / squareSize);
          const gridY = Math.floor((y - startY) / squareSize);

          const isHovered = hoveredSquareRef.current &&
            gridX === hoveredSquareRef.current.x &&
            gridY === hoveredSquareRef.current.y;

          // Cursor proximity glow
          if (mouseRef.current) {
            const cx = squareX + squareSize / 2;
            const cy = squareY + squareSize / 2;
            const dx = mouseRef.current.x - cx;
            const dy = mouseRef.current.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              const strength = 1 - dist / 180;
              ctx.fillStyle = `rgba(30,64,175,${strength * 0.18})`;
              ctx.fillRect(squareX, squareY, squareSize, squareSize);
            }
          }

          if (isHovered) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(squareX, squareY, squareSize, squareSize);
          }

          ctx.strokeStyle = borderColor;
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        }
      }

      // Vignette overlay
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2,
        Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2)) / 2
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(5,5,16,0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.1);
      switch (direction) {
        case 'right': gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize; break;
        case 'left': gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize; break;
        case 'up': gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize; break;
        case 'down': gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize; break;
        case 'diagonal':
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize; break;
      }
      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      mouseRef.current = { x: mouseX, y: mouseY };
      hoveredSquareRef.current = {
        x: Math.floor((mouseX + (gridOffset.current.x % squareSize)) / squareSize),
        y: Math.floor((mouseY + (gridOffset.current.y % squareSize)) / squareSize),
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => {
      hoveredSquareRef.current = null;
      mouseRef.current = null;
    });
    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return <canvas ref={canvasRef} className="w-full h-full border-none block bg-transparent" />;
};
