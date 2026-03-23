import { useEffect, useRef, useState } from 'react'

const PHASES = [
  { label: 'ORBIT',   from: 0,    to: 0.65 },
  { label: 'TENSION', from: 0.65, to: 0.74 },
  { label: 'LAUNCH',  from: 0.74, to: 1.0  },
]

const TRACK_H = 200 // px

export default function ScrollIndicator() {
  const [offset, setOffset] = useState(0)
  const rafPending = useRef(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail.offset as number
      if (!rafPending.current) {
        rafPending.current = true
        requestAnimationFrame(() => {
          setOffset(Math.min(1, Math.max(0, val)))
          rafPending.current = false
        })
      }
    }
    window.addEventListener('scroll-progress', handler)
    return () => window.removeEventListener('scroll-progress', handler)
  }, [])

  const dotY = Math.min(TRACK_H, offset * TRACK_H)
  const pct  = Math.round(offset * 100)

  const currentPhase = PHASES.findIndex(p => offset >= p.from && offset < p.to)
  const activePhase  = currentPhase === -1 ? PHASES.length - 1 : currentPhase

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 200,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      {/* Phase labels — positioned relative to their parent */}
      <div style={{ position: 'relative', height: TRACK_H, width: 52 }}>
        {PHASES.map((p, i) => {
          const midY = ((p.from + p.to) / 2) * TRACK_H
          const isActive = i === activePhase
          return (
            <div
              key={p.label}
              style={{
                position: 'absolute',
                right: 0,
                top: midY,
                transform: 'translateY(-50%)',
                fontSize: '7px',
                letterSpacing: '0.25em',
                fontWeight: 700,
                color: isActive ? '#2dd4bf' : 'rgba(255,255,255,0.18)',
                transition: 'color 0.4s ease',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {p.label}
            </div>
          )
        })}
      </div>

      {/* Track + dot */}
      <div style={{ position: 'relative', width: 2, height: TRACK_H }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 2,
        }} />

        {/* Filled portion */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: `${pct}%`,
          background: 'linear-gradient(to bottom, rgba(45,212,191,0.6), rgba(45,212,191,0.2))',
          borderRadius: 2,
        }} />

        {/* Phase tick marks */}
        {PHASES.slice(1).map(p => (
          <div
            key={p.label}
            style={{
              position: 'absolute',
              left: -3,
              top: p.from * TRACK_H,
              width: 8,
              height: 1,
              background: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-50%)',
            }}
          />
        ))}

        {/* Moving dot */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: dotY,
          transform: 'translate(-50%, -50%)',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#2dd4bf',
          boxShadow: '0 0 8px rgba(45,212,191,0.8), 0 0 16px rgba(45,212,191,0.3)',
        }} />
      </div>

      {/* Percentage */}
      <div style={{
        fontSize: '7px',
        letterSpacing: '0.1em',
        fontWeight: 700,
        color: 'rgba(45,212,191,0.65)',
        width: 22,
        textAlign: 'left',
      }}>
        {pct}
      </div>
    </div>
  )
}
