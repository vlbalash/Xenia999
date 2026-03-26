import { useEffect, useRef, useState } from 'react'

export default function MixerCursor() {
  const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 400
  const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 300

  const [pos, setPos]             = useState({ x: cx, y: cy })
  const [visible, setVisible]     = useState(true)
  const [pressed, setPressed]     = useState(false)
  const [isPointer, setIsPointer] = useState(false)
  const [mixX, setMixX]           = useState(0.5)
  const [mixY, setMixY]           = useState(0.5)
  const [audioActive, setAudioActive] = useState(false)
  const [ringAngle, setRingAngle] = useState(0)

  const rafRef       = useRef<number | null>(null)
  const rawPos       = useRef({ x: cx, y: cy })
  const velocityRef  = useRef(0)
  const prevRawX     = useRef(cx)
  const isPressedRef = useRef(false)
  const ringAngleRef = useRef(0)

  useEffect(() => {
    document.body.classList.add('mixer-cursor-active')
    const onAudio = (e: Event) => setAudioActive((e as CustomEvent).detail.active)
    window.addEventListener('audio-active', onAudio)
    return () => {
      document.body.classList.remove('mixer-cursor-active')
      window.removeEventListener('audio-active', onAudio)
    }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - prevRawX.current
      prevRawX.current = e.clientX
      velocityRef.current = dx / window.innerWidth
      rawPos.current = { x: e.clientX, y: e.clientY }

      const mx = e.clientX / window.innerWidth
      const my = e.clientY / window.innerHeight
      setMixX(mx)
      setMixY(my)
      setVisible(true)

      // Detect hoverable elements — change crosshair color + fire hover sound
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el) {
        const nowPointer = window.getComputedStyle(el as Element).cursor === 'pointer'
        setIsPointer(prev => {
          if (nowPointer !== prev) {
            window.dispatchEvent(new CustomEvent(nowPointer ? 'hover-button-enter' : 'hover-button-leave'))
          }
          return nowPointer
        })
      }

      window.dispatchEvent(new CustomEvent('mixer-move', {
        detail: { x: mx, y: e.clientY / window.innerHeight }
      }))
      if (isPressedRef.current) {
        window.dispatchEvent(new CustomEvent('mixer-scratch-move', {
          detail: { x: mx, velocity: velocityRef.current }
        }))
      }
    }

    const onDown = () => {
      isPressedRef.current = true
      setPressed(true)
      window.dispatchEvent(new CustomEvent('play-kick'))
      window.dispatchEvent(new CustomEvent('bass-hold-start'))
      window.dispatchEvent(new CustomEvent('mixer-scratch-start'))
    }
    const onUp = () => {
      isPressedRef.current = false
      setPressed(false)
      window.dispatchEvent(new CustomEvent('bass-hold-stop'))
      window.dispatchEvent(new CustomEvent('mixer-scratch-stop'))
    }
    const onLeave = () => {
      setVisible(false)
      if (isPressedRef.current) {
        isPressedRef.current = false
        setPressed(false)
        window.dispatchEvent(new CustomEvent('mixer-scratch-stop'))
      }
    }
    const onEnter = () => setVisible(true)

    const tick = () => {
      // Direct position — no lag, snappy like a real cursor
      setPos({ x: rawPos.current.x, y: rawPos.current.y })

      // Slowly rotate outer ring
      ringAngleRef.current = (ringAngleRef.current + 0.35) % 360
      setRingAngle(ringAngleRef.current)

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const leftPct    = mixX * 100
  // Teal when normal, purple when hovering a button
  const color      = isPointer ? '#e879f9' : '#2dd4bf'
  const colorRgb   = isPointer ? '232,121,249' : '45,212,191'
  const glowOp     = pressed ? 0.5 : isPointer ? 0.3 : 0.15

  return (
    <div style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none', zIndex: 9999,
      overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.2s',
    }}>

      {/* ── Spotlight / flashlight from center ── */}
      <div style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          width: pressed ? 480 : isPointer ? 360 : 260,
          height: pressed ? 480 : isPointer ? 360 : 260,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: pressed
            ? `radial-gradient(circle, rgba(${colorRgb},0.13) 0%, rgba(${colorRgb},0.05) 35%, transparent 70%)`
            : `radial-gradient(circle, rgba(${colorRgb},0.07) 0%, rgba(${colorRgb},0.025) 40%, transparent 70%)`,
          transition: 'width 0.3s ease, height 0.3s ease, background 0.3s ease',
          willChange: 'transform',
        }} />
      </div>

      {/* ── Edge labels — always visible, show mixer position ── */}
      <div style={{
        position: 'absolute', left: 14, top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '9px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
        letterSpacing: '0.1em',
        color: `rgba(${colorRgb},${0.25 + (1 - mixX) * 0.65})`,
        textShadow: `0 0 8px rgba(${colorRgb},0.7)`,
        userSelect: 'none',
      }}>L</div>
      <div style={{
        position: 'absolute', right: 14, top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '9px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
        letterSpacing: '0.1em',
        color: `rgba(${colorRgb},${0.25 + mixX * 0.65})`,
        textShadow: `0 0 8px rgba(${colorRgb},0.7)`,
        userSelect: 'none',
      }}>R</div>
      <div style={{
        position: 'absolute', top: 14, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '9px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
        letterSpacing: '0.1em',
        color: `rgba(${colorRgb},${0.25 + (1 - mixY) * 0.65})`,
        textShadow: `0 0 8px rgba(${colorRgb},0.7)`,
        userSelect: 'none',
      }}>T</div>
      <div style={{
        position: 'absolute', bottom: 14, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '9px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
        letterSpacing: '0.1em',
        color: `rgba(${colorRgb},${0.25 + mixY * 0.65})`,
        textShadow: `0 0 8px rgba(${colorRgb},0.7)`,
        userSelect: 'none',
      }}>S</div>

      {/* ── Audio mixer crosshair lines — hidden ── */}
      {false && audioActive && (
        <>
          {/* ── HORIZONTAL DIAMOND STRING ── */}

          {/* Outer diffuse glow */}
          <div style={{
            position: 'absolute',
            top: pos.y, left: 0, right: 0,
            height: 11,
            transform: 'translateY(-50%)',
            background: `linear-gradient(90deg, transparent 0%, rgba(${colorRgb},0.06) 15%, rgba(${colorRgb},0.10) 50%, rgba(${colorRgb},0.06) 85%, transparent 100%)`,
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }} />

          {/* Filled glow — left portion (mix position) */}
          <div style={{
            position: 'absolute',
            top: pos.y, left: 0,
            width: `${leftPct}%`,
            height: 7,
            transform: 'translateY(-50%)',
            background: `linear-gradient(90deg, transparent 0%, rgba(${colorRgb},${pressed ? 0.5 : 0.25}) 20%, rgba(${colorRgb},${pressed ? 0.7 : 0.4}) 100%)`,
            filter: 'blur(2px)',
            transition: 'width 0.03s linear',
          }} />

          {/* Core string — bright white shimmer */}
          <div style={{
            position: 'absolute',
            top: pos.y, left: 0, right: 0,
            height: 1,
            transform: 'translateY(-50%)',
            background: `linear-gradient(90deg,
              transparent 0%,
              rgba(255,255,255,0.15) 5%,
              rgba(255,255,255,0.5) 15%,
              white 30%,
              rgba(${colorRgb},1) 50%,
              white 70%,
              rgba(255,255,255,0.5) 85%,
              rgba(255,255,255,0.15) 95%,
              transparent 100%),
              repeating-linear-gradient(90deg,
                transparent 0px, transparent 18px,
                rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px
              )`,
            backgroundSize: '100% 100%, 20px 100%',
            boxShadow: pressed
              ? `0 0 3px rgba(255,255,255,0.95), 0 0 8px rgba(${colorRgb},1), 0 0 20px rgba(${colorRgb},0.7)`
              : `0 0 2px rgba(255,255,255,0.8), 0 0 6px rgba(${colorRgb},0.7), 0 0 14px rgba(${colorRgb},0.3)`,
            animation: 'string-shimmer 4s linear infinite, string-pulse 2s ease-in-out infinite',
            transition: 'box-shadow 0.15s',
          }} />

          {/* L / R labels */}
          <div style={{
            position: 'absolute', left: 14, top: pos.y,
            transform: 'translateY(-50%)',
            fontSize: '8px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
            letterSpacing: '0.15em',
            color: `rgba(${colorRgb},${0.2 + (1 - mixX) * 0.7})`,
            textShadow: `0 0 8px rgba(${colorRgb},0.8)`,
            userSelect: 'none',
          }}>L</div>
          <div style={{
            position: 'absolute', right: 14, top: pos.y,
            transform: 'translateY(-50%)',
            fontSize: '8px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
            letterSpacing: '0.15em',
            color: `rgba(${colorRgb},${0.2 + mixX * 0.7})`,
            textShadow: `0 0 8px rgba(${colorRgb},0.8)`,
            userSelect: 'none',
          }}>R</div>

          {/* ── VERTICAL DIAMOND STRING ── */}

          {/* Outer diffuse glow */}
          <div style={{
            position: 'absolute',
            left: pos.x, top: 0, bottom: 0,
            width: 11,
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg, transparent 0%, rgba(${colorRgb},0.06) 15%, rgba(${colorRgb},0.10) 50%, rgba(${colorRgb},0.06) 85%, transparent 100%)`,
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }} />

          {/* Filled glow — bottom portion (filter open = top, closed = bottom) */}
          <div style={{
            position: 'absolute',
            left: pos.x,
            top: `${mixY * 100}%`,
            bottom: 0,
            width: 7,
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg, rgba(${colorRgb},${pressed ? 0.7 : 0.4}) 0%, rgba(${colorRgb},${pressed ? 0.5 : 0.25}) 80%, transparent 100%)`,
            filter: 'blur(2px)',
            transition: 'top 0.03s linear',
          }} />

          {/* Core string — bright white shimmer */}
          <div style={{
            position: 'absolute',
            left: pos.x, top: 0, bottom: 0,
            width: 1,
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg,
              transparent 0%,
              rgba(255,255,255,0.15) 5%,
              rgba(255,255,255,0.5) 15%,
              white 30%,
              rgba(${colorRgb},1) 50%,
              white 70%,
              rgba(255,255,255,0.5) 85%,
              rgba(255,255,255,0.15) 95%,
              transparent 100%),
              repeating-linear-gradient(180deg,
                transparent 0px, transparent 18px,
                rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px
              )`,
            backgroundSize: '100% 100%, 100% 20px',
            boxShadow: pressed
              ? `0 0 3px rgba(255,255,255,0.95), 0 0 8px rgba(${colorRgb},1), 0 0 20px rgba(${colorRgb},0.7)`
              : `0 0 2px rgba(255,255,255,0.8), 0 0 6px rgba(${colorRgb},0.7), 0 0 14px rgba(${colorRgb},0.3)`,
            animation: 'string-shimmer 4s linear infinite reverse, string-pulse 2.5s ease-in-out infinite',
            transition: 'box-shadow 0.15s',
          }} />

          {/* T / B labels */}
          <div style={{
            position: 'absolute', top: 14, left: pos.x,
            transform: 'translateX(-50%)',
            fontSize: '8px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
            letterSpacing: '0.15em',
            color: `rgba(${colorRgb},${0.2 + (1 - mixY) * 0.7})`,
            textShadow: `0 0 8px rgba(${colorRgb},0.8)`,
            userSelect: 'none',
          }}>T</div>
          <div style={{
            position: 'absolute', bottom: 14, left: pos.x,
            transform: 'translateX(-50%)',
            fontSize: '8px', fontFamily: "'Orbitron', monospace", fontWeight: 700,
            letterSpacing: '0.15em',
            color: `rgba(${colorRgb},${0.2 + mixY * 0.7})`,
            textShadow: `0 0 8px rgba(${colorRgb},0.8)`,
            userSelect: 'none',
          }}>B</div>
        </>
      )}

      {/* ── UFO Crosshair ── */}
      {/* Hot point = 32,32 in the 64×64 viewBox = exact center of this div */}
      <div style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        width: 64,
        height: 64,
        willChange: 'transform',
      }}>

        {/* Outer glow blob — bigger when pressing or hovering button */}
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${colorRgb},${glowOp}) 0%, transparent 55%)`,
          transition: 'background 0.15s',
          pointerEvents: 'none',
        }} />

        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="beam" x1="32" y1="37" x2="32" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={color} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.0"/>
            </linearGradient>
            <radialGradient id="dish-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* ── OUTER ROTATING DASHED RING ── */}
          <circle
            cx="32" cy="32" r="28"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="3 7"
            transform={`rotate(${ringAngle}, 32, 32)`}
          />

          {/* ── CROSSHAIR LINES — gaps where UFO body sits ── */}
          {/* Top — stops before dome */}
          <line x1="32" y1="4"  x2="32" y2="17" stroke={color} strokeWidth="1" strokeOpacity="0.7"/>
          {/* Bottom — starts after dish bottom */}
          <line x1="32" y1="37" x2="32" y2="60" stroke={color} strokeWidth="1" strokeOpacity="0.7"/>
          {/* Left — stops before dish left edge */}
          <line x1="4"  y1="32" x2="18" y2="32" stroke={color} strokeWidth="1" strokeOpacity="0.7"/>
          {/* Right — starts after dish right edge */}
          <line x1="46" y1="32" x2="60" y2="32" stroke={color} strokeWidth="1" strokeOpacity="0.7"/>

          {/* ── UFO — centered at 32,32 ── */}

          {/* Traction beam downward when pressed */}
          {pressed && (
            <path d="M24 37 L40 37 L44 56 L20 56 Z" fill="url(#beam)"/>
          )}

          {/* Dish soft glow */}
          <ellipse cx="32" cy="32" rx="20" ry="8" fill="url(#dish-glow)"/>

          {/* Dome — sits on top of dish, dome bottom = dish top = y=28 */}
          <path
            d="M23 28 Q23 19 32 19 Q41 19 41 28 Z"
            fill="rgba(8,20,40,0.92)"
            stroke={color}
            strokeWidth="1.1"
          />
          {/* Dome glass shimmer */}
          <path
            d="M26 27 Q26 22 32 22 Q35 22 37 25"
            fill="none"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Dome alien glow inside */}
          <ellipse cx="32" cy="25" rx="5" ry="4"
            fill={`rgba(${colorRgb},0.07)`}
          />

          {/* Main dish body — centered at 32,32 */}
          <ellipse cx="32" cy="32" rx="14" ry="4.5"
            fill="rgba(8,20,40,0.95)"
            stroke={color}
            strokeWidth="1.3"
          />
          {/* Dish metallic band */}
          <ellipse cx="32" cy="31.5" rx="10" ry="2.8"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Dish lights — 3 windows, blink when pressed */}
          <circle cx="25" cy="32" r="1.6" fill={color} opacity={pressed ? 1.0 : 0.5}/>
          <circle cx="32" cy="32" r="1.6" fill={color} opacity={pressed ? 1.0 : 0.75}/>
          <circle cx="39" cy="32" r="1.6" fill={color} opacity={pressed ? 1.0 : 0.5}/>

          {/* ── CENTER AIM DOT — красный ── */}
          <circle cx="32" cy="32" r="2.5" fill="#ff2222" opacity="0.95"/>
          <circle cx="32" cy="32" r="1"   fill="white"   opacity="0.9"/>
        </svg>
      </div>
    </div>
  )
}
