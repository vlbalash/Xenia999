import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ScoreHUD — fixed to the right edge, listens for gallery-update events
 * from ShootingGallery and displays score/ammo/reload status.
 * Also shows a discount banner when the discount-unlocked event fires.
 */
export const ScoreHUD = () => {
    const [score, setScore] = useState(0)
    const [ammo, setAmmo] = useState(6)
    const [isReloading, setIsReloading] = useState(false)
    const [flash, setFlash] = useState(false)
    const [visible, setVisible] = useState(false)
    const [discountActive, setDiscountActive] = useState(false)
    const [discountBannerVisible, setDiscountBannerVisible] = useState(false)

    useEffect(() => {
        const handleUpdate = (e: Event) => {
            const d = (e as CustomEvent).detail
            setScore(d.score)
            setAmmo(d.ammo)
            setIsReloading(d.isReloading)
            setVisible(true)
        }
        const handleFlash = () => {
            setFlash(true)
            setTimeout(() => setFlash(false), 150)
        }
        const handleDiscount = () => {
            setDiscountActive(true)
            setDiscountBannerVisible(true)
            // Auto-hide banner after 6 seconds
            setTimeout(() => setDiscountBannerVisible(false), 6000)
        }

        window.addEventListener('gallery-update', handleUpdate)
        window.addEventListener('gallery-shot-flash', handleFlash)
        window.addEventListener('discount-unlocked', handleDiscount)
        return () => {
            window.removeEventListener('gallery-update', handleUpdate)
            window.removeEventListener('gallery-shot-flash', handleFlash)
            window.removeEventListener('discount-unlocked', handleDiscount)
        }
    }, [])

    if (!visible) return null

    const scoreColorStyle = { 
        color: discountActive ? '#facc15' : 'white' 
    } as React.CSSProperties

    return (
        <>
            {/* Discount Banner — full-screen toast at top */}
            <AnimatePresence>
                {discountBannerVisible && (
                    <motion.div
                        key="discount-banner"
                        initial={{ opacity: 0, y: -80, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -80, scale: 0.8 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-8 py-4 rounded-2xl border border-yellow-400/40 bg-black/90 backdrop-blur-xl shadow-[0_0_60px_rgba(250,204,21,0.3)]"
                    >
                        <motion.span
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 0.6, repeat: 3 }}
                            className="text-3xl"
                        >
                            🎯
                        </motion.span>
                        <div>
                            <p className="font-orbitron font-black text-yellow-400 tracking-[0.3em] text-sm uppercase">
                                Combat Bonus Unlocked!
                            </p>
                            <p className="text-yellow-200/60 font-mono text-[11px] mt-0.5">
                                Score 999 reached — −20% discount applied to your invoice
                            </p>
                        </div>
                        <button
                            onClick={() => setDiscountBannerVisible(false)}
                            aria-label="Dismiss discount notification"
                            className="text-white/30 hover:text-white ml-2 transition-colors"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Score HUD Panel */}
            <motion.div
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[120] flex flex-col items-end gap-2 pr-3"
            >
                {/* Score */}
                <motion.div
                    animate={{ scale: flash ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    className="flex flex-col items-end"
                >
                    <span className="text-[9px] font-orbitron tracking-[0.3em] text-violet-400/60 uppercase">Score</span>
                    <motion.span
                        className="font-orbitron text-2xl font-black leading-none score-hud-score-text"
                        style={scoreColorStyle}
                    >
                        {score.toLocaleString()}
                    </motion.span>
                </motion.div>

                {/* Divider */}
                <div className={`w-16 h-px ${discountActive ? 'bg-yellow-400/30' : 'bg-white/10'}`} />

                {/* Ammo pips */}
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[8px] font-orbitron tracking-[0.25em] text-stone-500 uppercase">
                        {isReloading ? 'Reloading...' : 'Ammo'}
                    </span>
                    <div className="flex gap-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <AnimatePresence key={i}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`ammo-pip ${
                                        isReloading
                                            ? 'ammo-pip-reloading'
                                            : i < ammo
                                            ? 'ammo-pip-full'
                                            : 'ammo-pip-empty'
                                    }`}
                                />
                            </AnimatePresence>
                        ))}
                    </div>
                    {/* Add discount here under ammo */}
                    {discountActive && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[7px] font-orbitron text-yellow-400 tracking-widest mt-1"
                        >
                            🎯 −20%
                        </motion.span>
                    )}
                </div>
            </motion.div>
        </>
    )
}
