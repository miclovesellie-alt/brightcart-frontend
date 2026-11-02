import { useEffect, useRef, useState } from 'react';

const KEYFRAME_STYLES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeLeft {
  from { opacity: 0; transform: translateX(-50px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeRight {
  from { opacity: 0; transform: translateX(50px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes assemble {
  0%   { opacity: 0; transform: scale(0.3) translateY(30px); filter: blur(8px); }
  60%  { opacity: 0.8; transform: scale(1.05) translateY(-5px); filter: blur(1px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}
`;

const ANIMATION_MAP = {
  'fade-up': 'fadeUp',
  'fade-left': 'fadeLeft',
  'fade-right': 'fadeRight',
  'scale-in': 'scaleIn',
  'assemble': 'assemble',
};

let stylesInjected = false;

export default function ScrollReveal({ children, animation = 'fade-up', delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!stylesInjected) {
      const style = document.createElement('style');
      style.textContent = KEYFRAME_STYLES;
      document.head.appendChild(style);
      stylesInjected = true;
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const keyframe = ANIMATION_MAP[animation] || 'fadeUp';

  const animStyle = visible
    ? {
        animation: `${keyframe} 0.65s cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${delay}ms`,
      }
    : { opacity: 0 };

  return (
    <div ref={ref} style={animStyle} className={className}>
      {children}
    </div>
  );
}
