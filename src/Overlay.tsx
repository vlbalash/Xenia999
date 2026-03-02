import { Scroll, useScroll } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, MouseEvent, useEffect } from 'react'

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
}

export const Overlay = () => {
    const [shotPositions, setShotPositions] = useState<{ x: number, y: number, id: number }[]>([])
    const [discountActive, setDiscountActive] = useState(false)
    const scroll = useScroll()
    const [scrollOffset, setScrollOffset] = useState(0)

    useEffect(() => {
        const handleScroll = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.offset === 'number') {
                setScrollOffset(detail.offset);
            }
        };
        window.addEventListener('scroll-offset', handleScroll);
        return () => window.removeEventListener('scroll-offset', handleScroll);
    }, [])

    const BULLET_LIMIT = 3

    useEffect(() => {
        const handleDiscount = () => setDiscountActive(true)
        window.addEventListener('discount-unlocked', handleDiscount)
        return () => window.removeEventListener('discount-unlocked', handleDiscount)
    }, [])

    const handleShootEnia = (e: MouseEvent<HTMLSpanElement>) => {
        if (shotPositions.length >= BULLET_LIMIT) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setShotPositions(prev => [...prev, { x, y, id: Date.now() }])
        window.dispatchEvent(new Event('play-glass-break'))
    }

    return (
        <Scroll html>
            <section className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-center relative z-10">
                    <motion.h1
                        className="text-[15vw] md:text-[12rem] font-black leading-none tracking-tighter mix-blend-difference text-white mb-4 font-orbitron"
                        {...fadeInUp}
                    >
                        XXX
                        <br />
                        <motion.span
                            onClick={handleShootEnia}
                            className={`inline-block relative ${shotPositions.length >= BULLET_LIMIT ? 'cursor-default' : 'cursor-crosshair'} text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 font-orbitron drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] outline-none select-none pointer-events-auto`}
                            animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        >
                            ENIA
                            {/* Bullet hole effects */}
                            {shotPositions.map((shot) => {
                                const holeStyle: React.CSSProperties = {
                                    left: `${shot.x - 16}px`,
                                    top: `${shot.y - 16}px`,
                                } as React.CSSProperties;

                                return (
                                    <motion.div
                                        key={shot.id}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.8 }}
                                        className="absolute w-8 h-8 pointer-events-none"
                                        style={holeStyle}
                                    >
                                        <div className="absolute inset-0 bg-black rounded-full shadow-[inset_0_0_5px_rgba(0,0,0,1)] z-10" />
                                        <div className="absolute inset-[-4px] rounded-full border border-gray-500/30 bg-gray-600/20 backdrop-blur-sm z-0" />
                                        <div className="absolute inset-[-12px] bg-[radial-gradient(circle_at_center,transparent_20%,rgba(255,255,255,0.1)_25%,transparent_50%)] z-20" />
                                        <svg className="absolute inset-[-16px] w-[64px] h-[64px] opacity-40 mix-blend-screen pointer-events-none" viewBox="0 0 100 100" aria-hidden="true">
                                            <path d="M50 50 L20 20 M50 50 L80 15 M50 50 L85 60 M50 50 L40 90 M50 50 L10 65" stroke="white" strokeWidth="1" />
                                        </svg>
                                    </motion.div>
                                )
                            })}
                        </motion.span>
                        <br />
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "backOut" }}
                            className="inline-block font-orbitron"
                        >
                            999
                        </motion.span>
                    </motion.h1>

                    <motion.div
                        className="font-orbitron font-bold text-lg md:text-2xl tracking-widest text-white uppercase space-y-2 mb-10"
                        {...fadeInUp}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-center whitespace-nowrap mb-2 h-10">
                            <span className="relative z-10 bg-black/50 px-2 rounded">Website Development</span>
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ 
                                    width: scrollOffset > 0.005 ? "auto" : 0, 
                                    opacity: scrollOffset > 0.005 ? 0.9 : 0 
                                }}
                                transition={{ 
                                    duration: 1.2, 
                                    ease: [0.16, 1, 0.3, 1] 
                                }}
                                className="overflow-hidden inline-flex items-center"
                            >
                                <span className="font-soul text-pink-500/90 italic lowercase text-2xl md:text-3xl tracking-normal inline-block ml-3 pr-2">
                                    with soul
                                </span>
                            </motion.div>
                        </div>
                        <p>AI-Driven Interfaces</p>
                        <p className="font-inter text-xs md:text-sm text-gray-500 mt-6 tracking-[0.15em] font-light normal-case opacity-60">
                            WebGL / Three.js / React Architecture
                        </p>
                    </motion.div>
                    {/* Scroll hint */}
                    <motion.p
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="font-orbitron text-[9px] tracking-[0.4em] text-gray-600 uppercase mt-2 pointer-events-none"
                    >
                        ↓ Scroll to play the shooting gallery
                    </motion.p>
                </div>
            </section>

            {/* Long scroll area */}
            <div className="h-[200vh] w-full flex flex-col justify-end items-center pb-32 pointer-events-none">
                 <motion.div
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full text-4xl md:text-8xl font-black text-stone-800 font-orbitron flex flex-col items-center justify-center text-center leading-tight mx-auto uppercase"
                    >
                        <motion.div 
                            initial={{ letterSpacing: '0.1em' }}
                            whileInView={{ letterSpacing: '0.4em' }}
                            transition={{ duration: 2.5, ease: "easeOut" }}
                            className="mb-4 text-stone-500 text-xl md:text-3xl font-medium"
                        >
                            CREATE THE
                        </motion.div>
                        <motion.div 
                            initial={{ backgroundPosition: '200% center' }}
                            whileInView={{ backgroundPosition: '0% center' }}
                            transition={{ duration: 3, ease: "easeOut", delay: 0.2 }}
                            className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-800 via-cyan-400 to-cyan-800 bg-[length:200%_auto] pr-2 drop-shadow-lg"
                        >
                            IMPOSSIBLE 
                        </motion.div>
                    </motion.div>
            </div>
        </Scroll>
    )
}
