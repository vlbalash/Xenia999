import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AudioButton — Premium redesign. 
 * Floating glassmorphism orb with spinning status rings.
 * Toggles audio on/off and mutes if active.
 */
export function AudioButton() {
    const [started, setStarted] = useState(false)
    const [muted, setMuted] = useState(false)
    const [hovered, setHovered] = useState(false)

    const handleClick = () => {
        if (!started) {
            window.dispatchEvent(new Event('request-audio-start'))
            setStarted(true)
        } else {
            window.dispatchEvent(new Event('request-audio-mute'))
            setMuted(!muted)
        }
    }

    // Ripple effect for active audio
    const ripples = [0, 1, 2]

    return (
        <div className="fixed bottom-8 right-8 z-[200]">


            <motion.button
                onClick={handleClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="relative w-16 h-16 flex items-center justify-center outline-none group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Visual Feedback for Sound Activity */}
                {started && !muted && ripples.map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-cyan-500/30"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6,
                            ease: "easeOut"
                        }}
                    />
                ))}

                {/* Outer Spinning Rings */}
                <motion.div 
                    className={`absolute inset-[-4px] rounded-full border border-dashed transition-colors duration-500 ${
                        !started ? 'border-orange-500/30' : 
                        muted ? 'border-red-500/30' : 'border-cyan-400/50'
                    }`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                <motion.div 
                    className={`absolute inset-[-8px] rounded-full border border-dotted transition-colors duration-500 ${
                        !started ? 'border-white/10' : 
                        muted ? 'border-red-500/10' : 'border-cyan-500/20'
                    }`}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />

                {/* Main Glass Orb */}
                <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden backdrop-blur-xl border ${
                    !started 
                        ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_30px_rgba(251,146,60,0.1)]' 
                        : muted 
                            ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                            : 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_40px_rgba(34,211,238,0.3)]'
                    }`}>
                    
                    {/* Inner Dynamic Glow */}
                    <div className={`absolute inset-0 opacity-10 transition-colors duration-500 ${
                        !started ? 'bg-orange-400' : muted ? 'bg-red-500' : 'bg-cyan-400'
                    }`} />
                    
                    {/* Scanning Beam */}
                    <motion.div 
                        className="absolute top-0 left-0 w-full h-[1px] bg-white/40 blur-[1px]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Logic Icon */}
                    <div className="relative z-10">
                        {!started ? (
                            <svg className="w-6 h-6 text-orange-400/80 fill-current" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        ) : muted ? (
                            <svg className="w-5 h-5 text-red-400/80 fill-current" viewBox="0 0 24 24">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                            </svg>
                        ) : (
                            <div className="flex gap-[3px] items-center h-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-[2.5px] bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                        animate={{ height: [4, 14, 6, 16, 4] }}
                                        transition={{ 
                                            duration: 0.5 + i * 0.1, 
                                            repeat: Infinity, 
                                            ease: "easeInOut" 
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Tooltip (Glass Overlay) */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute right-20 top-1/2 -translate-y-1/2 px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl pointer-events-none min-w-[140px]"
                        >
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] font-orbitron tracking-[0.4em] text-white/30 uppercase mb-1">Link Status</span>
                                <span className={`text-[11px] font-orbitron tracking-[0.1em] font-black ${
                                    !started ? 'text-orange-400' : muted ? 'text-red-400' : 'text-cyan-400 shadow-cyan-900/50'
                                }`}>
                                    {!started ? 'OFFLINE' : muted ? 'MUTED' : 'OPERATIONAL'}
                                </span>
                                <div className={`h-[1px] w-full mt-2 transition-colors duration-500 ${
                                    !started ? 'bg-orange-500/20' : muted ? 'bg-red-500/20' : 'bg-cyan-500/20'
                                }`} />
                                <span className="text-[8px] text-white/40 mt-1 lowercase font-mono">
                                    {started ? (muted ? '/unmute_engine' : '/monitor_freq') : '/connect_node'}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    )
}
