import { Scroll } from '@react-three/drei'
import { motion } from 'framer-motion'
import { GenesisPassport } from './components/passport/GenesisPassport'

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
}


export const Overlay = ({ onGlitch: _ }: { onGlitch: () => void }) => {
    return (
        <Scroll html>
            <section className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-center relative z-10">
                    <motion.h1
                        className="text-[15vw] md:text-[12rem] font-black leading-none tracking-tighter mix-blend-difference text-white mb-4 font-orbitron"
                        {...fadeInUp}
                    >
                        XXX<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 font-orbitron drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">ENIA</span><br />
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "backOut" }}
                            className="inline-block font-orbitron"
                        >
                            999
                        </motion.span>
                    </motion.h1>

                    <motion.h2
                        className="text-4xl md:text-8xl font-black mb-8 leading-tight font-orbitron"
                        {...fadeInUp}
                    >
                        Create the <br /><span className="text-pink-500 italic text-gradient font-orbitron">Impossible&nbsp;</span>
                    </motion.h2>

                    <motion.div
                        className="font-orbitron font-bold text-lg md:text-2xl tracking-widest text-white uppercase space-y-4 mb-12"
                        {...fadeInUp}
                        transition={{ delay: 0.2 }}
                    >
                        <p>Website Development</p>
                        <p>AI-Driven Interfaces</p>

                        <p className="font-inter text-xs md:text-sm text-gray-500 mt-8 tracking-[0.15em] font-light normal-case opacity-60">
                            WebGL / Three.js / React Architecture
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer / Contact Trigger */}
            <footer className="absolute bottom-10 left-0 w-full text-center z-50 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                >
                    {/* Footer content if needed */}
                </motion.div>
            </footer>

            {/* Genesis Passport Integration */}
            <div className="w-full mt-24 mb-48 z-40 relative">
                <GenesisPassport />
            </div>

        </Scroll >
    )
}
