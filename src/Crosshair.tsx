import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LaserBeam {
    id: number
    charge: number // 0..1
}

export const Crosshair = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [isClicked, setIsClicked] = useState(false)
    const [chargeLevel, setChargeLevel] = useState(0) // 0..1
    const [beams, setBeams] = useState<LaserBeam[]>([])
    const [isTouch, setIsTouch] = useState(false)
    const hasMoved = useRef(false)
    const chargeStartRef = useRef<number | null>(null)
    const chargeRafRef = useRef<number | null>(null)

    useEffect(() => {
        const handleTouchStart = () => setIsTouch(true)

        const handleMouseMove = (e: MouseEvent) => {
            hasMoved.current = true
            setMousePos({ x: e.clientX, y: e.clientY })
        }

        const handleMouseDown = () => {
            setIsClicked(true)
            chargeStartRef.current = Date.now()
            window.dispatchEvent(new Event('play-charge-start'))
            // Animate charge fill
            const tick = () => {
                if (!chargeStartRef.current) return
                const c = Math.min(1, (Date.now() - chargeStartRef.current) / 1500)
                setChargeLevel(c)
                if (c < 1) chargeRafRef.current = requestAnimationFrame(tick)
            }
            chargeRafRef.current = requestAnimationFrame(tick)
        }

        const handleMouseUp = () => {
            setIsClicked(false)
            chargeStartRef.current = null
            setChargeLevel(0)
            window.dispatchEvent(new Event('play-charge-stop'))
            if (chargeRafRef.current) cancelAnimationFrame(chargeRafRef.current)
        }

        // Listen for laser-beam event from ShootingGallery
        const handleLaserBeam = (e: Event) => {
            const charge = (e as CustomEvent).detail?.charge ?? 0
            const id = Date.now()
            setBeams(prev => [...prev, { id, charge }])
            // Remove after animation
            setTimeout(() => setBeams(prev => prev.filter(b => b.id !== id)), 300)
        }

        window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true })
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('laser-beam', handleLaserBeam)

        return () => {
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('laser-beam', handleLaserBeam)
            if (chargeRafRef.current) cancelAnimationFrame(chargeRafRef.current)
        }
    }, [])

    if (isTouch || !hasMoved.current) return null

    // Laser colour based on charge
    const laserColor = chargeLevel > 0.7 ? '#f472b6' : chargeLevel > 0.3 ? '#c084fc' : '#22d3ee'
    const ringColor  = chargeLevel > 0.5 ? '#f472b6' : '#22d3ee'


    return (
        <>
            {/* Laser beams — short DOM rays drawn from cursor outward */}
            <AnimatePresence>
                {beams.map(beam => (
                    <motion.div
                        key={beam.id}
                        initial={{ opacity: 1, scaleX: 0 }}
                        animate={{ opacity: [1, 0.6, 0], scaleX: [0, 1, 1.4] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={`fixed pointer-events-none z-[200] rounded-[2px] laser-origin-left ${
                            beam.charge > 0.7 ? 'laser-beam-high' : beam.charge > 0.3 ? 'laser-beam-mid' : 'laser-beam-low'
                        }`}
                        {...({
                            style: {
                                '--mouse-x': `${mousePos.x}px`,
                                '--mouse-y': `${mousePos.y}px`,
                                '--beam-width': `${80 + beam.charge * 200}px`,
                                '--beam-height': `${2 + beam.charge * 3}px`,
                                '--beam-offset-y': `${-(2 + beam.charge * 3) / 2}px`,
                            }
                        } as any)}
                        aria-hidden="true"
                    />
                ))}
            </AnimatePresence>

            <div
                className="crosshair-container-dynamic"
                {...({
                    style: {
                        '--mouse-x': `${mousePos.x}px`,
                        '--mouse-y': `${mousePos.y}px`,
                        '--ring-color': ringColor,
                        '--laser-color': laserColor
                    }
                } as any)}
                aria-hidden="true"
            >
                <motion.div
                    className="relative w-10 h-10 flex items-center justify-center"
                    animate={{ scale: isClicked ? 1.3 + chargeLevel * 0.5 : 1, rotate: isClicked ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    {/* Charge ring fills clockwise */}
                    {chargeLevel > 0 && (
                        <svg className="crosshair-svg" viewBox="0 0 48 48">
                            <circle
                                cx="24" cy="24" r="20"
                                fill="none"
                                stroke="var(--laser-color)"
                                strokeWidth="2"
                                strokeDasharray={`${chargeLevel * 125.6} 125.6`}
                                className="crosshair-charge-ring"
                            />
                        </svg>
                    )}

                    {/* Center dot */}
                    <div className="crosshair-center-dot crosshair-dot-glow" />

                    {/* Primary ring — changes color on charge */}
                    <div className="crosshair-primary-ring shadow-lg crosshair-ring-glow" />

                    {/* Cross hairs */}
                    <div className="crosshair-hair-h left-[-4px] crosshair-hair-bg" />
                    <div className="crosshair-hair-v top-[-4px] crosshair-hair-bg" />
                    <div className="crosshair-hair-h right-[-4px] crosshair-hair-bg" />
                    <div className="crosshair-hair-v bottom-[-4px] crosshair-hair-bg" />

                    {/* Rotating outer ring */}
                    <motion.div
                        className="absolute w-12 h-12 border-2 border-dashed rounded-full crosshair-outer-ring"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Decorative arcs */}
                    <div className="absolute inset-[-6px] rounded-full border-t-2 border-white opacity-40" />
                    <div className="absolute inset-[-6px] rounded-full border-b-2 border-white opacity-40" />
                </motion.div>
            </div>
        </>
    )
}
