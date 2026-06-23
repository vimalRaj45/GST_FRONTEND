import React, { useEffect, useState } from 'react';

/**
 * SplashScreen
 * Flow: logo fades in small → zooms IN large → Enter button appears → user clicks → fades out
 */
export default function SplashScreen({ onDone }) {
  // phase: 'start' | 'zoom-in' | 'ready' | 'exit' | 'done'
  const [phase, setPhase] = useState('start');

  useEffect(() => {
    // 0 ms    → small logo visible (start)
    // 400 ms  → begin zoom-in  (transition: 1.6 s)
    // 2000 ms → zoom done, show Enter button (ready)
    const t1 = setTimeout(() => setPhase('zoom-in'), 400);
    const t2 = setTimeout(() => setPhase('ready'),   2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleEnter = () => {
    setPhase('exit');
    setTimeout(() => { setPhase('done'); onDone?.(); }, 700);
  };

  if (phase === 'done') return null;

  const isStart  = phase === 'start';
  const isZoomIn = phase === 'zoom-in';
  const isReady  = phase === 'ready';
  const isExit   = phase === 'exit';

  /* ── sizes ── */
  const logoSize = isStart ? '80px' : '260px';

  return (
    <>
      <style>{`
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes enterPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26, 60, 110, 0.25); }
          50%       { box-shadow: 0 0 0 10px rgba(26, 60, 110, 0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.2; }
          40%            { transform: scale(1);   opacity: 0.7; }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#ffffff',
        opacity:        isExit ? 0 : 1,
        transition:     isExit ? 'opacity 0.7s ease' : 'none',
        pointerEvents:  isExit ? 'none' : 'all',
        userSelect:     'none',
      }}>

        {/* Soft radial glow — grows with logo */}
        <div style={{
          position:      'absolute',
          width:         isStart ? '120px' : '380px',
          height:        isStart ? '120px' : '380px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(26,60,110,0.07) 0%, transparent 70%)',
          transition:    'width 1.6s cubic-bezier(0.22, 1, 0.36, 1), height 1.6s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }} />

        {/* ── Logo ── */}
        <img
          src="/logo.png"
          alt="Aadhira Solutions"
          style={{
            width:        logoSize,
            height:       logoSize,
            objectFit:    'contain',
            mixBlendMode: 'multiply',
            transition:   isZoomIn || isReady || isExit
              ? 'width 1.6s cubic-bezier(0.22, 1, 0.36, 1), height 1.6s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
            willChange:   'width, height',
            position:     'relative',
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {/* ── Brand Text ── */}
        <p style={{
          fontFamily:    "'Outfit', 'Inter', sans-serif",
          fontWeight:    800,
          fontSize:      isStart ? '0rem' : '2rem',
          color:         '#1a3c6e',
          letterSpacing: '-0.02em',
          margin:        '0',
          marginTop:     isStart ? '0px' : '20px',
          textAlign:     'center',
          overflow:      'hidden',
          transition:    isZoomIn || isReady || isExit
            ? 'font-size 1.6s cubic-bezier(0.22, 1, 0.36, 1), margin-top 1.6s ease'
            : 'none',
          willChange:    'font-size',
          position:      'relative',
        }}>
          Aadhira Solutions
        </p>

        <p style={{
          fontFamily:    "'Outfit', 'Inter', sans-serif",
          fontWeight:    400,
          fontSize:      isStart ? '0rem' : '0.85rem',
          color:         '#6b7a99',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin:        '0',
          marginTop:     isStart ? '0px' : '5px',
          textAlign:     'center',
          overflow:      'hidden',
          transition:    isZoomIn || isReady || isExit
            ? 'font-size 1.6s cubic-bezier(0.22, 1, 0.36, 1), margin-top 1.6s ease'
            : 'none',
          position:      'relative',
        }}>
          GST Learning Simulator
        </p>

        {/* ── Loading dots (zoom-in phase) ── */}
        {(isStart || isZoomIn) && (
          <div style={{ marginTop: '32px', display: 'flex', gap: '7px' }}>
            {['0s', '0.2s', '0.4s'].map((delay, i) => (
              <span key={i} style={{
                width:          '8px',
                height:         '8px',
                borderRadius:   '50%',
                background:     '#1a3c6e',
                display:        'inline-block',
                animation:      'dotBounce 1.3s ease-in-out infinite',
                animationDelay: delay,
              }} />
            ))}
          </div>
        )}

        {/* ── Enter Button (ready phase only) ── */}
        {isReady && (
          <button
            onClick={handleEnter}
            style={{
              marginTop:     '36px',
              padding:       '12px 48px',
              background:    '#1a3c6e',
              color:         '#ffffff',
              border:        'none',
              borderRadius:  '50px',
              fontFamily:    "'Outfit', 'Inter', sans-serif",
              fontWeight:    700,
              fontSize:      '1rem',
              letterSpacing: '0.04em',
              cursor:        'pointer',
              animation:     'splashFadeUp 0.5s ease forwards, enterPulse 2s ease-in-out 0.6s infinite',
              outline:       'none',
              transition:    'background 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background  = '#0d2548';
              e.currentTarget.style.transform   = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background  = '#1a3c6e';
              e.currentTarget.style.transform   = 'scale(1)';
            }}
          >
            Enter →
          </button>
        )}
      </div>
    </>
  );
}
