import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animates element from opacity:0, y:80 → opacity:1, y:0 when scrolled into view.
 * @param {React.RefObject} ref - ref to the target element
 * @param {object} options - optional overrides
 */
export function useScrollAnimation(ref, options = {}) {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 80 },
      {
        opacity: 1,
        y: 0,
        duration: options.duration || 0.9,
        ease: options.ease || 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: options.start || 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [ref, options.duration, options.ease, options.start]);
}

/**
 * Applies parallax scroll effect to a ref element.
 * @param {React.RefObject} ref
 * @param {number} speed - parallax multiplier (e.g. 0.3 = 30% of scroll speed)
 */
export function useParallax(ref, speed = 0.3) {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        const yPos = (progress - 0.5) * speed * 200;
        gsap.set(el, { y: yPos });
      },
    });

    return () => {
      st.kill();
    };
  }, [ref, speed]);
}
