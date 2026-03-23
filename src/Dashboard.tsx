import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ColorPreset {
  name: string
  hex: string
  glow: string
}

interface DashboardProps {
  onActivate: () => void
  onToggleAudio: () => void
  onNextColor: () => void
  currentColor: ColorPreset
  isOpen: boolean
}

export const Dashboard: React.FC<DashboardProps> = ({
  onActivate,
  onToggleAudio,
  onNextColor,
  currentColor,
  isOpen,
}) => {
  const [audioOn, setAudioOn] = useState(false)
  const [burst, setBurst] = useState(false)
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (burstTimerRef.current) clearTimeout(burstTimerRef.current) }
  }, [])

  if (isOpen) return null

  const handleAudio = () => {
    onToggleAudio()
    setAudioOn(p => !p)
  }

  const handleColor = () => {
    onNextColor()
    setBurst(true)
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
    burstTimerRef.current = setTimeout(() => setBurst(false), 700)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ fontFamily: "'Inter', 'Orbitron', sans-serif" }}
    >
      <div
        className="pointer-events-auto relative flex items-stretch px-2 py-2 mt-6 gap-1"
        style={{
          background: 'rgba(8, 14, 24, 0.55)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '9999px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >

        {/* PRIMARY CTA — Start Project */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onActivate}
          className="relative flex items-center gap-3 px-10 py-3.5 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #22d3ee 100%)',
            boxShadow: '0 0 28px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          {/* Shimmer sweep */}
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPositionX: ['200%', '-200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.25em', color: '#0a1a1a', textTransform: 'uppercase', position: 'relative' }}>
            + Start Project
          </span>
        </motion.button>

        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', margin: '6px 4px' }} />

        {/* Audio Toggle — ON AIR radio style */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleAudio}
          className="relative flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden"
          style={{
            background: audioOn
              ? 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)'
              : 'rgba(255,255,255,0.04)',
            border: audioOn
              ? '1px solid rgba(252,165,165,0.45)'
              : '1px solid rgba(255,255,255,0.08)',
            boxShadow: audioOn
              ? '0 0 24px rgba(239,68,68,0.55), 0 0 48px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
              : 'none',
            transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Pulsing LED dot */}
          <motion.span
            animate={audioOn
              ? { opacity: [1, 0.2, 1], scale: [1, 0.8, 1] }
              : { opacity: 0.2, scale: 1 }}
            transition={audioOn
              ? { duration: 1.0, repeat: Infinity, ease: 'easeInOut' }
              : {}}
            style={{
              display: 'block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: audioOn ? '#ffffff' : 'rgba(255,255,255,0.25)',
              boxShadow: audioOn ? '0 0 8px #fff, 0 0 18px rgba(255,120,120,0.9)' : 'none',
              flexShrink: 0,
            }}
          />
          {/* Label */}
          <span style={{
            fontSize: '9px',
            fontWeight: 900,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: "'Orbitron', sans-serif",
            color: audioOn ? '#ffffff' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.3s',
          }}>
            {audioOn ? 'ON AIR' : 'OFF'}
          </span>
        </motion.button>

        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', margin: '6px 4px' }} />

        {/* ── LIGHT BUTTON ── Color cycle for right sphere */}
        <motion.button
          layout
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleColor}
          className="relative flex items-center gap-3 px-6 py-2.5 rounded-full overflow-hidden"
          style={{
            border: `1px solid ${currentColor.hex}55`,
            transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
            boxShadow: `0 0 ${burst ? '30px' : '12px'} ${currentColor.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
          animate={{
            boxShadow: burst
              ? [`0 0 12px ${currentColor.glow}`, `0 0 50px ${currentColor.glow}`, `0 0 14px ${currentColor.glow}`]
              : `0 0 12px ${currentColor.glow}`
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Burst flash overlay */}
          <AnimatePresence>
            {burst && (
              <motion.span
                key="burst"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: currentColor.hex }}
                initial={{ opacity: 0.7, scale: 0.8 }}
                animate={{ opacity: 0, scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Color swatch dot — animated hue shift */}
          <motion.span
            className="relative rounded-full flex-shrink-0"
            style={{
              width: 10,
              height: 10,
              background: currentColor.hex,
              boxShadow: `0 0 8px ${currentColor.glow}, 0 0 16px ${currentColor.glow}`,
            }}
            animate={{
              background: currentColor.hex,
              boxShadow: [
                `0 0 6px ${currentColor.glow}`,
                `0 0 18px ${currentColor.glow}`,
                `0 0 6px ${currentColor.glow}`,
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Label — transitions smoothly */}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentColor.name}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: currentColor.hex, textTransform: 'uppercase', position: 'relative' }}
            >
              {currentColor.name}
            </motion.span>
          </AnimatePresence>
        </motion.button>

      </div>

    </motion.div>
  )
}
