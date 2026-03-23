import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

/**
 * FloatingCTA — part of the grouped left-side tab strip.
 * Sits ~17% above the Logbook tab (same scroll formula, offset -17).
 * Cyan accent. Hover tooltip shows action. No border.
 */
export const FloatingCTA = () => {
    const [discountActive, setDiscountActive] = useState(false)
    const [visible, setVisible] = useState(false)
    const [tabY, setTabY] = useState(33) // 50 - 17 (Logbook starts at 50)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 2500)
        const handleDiscount = () => setDiscountActive(true)

        const onScroll = () => {
            const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)
            const base = 75 - scrollPct * 45
            setTabY(Math.max(15, Math.min(85, base)) - 17)
        }
        const onR3FScroll = (e: Event) => {
            const offset = (e as CustomEvent).detail?.offset ?? 0
            const base = 75 - offset * 45
            setTabY(Math.max(15, Math.min(85, base)) - 17)
        }

        window.addEventListener('discount-unlocked', handleDiscount)
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('scroll-offset', onR3FScroll, { passive: true })
        return () => {
            clearTimeout(t)
            window.removeEventListener('discount-unlocked', handleDiscount)
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('scroll-offset', onR3FScroll)
        }
    }, [])

    const openProject = () => {
        (window as unknown as Window & { toggleQuestionnaire: () => void }).toggleQuestionnaire?.()
    }

    const ctaStyle = { 
        top: `${tabY}%`, 
        transform: 'translateY(-50%)' 
    } as React.CSSProperties

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    id="floating-start-project"
                    onClick={openProject}
                    className="fixed left-0 z-[149] cursor-pointer group"
                    style={ctaStyle}
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -80, opacity: 0 }}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 }}
                    aria-label="Start a project"
                    title="Start a Project"
                >
                    <div className="relative flex flex-col items-center justify-around w-[50px] py-8 rounded-r-2xl overflow-visible floating-cta-tab-inner">
                        <div className="absolute inset-0 rounded-r-2xl overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/20" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                        </div>

                        {/* metallic coil rings */}
                        <div className="flex flex-col items-center gap-[9px] py-5 relative z-10">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-8 h-[8px] rounded-full cta-coil-outer" />
                            ))}
                        </div>

                        <span className="absolute font-orbitron text-[7px] tracking-[0.3em] text-white/40 uppercase pointer-events-none select-none logbook-vertical-text rotate-180 group-hover:text-cyan-400 transition-colors duration-300">
                            START PROJECT
                        </span>

                        <AnimatePresence>
                            {discountActive && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)] text-[6px] font-black text-black flex items-center justify-center z-20"
                                >
                                    %
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse" />
                        <div className="absolute inset-0 rounded-r-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />

                        <div className="tab-tooltip text-white/80">
                            <span className="text-cyan-400 mr-1">▶</span>Open Questionnaire
                        </div>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    )
}
