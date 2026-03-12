import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SnowEffectProps {
  enabled?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

const SnowEffect: React.FC<SnowEffectProps> = ({ 
  enabled = true, 
  intensity = 'medium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animationRef = useRef<number | null>(null); 
  const snowflakesRef = useRef<Snowflake[]>([]);

  const intensitySettings = {
    light: {
      count: 50,
      speed: 0.5,
      size: { min: 2, max: 4 },
      opacity: { min: 0.3, max: 0.6 }
    },
    medium: {
      count: 100,
      speed: 1,
      size: { min: 2, max: 6 },
      opacity: { min: 0.4, max: 0.8 }
    },
    heavy: {
      count: 200,
      speed: 1.5,
      size: { min: 2, max: 8 },
      opacity: { min: 0.5, max: 1 }
    }
  };

  const settings = intensitySettings[intensity];

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);


    const initSnowflakes = () => {
      snowflakesRef.current = [];
      for (let i = 0; i < settings.count; i++) {
        snowflakesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * (settings.size.max - settings.size.min) + settings.size.min,
          speed: Math.random() * settings.speed + 0.5,
          opacity: Math.random() * (settings.opacity.max - settings.opacity.min) + settings.opacity.min,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.02 + 0.01
        });
      }
    };
    initSnowflakes();


    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((flake) => {

        flake.y += flake.speed;
        flake.x += Math.sin(flake.wobble) * 0.5;
        flake.wobble += flake.wobbleSpeed;

        if (flake.y > canvas.height) {
          flake.y = 0;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;

      
        ctx.beginPath();
        
     
        if (theme === 'dark') {
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * 0.8})`;
          ctx.shadowColor = 'rgba(200, 220, 255, 0.5)';
        }
        
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();

        if (flake.radius > 4 && Math.random() < 0.01) {
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null; 
      }
    };
  }, [enabled, intensity, theme, settings]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[45]"
      style={{
        mixBlendMode: theme === 'dark' ? 'screen' : 'normal',
        opacity: 0.8
      }}
    />
  );
};


export default SnowEffect;
