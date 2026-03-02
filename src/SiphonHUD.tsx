import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LogEntry {
    id: number
    message: string
    color: string
}

/**
 * SiphonHUD — Floating notifications for "Journal Progress".
 * Shows when the player "siphons" data from targets.
 */
export function SiphonHUD() {
    const [logs, setLogs] = useState<LogEntry[]>([])

    useEffect(() => {
        const handleLog = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const newLog = {
                id: Date.now() + Math.random(),
                message: detail.message || 'DATA_SIPHONED',
                color: detail.color || '#22d3ee'
            }
            setLogs(prev => [...prev.slice(-3), newLog]) // Keep only last 4
            
            // Remove after 3 seconds
            setTimeout(() => {
                setLogs(prev => prev.filter(l => l.id !== newLog.id))
            }, 3000)
        }

        window.addEventListener('siphon-data', handleLog)
        return () => window.removeEventListener('siphon-data', handleLog)
    }, [])

    return (
        <div className="fixed top-24 left-10 z-[160] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                        className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg"
                        style={{ '--log-color': log.color } as React.CSSProperties}
                    >
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse log-dot-glow" />
                        <span className="font-orbitron text-[10px] tracking-[0.2em] text-white/80 uppercase">
                            <span className="log-label-color">LOG_ENTRY:</span> {log.message}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
