import React, { useRef, useEffect } from 'react';

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays on browsers with strict autoplay policies
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85; // slightly slower for a calmer, luxurious ambient feel
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted on some devices until interaction; muted handles 99%
      });
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full -z-50 overflow-hidden pointer-events-none select-none bg-[#04040D]"
    >
      {/* Ambient Blurred High-Contrast Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover scale-110 filter blur-[36px] contrast-[145%] saturate-[160%] brightness-[0.62]"
      >
        <source src="/bg-ambient.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Vignette & Deep Contrast Shading */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04040D]/50 via-[#04040D]/30 to-[#04040D]/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(4,4,13,0.75)_80%,_rgba(4,4,13,0.95)_100%)]" />

      {/* Subtle Cool Tint Layer */}
      <div className="absolute inset-0 bg-primary/[0.04] mix-blend-screen" />
    </div>
  );
}
