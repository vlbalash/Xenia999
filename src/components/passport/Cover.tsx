import { motion } from 'framer-motion';

// --- Assets / Icons ---
// const IconScan = () => ( ... ) - Removed unused


// --- Component: Cover (The "Closed" Passport) ---
export const PassportCover = ({ onOpen }: { onOpen: () => void }) => {
    return (
        <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto items-center justify-center p-4 perspective-[2000px]">
            {/* Left Panel: ALLIANCE */}
            <motion.div
                className="relative w-full md:w-[500px] h-[600px] bg-[#0a0015] rounded-l-3xl rounded-r-none overflow-hidden border-l border-y border-white/10 group cursor-pointer origin-right z-10"
                whileHover={{ rotateY: 5 }}
                initial={{ opacity: 0, rotateY: -10 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                onClick={onOpen}
            >
                {/* Background & Hologram */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0015] to-[#1a0b2e]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-200" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-pink-500/20 to-cyan-500/20 mix-blend-color-dodge" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-10 border-r border-white/5">
                    <div>
                        <h3 className="font-orbitron font-bold text-pink-500 tracking-[0.2em] text-sm mb-2">ALLIANCE</h3>
                        <h2 className="font-orbitron font-black text-5xl text-white leading-tight">
                            Architect<br />the<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Unknown</span>
                        </h2>
                    </div>

                    <div className="space-y-8">
                        <p className="font-inter text-gray-400 text-sm leading-relaxed border-l-2 border-pink-500/30 pl-4">
                            Collaborate with AI agents and human experts to build the unbuildable.
                        </p>
                        <button className="w-full py-4 bg-transparent border border-pink-500/50 text-white font-orbitron font-bold tracking-widest hover:bg-pink-500/10 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all uppercase rounded-lg group-hover:animate-pulse">
                            Initiate Protocol
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Center Spine */}
            <div className="hidden md:block w-4 h-[580px] bg-gradient-to-r from-[#020617] via-[#1e293b] to-[#020617] border-y border-white/10 z-0 relative shadow-inner"></div>

            {/* Right Panel: GENESIS */}
            <motion.div
                className="relative w-full md:w-[500px] h-[600px] bg-[#020617] rounded-r-3xl rounded-l-none overflow-hidden border-r border-y border-cyan-500/30 group cursor-pointer shadow-[0_0_50px_rgba(6,182,212,0.1)] origin-left z-10"
                whileHover={{ rotateY: -5 }}
                initial={{ opacity: 0, rotateY: 10 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                onClick={onOpen}
            >
                {/* Background & Hologram */}
                <div className="absolute inset-0 bg-gradient-to-bl from-[#020617] to-[#0f172a]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 bg-gradient-to-bl from-cyan-500/20 via-blue-500/20 to-transparent mix-blend-overlay" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-10 border-l border-white/5">
                    <div className="text-right">
                        <h3 className="font-orbitron font-bold text-cyan-400 tracking-[0.2em] text-sm mb-2">GENESIS</h3>
                        <h2 className="font-orbitron font-black text-5xl text-white leading-tight">
                            Manifest<br /><span className="text-cyan-400 text-glow">Reality</span>
                        </h2>
                    </div>

                    <div className="space-y-8">
                        <p className="font-inter text-gray-400 text-sm leading-relaxed text-right border-r-2 border-cyan-500/30 pr-4">
                            Begin the sequence. Define your parameters.<br />We handle the rest.
                        </p>
                        <button className="w-full py-4 bg-cyan-500/10 border border-cyan-400 text-cyan-400 font-orbitron font-bold tracking-widest hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all uppercase rounded-lg relative overflow-hidden">
                            <span className="relative z-10">Access Terminal</span>
                            <div className="absolute inset-0 bg-cyan-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                {/* Footer Indicators */}
                <div className="absolute bottom-4 left-0 w-full flex justify-between px-8 text-[10px] font-mono tracking-widest text-gray-500 opacity-60">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ENCRYPTED UPLINK</div>
                    <div className="flex items-center gap-2">CLOUD NETWORK <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>
                </div>
            </motion.div>
        </div>
    );
};
