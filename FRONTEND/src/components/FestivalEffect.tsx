import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface FestivalEffectProps {
  enabled?: boolean;
  type?: 'diwali' | 'christmas' | 'newyear' | 'default';
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  color: string;
  opacity: number;
  rotation: number;
  spin: number;
  life: number;
  maxLife: number;
  shape: 'star' | 'spark' | 'dot';
  blur: number;
}

const FestivalEffect: React.FC<FestivalEffectProps> = ({ 
  enabled = true, 
  type = 'default' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastExplosionRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const getParticleColors = () => {
    switch(type) {
      case 'diwali':
        return ['#FF9933', '#FFD700', '#FF69B4', '#FF4500', '#FFFF00'];
      case 'christmas':
        return ['#FF0000', '#00FF00', '#FFD700', '#FFFFFF', '#C0C0C0'];
      case 'newyear':
        return ['#FFD700', '#C0C0C0', '#00FFFF', '#FF1493', '#7B68EE'];
      default:
        return ['#FFD700', '#FF69B4', '#00FFFF', '#FF4500', '#9370DB'];
    }
  };

  const createExplosion = (centerX: number, centerY: number) => {
 
    const now = Date.now();
    if (now - lastExplosionRef.current < 300) return;
    lastExplosionRef.current = now;

    const colors = getParticleColors();
    const particleCount = 12 + Math.floor(Math.random() * 15);
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 2.5;
      const shape = Math.random() > 0.8 ? 'star' : Math.random() > 0.6 ? 'spark' : 'dot';
      
      newParticles.push({
        x: centerX,
        y: centerY,
        size: 1.5 + Math.random() * 3,
        speedY: Math.sin(angle) * speed,
        speedX: Math.cos(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.7 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05,
        life: 60 + Math.floor(Math.random() * 40),
        maxLife: 100,
        shape,
        blur: Math.random() * 4 + 2
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-150);
  };

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


    const animate = () => {
      if (!ctx || !canvas) return;

      frameCountRef.current++;

  
      ctx.clearRect(0, 0, canvas.width, canvas.height);

 
      particlesRef.current = particlesRef.current.filter((particle) => {

        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.spin;
        particle.life -= 1;
        
 
        particle.speedY += 0.05;

   
        particle.opacity = (particle.life / particle.maxLife) * 0.7;

       
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -0.2;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -0.2;
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));
        }

        if (particle.life > 0 && particle.opacity > 0.05) {
      
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = particle.blur;
          ctx.globalAlpha = particle.opacity;

          if (particle.shape === 'star') {
       
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
              const x = Math.cos(angle) * particle.size * 1.5;
              const y = Math.sin(angle) * particle.size * 1.5;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              
              const innerAngle = angle + Math.PI / 5;
              const ix = Math.cos(innerAngle) * particle.size * 0.7;
              const iy = Math.sin(innerAngle) * particle.size * 0.7;
              ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.fillStyle = particle.color;
            ctx.fill();
          } else if (particle.shape === 'spark') {
       
            ctx.beginPath();
            ctx.moveTo(-particle.size, 0);
            ctx.lineTo(particle.size, 0);
            ctx.moveTo(0, -particle.size);
            ctx.lineTo(0, particle.size);
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
        
            ctx.beginPath();
            ctx.arc(0, 0, particle.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
          }

          ctx.restore();
        }

        return particle.life > 0;
      });

      if (frameCountRef.current % 60 === 0 && particlesRef.current.length < 100) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;
        createExplosion(x, y);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (canvas) {
            createExplosion(
              Math.random() * canvas.width,
              Math.random() * canvas.height * 0.5
            );
          }
        }, i * 200);
      }
    }, 500);

    animate();

   
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [enabled, type, theme]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[45]"
      style={{
        mixBlendMode: theme === 'dark' ? 'screen' : 'normal',
      }}
    />
  );
};


export default FestivalEffect;
