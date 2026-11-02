import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, RotateCcw } from 'lucide-react';

/**
 * Interactive AirPods Showcase:
 * - Direct video representation of the Apple AirPods Pro GIF/MP4 assembling and opening.
 * - Interactive mouse tilt/3D parallax effect on hover.
 * - Click to play/pause or trigger smooth time-scrub / pulse.
 * - Floating status indicators & audio ambient glow.
 */
export default function AirpodsAnimation() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');
  const [interactionState, setInteractionState] = useState('Assembling & Ejecting');

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

  const handleMouseLeave = () => {
    setHovered(false);
    setTransformStyle('perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setInteractionState('Playing');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setInteractionState('Paused');
    }
  };

  const restartVideo = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
    setInteractionState('Re-assembling');
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
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
          background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.45) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(147, 197, 253, 0.3) 100%)',
          boxShadow: hovered 
            ? '0 16px 40px -10px rgba(79, 142, 247, 0.5), 0 0 25px 2px rgba(59, 130, 246, 0.3)' 
            : '0 10px 30px -10px rgba(79, 142, 247, 0.25)',
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
            border: '1px solid rgba(79, 142, 247, 0.35)',
            fontSize: '11px',
            fontWeight: 700,
            color: '#93c5fd',
            letterSpacing: '0.04em',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? '#3b82f6' : '#94a3b8',
            boxShadow: isPlaying ? '0 0 8px #60a5fa' : 'none',
          }} />
          AirPods Pro
        </div>

        {/* Restart button */}
        <button
          onClick={restartVideo}
          title="Re-run animation"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            cursor: 'pointer',
            opacity: hovered ? 1 : 0.6,
            transition: 'opacity 0.2s',
          }}
        >
          <RotateCcw size={13} />
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
            src="/airpods-pro.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.05)',
              filter: 'contrast(1.08) brightness(1.05)',
            }}
          />

          {/* Bottom gradient overlay to blend into the card */}
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
                border: '1px solid rgba(79, 142, 247, 0.4)',
                fontSize: '11px',
                color: '#e2e8f0',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Sparkles size={12} color="#60a5fa" />
              <span>{isPlaying ? 'Click to Freeze' : 'Click to Resume'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description tag beneath */}
      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          AirPods Pro Case Open
        </p>
        <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
          Disassembles & drops out on ground
        </p>
      </div>
    </div>
  );
}
