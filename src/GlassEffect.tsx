import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Spark {
    id: number
    angle: number
    dist: number
    size: number
}

interface Shot {
    id: number
    x: number
    y: number
    sparks: Spark[]
}

export const GlassEffect = () => {
    const [shots, setShots] = useState<Shot[]>([])
    const audioCtxRef = useRef<AudioContext | null>(null)

    const getAudioCtx = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return audioCtxRef.current
    }

    const playGlassSound = () => {
        const ctx = getAudioCtx()
        if (ctx.state === 'suspended') ctx.resume()

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    }

    useEffect(() => {
        const handleShoot = (e: Event) => {
            const { x, y } = (e as CustomEvent).detail
            const id = Date.now()
            
            const newSparks: Spark[] = Array.from({ length: 8 }).map((_, i) => ({
                id: id + i,
                angle: (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
                dist: 40 + Math.random() * 60,
                size: 1 + Math.random() * 2
            }))

            setShots(prev => [...prev, { id, x, y, sparks: newSparks }])
            playGlassSound()

            // Cleanup after animation
            setTimeout(() => {
                setShots(prev => prev.filter(s => s.id !== id))
            }, 1000)
        }

        window.addEventListener('laser-shoot', handleShoot)
        return () => {
            window.removeEventListener('laser-shoot', handleShoot)
            audioCtxRef.current?.close()
        }
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
            <AnimatePresence>
                {shots.map((shot) => (
                    <motion.div
                        key={shot.id}
                        className="shot-container"
                        initial={{ x: shot.x, y: shot.y }}
                        style={{ 
                            // @ts-ignore
                            '--shot-x': '0px', 
                            // @ts-ignore
                            '--shot-y': '0px'
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 1, scale: 0 }}
                            animate={{ opacity: 0, scale: 1.2 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="bullet-hole"
                        />

                        <motion.div
                            initial={{ opacity: 1, scale: 0 }}
                            animate={{ opacity: 0, scale: 2 }}
                            transition={{ duration: 0.3 }}
                            className="flash-core"
                        />

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
                                className="spark-particle"
                                style={{
                                    // @ts-ignore
                                    '--spark-size': `${spark.size}px`,
                                    // @ts-ignore
                                    '--spark-color': spark.id % 3 === 0 ? '#00ffff' : spark.id % 3 === 1 ? '#ffffff' : '#ec4899',
                                    // @ts-ignore
                                    '--spark-glow': spark.id % 2 === 0 ? '#00ffff' : '#ec4899'
                                }}
                            />
                        ))}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
