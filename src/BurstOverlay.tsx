import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Burst { id: number; x: number; y: number }

function WhiteBurst({ x, y, id }: { x: number; y: number; id: number }) {
    const count = 18
    
    return (
        <motion.div 
            className="burst-container" 
            initial={{ left: x, top: y }}
            aria-hidden="true"
        >
            {Array.from({ length: count }).map((_, i) => {
                const angle = (i / count) * 360
                const dist = 50 + Math.random() * 70
                const size = 3 + Math.random() * 7

                return (
                    <motion.div
                        key={`${id}-${i}`}
                        className="burst-particle"
                        style={{
                            // @ts-ignore
                            '--size': `${size}px`,
                            // @ts-ignore
                            '--angle': `${angle}deg`,
                            // @ts-ignore
                            '--dist': `${dist}px`,
                        }}
                    />
                )
            })}
        </motion.div>
    )
}

/**
 * BurstOverlay — pure DOM component rendered outside <Canvas>.
 * Listens for 'burst-particle' events dispatched by ShootingGallery
 * and renders confetti bursts at the correct screen position.
 */
export function BurstOverlay() {
    const [bursts, setBursts] = useState<Burst[]>([])

    useEffect(() => {
        const handleBurst = (e: Event) => {
            const { x, y, id } = (e as CustomEvent).detail as Burst
            setBursts(prev => [...prev, { x, y, id }])
            setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 900)
        }
        window.addEventListener('burst-particle', handleBurst)
        return () => window.removeEventListener('burst-particle', handleBurst)
    }, [])

    if (bursts.length === 0) return null
    return (
        <>
            {bursts.map(b => <WhiteBurst key={b.id} x={b.x} y={b.y} id={b.id} />)}
        </>
    )
}
