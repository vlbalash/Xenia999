import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Shot {
    id: number
    x: number
    y: number
    sparks: { id: number, angle: number, dist: number, size: number }[]
}

export const GlassEffect = () => {
    const [shots, setShots] = useState<Shot[]>([])
    const audioCtxRef = useRef<AudioContext | null>(null)

    // Reuse a single AudioContext
    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            audioCtxRef.current = new AudioContextClass()
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume()
        }
        return audioCtxRef.current
    }, [])

    useEffect(() => {
        let touchMoved = false

        const handleTouchStart = () => { touchMoved = false }
        const handleTouchMove = () => { touchMoved = true }

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[role="dialog"]')) return

            const sparks = Array.from({ length: 12 }).map((_, i) => ({
                id: i,
                angle: (Math.PI * 2 / 12) * i + (Math.random() - 0.5) * 0.5,
                dist: 30 + Math.random() * 60,
                size: 1 + Math.random() * 3
            }))

            const newShot: Shot = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
                sparks
            }

            setShots(prev => [...prev.slice(-10), newShot])

            // Muffled vacuum shot — reuse the single AudioContext
            try {
                const ctx = getAudioCtx()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = 'sine'
                osc.frequency.setValueAtTime(120, ctx.currentTime)
                osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15)
                gain.gain.setValueAtTime(0.4, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
                osc.connect(gain).connect(ctx.destination)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + 0.15)
            } catch {
                // Audio not available — silently skip
            }
        }

        const handleTouchEnd = (e: TouchEvent) => {
            // Don't fire shot effects on scroll gestures
            if (touchMoved) return
            const touch = e.changedTouches[0]
            if (!touch) return
            const target = touch.target as HTMLElement
            if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[role="dialog"]')) return

            const sparks = Array.from({ length: 12 }).map((_, i) => ({
                id: i,
                angle: (Math.PI * 2 / 12) * i + (Math.random() - 0.5) * 0.5,
                dist: 30 + Math.random() * 60,
                size: 1 + Math.random() * 3
            }))

            setShots(prev => [...prev.slice(-10), {
                id: Date.now(),
                x: touch.clientX,
                y: touch.clientY,
                sparks
            }])
        }

        window.addEventListener('mousedown', handleClick)
        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchmove', handleTouchMove, { passive: true })
        window.addEventListener('touchend', handleTouchEnd)

        return () => {
            window.removeEventListener('mousedown', handleClick)
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [getAudioCtx])

    // Cleanup AudioContext on unmount
    useEffect(() => {
        return () => {
            audioCtxRef.current?.close()
        }
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
            <AnimatePresence>
                {shots.map((shot) => (
                    <div
                        key={shot.id}
                        style={{
                            position: 'absolute',
                            left: shot.x,
                            top: shot.y,
                        }}
                    >
                        {/* Bullet Hole — glowing ring that fades */}
                        <motion.div
                            initial={{ opacity: 1, scale: 0 }}
                            animate={{ opacity: 0, scale: 1.2 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                top: -12,
                                left: -12,
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: '2px solid rgba(0, 255, 255, 0.8)',
                                boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 8px rgba(0, 255, 255, 0.3)',
                            }}
                        />

                        {/* Core flash */}
                        <motion.div
                            initial={{ opacity: 1, scale: 0 }}
                            animate={{ opacity: 0, scale: 2 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'absolute',
                                top: -4,
                                left: -4,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'white',
                                boxShadow: '0 0 30px white, 0 0 60px rgba(0,255,255,0.5)',
                            }}
                        />

                        {/* Sparks — flying outward */}
                        {shot.sparks.map((spark) => (
                            <motion.div
                                key={spark.id}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos(spark.angle) * spark.dist,
                                    y: Math.sin(spark.angle) * spark.dist,
                                    opacity: 0,
                                    scale: 0
                                }}
                                transition={{ duration: 0.4 + Math.random() * 0.3, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    top: -spark.size / 2,
                                    left: -spark.size / 2,
                                    width: spark.size,
                                    height: spark.size,
                                    borderRadius: '50%',
                                    background: spark.id % 3 === 0 ? '#00ffff' : spark.id % 3 === 1 ? '#ffffff' : '#ec4899',
                                    boxShadow: `0 0 6px ${spark.id % 2 === 0 ? '#00ffff' : '#ec4899'}`,
                                }}
                            />
                        ))}
                    </div>
                ))}
            </AnimatePresence>
        </div>
    )
}
