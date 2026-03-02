import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogbookModal } from './LogbookModal'

/**
 * LeftTabPanel — single START PROJECT tab that follows scroll.
 * Audio button is separate (AudioButton component, bottom-right).
 */
export const LeftTabPanel = () => {
    const [tabY, setTabY] = useState(50)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const calcY = (raw: number) => Math.max(20, Math.min(80, 75 - raw * 45))

        const onScroll = () => {
            const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)
            setTabY(calcY(p))
        }
        const onR3F = (e: Event) => {
            setTabY(calcY((e as CustomEvent).detail?.offset ?? 0))
        }
        const onOpen = () => setIsOpen(true)

        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('scroll-offset', onR3F, { passive: true })
        window.addEventListener('open-logbook', onOpen)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('scroll-offset', onR3F)
            window.removeEventListener('open-logbook', onOpen)
        }
    }, [])

    const tabStyle = { top: `${tabY}%` } as React.CSSProperties

    return (
        <>
            {/* ── START PROJECT TAB ─────────────────────────────────── */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed left-0 z-[150] group cursor-pointer -translate-y-1/2"
                style={tabStyle}
                whileHover={{ x: 6 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                aria-label="Start Project"
                title="Start Project"
            >
                <div className="hud-tab hud-tab--violet">
                    <div className="hud-edge hud-edge--violet" />
                    <div className="hud-scan" />
                    <div className="hud-bars">
                        {[3, 5, 7, 5, 3].map((h, i) => (
                            <div
                                key={i}
                                className={`hud-bar hud-bar--violet hud-bar-h-${h} hud-bar-delay-${i}`}
                            />
                        ))}
                    </div>
                    <span className="hud-label group-hover:text-violet-300 transition-colors duration-200">
                        START PROJECT
                    </span>
                    <div className="hud-dot hud-dot--violet" />
                    <div className="hud-tooltip">
                        <span className="text-violet-400">✦</span>&ensp;Open Brief
                    </div>
                </div>
            </motion.button>

            {/* ── LOGBOOK MODAL ─────────────────────────────────────── */}
            <LogbookModal isOpen={isOpen} onClose={() => setIsOpen(false)} />

        </>
    )
}
