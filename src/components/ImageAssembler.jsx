import { useEffect, useRef, useCallback, useState } from 'react';
import { gsap } from 'gsap';

const COLS = 8;
const ROWS = 6;

/**
 * ImageAssembler — flagship animation component.
 * Splits a product image into a grid of tiles that fly in from random positions
 * and assemble into the full image.
 *
 * Props:
 *   src      - image URL
 *   width    - container width in px
 *   height   - container height in px
 *   trigger  - 'load' | 'scroll'
 *   className - optional extra class
 */
export default function ImageAssembler({ src, width = 600, height = 420, trigger = 'load', className = '' }) {
  const containerRef = useRef(null);
  const tilesRef = useRef([]);
  const animatedRef = useRef(false);
  const timelineRef = useRef(null);
  const [assembled, setAssembled] = useState(false);

  const tileW = width / COLS;
  const tileH = height / ROWS;

  const runAssembly = useCallback(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    const tiles = tilesRef.current.filter(Boolean);
    if (!tiles.length) return;

    // Shuffle tile order for random assembly sequence
    const shuffled = [...tiles].sort(() => Math.random() - 0.5);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Set initial random positions
    tiles.forEach((tile) => {
      const randomX = (Math.random() - 0.5) * vw * 1.4;
      const randomY = (Math.random() - 0.5) * vh * 1.4;
      const randomRot = (Math.random() - 0.5) * 60;
      gsap.set(tile, {
        x: randomX,
        y: randomY,
        rotation: randomRot,
        opacity: 0,
        scale: 0.6 + Math.random() * 0.4,
      });
    });

    const tl = gsap.timeline();
    timelineRef.current = tl;

    tl.to(shuffled, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
      duration: 1.8,
      ease: 'power3.out',
      stagger: {
        each: 0.02,
        from: 'random',
      },
      onComplete: () => setAssembled(true),
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (trigger === 'load') {
      // Small delay so image can load
      const timer = setTimeout(runAssembly, 200);
      return () => clearTimeout(timer);
    }

    if (trigger === 'scroll') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              runAssembly();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, runAssembly]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: width,
        height: height,
        overflow: 'visible',
      }}
    >
      {assembled ? (
        <img className="image-assembler__final" src={src} alt="" aria-hidden="true" />
      ) : Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          const index = row * COLS + col;
          const bgX = -(col * tileW);
          const bgY = -(row * tileH);

          return (
            <div
              key={index}
              ref={(el) => { tilesRef.current[index] = el; }}
              style={{
                position: 'absolute',
                left: col * tileW,
                top: row * tileH,
                width: tileW,
                height: tileH,
                backgroundImage: `url(${src})`,
                backgroundSize: `${width}px ${height}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
                backgroundRepeat: 'no-repeat',
                willChange: 'transform, opacity',
                opacity: 0,
              }}
            />
          );
        })
      )}
    </div>
  );
}
