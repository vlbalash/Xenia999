import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

export default function Loader() {
    const { active, progress } = useProgress()

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                    <div className="w-64 md:w-96 text-center">
                        <motion.h1
                            className="font-orbitron font-bold text-xs tracking-[0.3em] text-cyan-500 mb-8 uppercase"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            Initializing Neural Link...
                        </motion.h1>

                        {/* Progress Bar Container */}
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-600 box-shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            />
                        </div>

                        <div className="mt-4 flex justify-between font-mono text-[11px] text-gray-500">
                            <span>{progress >= 100 ? 'SYSTEM_READY' : 'LOADING_ASSETS'}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
