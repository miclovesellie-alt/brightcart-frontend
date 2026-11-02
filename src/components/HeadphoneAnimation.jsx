import { useState, useRef } from 'react';
import { Sparkles, Sliders, Play, Pause } from 'lucide-react';

/**
 * Interactive Studio Headphones Showcase:
 * - Fluid slow-motion 3D rotation video of premium over-ear headphones.
 * - Interactive 3D tilt tracking with cursor perspective.
 * - Dynamic playback rate (slow-motion toggle on hover or click).
 * - Click to cycle speeds / play / pause with studio lighting aura.
 */
export default function HeadphoneAnimation() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');

  // Interactive 3D tilt tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Smooth 3D tilt calculation
    const rotX = -(y / (rect.height / 2)) * 14;
    const rotY = (x / (rect.width / 2)) * 14;
    setTransformStyle(`perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04)`);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    // Smoothly enter slow motion when hovered for cinematic feel
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.55;
      setIsSlowMo(true);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTransformStyle('perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      setIsSlowMo(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleSpeed = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.playbackRate < 0.8) {
      videoRef.current.playbackRate = 1.25;
      setIsSlowMo(false);
    } else {
      videoRef.current.playbackRate = 0.4;
      setIsSlowMo(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={togglePlay}
      style={{
        width: '240px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.15s ease-out',
        transform: transformStyle,
      }}
    >
      {/* Outer ambient glow wrapper */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '24px',
          padding: '4px',
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.45) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(216, 180, 254, 0.3) 100%)',
          boxShadow: hovered 
            ? '0 16px 40px -10px rgba(167, 139, 250, 0.5), 0 0 25px 2px rgba(139, 92, 246, 0.3)' 
            : '0 10px 30px -10px rgba(167, 139, 250, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top Floating Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(10, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(167, 139, 250, 0.35)',
            fontSize: '11px',
            fontWeight: 700,
            color: '#c4b5fd',
            letterSpacing: '0.04em',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? '#a78bfa' : '#94a3b8',
            boxShadow: isPlaying ? '0 0 8px #c084fc' : 'none',
          }} />
          Studio Wireless
        </div>

        {/* Speed toggle control */}
        <button
          onClick={toggleSpeed}
          title="Toggle speed / slow-motion"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '16px',
            background: 'rgba(10, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: isSlowMo ? '#a78bfa' : '#e2e8f0',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: hovered ? 1 : 0.7,
            transition: 'all 0.2s',
          }}
        >
          <Sliders size={11} />
          <span>{isSlowMo ? '0.5x' : '1.0x'}</span>
        </button>

        {/* Video Surface Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#050508',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            src="/headphones-beats.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.06)',
              filter: 'contrast(1.06) brightness(1.02)',
            }}
          />

          {/* Bottom gradient overlay to blend seamlessly */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '65px',
              background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Action indicator on hover */}
          {hovered && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(167, 139, 250, 0.4)',
                fontSize: '11px',
                color: '#e2e8f0',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Sparkles size={12} color="#c084fc" />
              <span>{isPlaying ? 'Slow-mo active · Click to Freeze' : 'Click to Resume'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description tag beneath */}
      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          Over-Ear Headphones
        </p>
        <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
          360° Studio Orbit Rotation
        </p>
      </div>
    </div>
  );
}
