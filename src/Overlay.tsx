import { Scroll } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useState } from 'react'
import EasterEggOverlay from './EasterEggOverlay'

import { Questionnaire } from './Questionnaire'

/* ──────── Card Component ──────── */
const Card = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        className={`bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl ${className}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
        {children}
    </motion.div>
)

/* ──────── Main Overlay ──────── */
export const Overlay = () => {
    const [showQuestionnaire, setShowQuestionnaire] = useState(false)

    return (
        <Scroll html>
            <div className="w-screen min-h-screen flex flex-col items-center justify-start py-20 gap-12 px-4">

                {/* 1. Identity (Centered Header) */}
                <div className="text-center">
                    <motion.h1
                        className="font-orbitron text-xs tracking-[0.3em] text-cyan-400 mb-4 uppercase font-bold"
                        initial={{ opacity: 0, letterSpacing: '0.1em' }}
                        whileInView={{ opacity: 1, letterSpacing: '0.3em' }}
                        transition={{ duration: 1.2 }}
                    >Identity</motion.h1>
                    <motion.h2
                        className="text-5xl md:text-8xl font-orbitron font-black tracking-tighter mb-4 text-white"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {'XENIA_'.split('').map((char, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                            >{char}</motion.span>
                        ))}
                        <motion.span
                            className="text-cyan-400"
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.7, type: 'spring', stiffness: 200 }}
                        >999</motion.span>
                    </motion.h2>
                    <motion.p
                        className="text-gray-400 font-inter font-light leading-relaxed text-sm md:text-base tracking-wide"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                    >
                        THE ARCHITECTURE OF TOMORROW.
                    </motion.p>
                </div>

                {/* 2. Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl items-start">

                    {/* Collaboration Card */}
                    <Card delay={0.2} className="h-full flex flex-col justify-center">
                        <h1 className="font-orbitron font-bold text-xs tracking-[0.3em] text-pink-400 mb-4 uppercase">Collaboration</h1>
                        <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-8 text-white">
                            Create the <br /><span className="text-pink-500 italic">Impossible</span>
                        </h2>
                        <a href="https://invoice.easystaff.io/cust_log?freel_id=1f0b7f2f-e0fe-6ac4-963a-83690f805e19" target="_blank" rel="noopener noreferrer">
                            <button className="w-full px-6 py-4 bg-white text-black font-orbitron font-bold tracking-widest hover:bg-cyan-400 hover:text-black transition-colors duration-300 uppercase text-xs md:text-sm rounded-md shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]">
                                Initialize Partnership
                            </button>
                        </a>
                    </Card>

                    {/* Contact / Questionnaire Card */}
                    <Card delay={0.4}>
                        <h1 className="font-orbitron font-bold text-xs tracking-[0.3em] text-cyan-400 mb-4 uppercase">Contact</h1>
                        <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6 text-white">
                            Start <br /><span className="text-cyan-400 italic">Project</span>
                        </h2>

                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            Define your parameters. Select your architecture. We will build the rest.
                        </p>

                        <button
                            onClick={() => setShowQuestionnaire(true)}
                            className="w-full py-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold tracking-[0.2em] uppercase text-xs hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all rounded"
                        >
                            Configure Project
                        </button>

                        <div className="mt-8 pt-6 border-t border-white/10 w-full">
                            <motion.a
                                href="https://t.me/XXXENIA999"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors group cursor-pointer"
                                whileHover={{ x: 5 }}
                            >
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="tracking-[0.2em] uppercase">Direct Uplink:</span>
                                <span className="text-white group-hover:text-cyan-300 bg-white/5 px-2 py-1 rounded">@XXXENIA999</span>
                            </motion.a>
                        </div>
                    </Card>

                </div>

            </div>
            {showQuestionnaire && <Questionnaire onClose={() => setShowQuestionnaire(false)} />}
            <EasterEggOverlay />
        </Scroll >
    )
}
