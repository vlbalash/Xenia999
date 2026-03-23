import { motion } from 'framer-motion';

// --- Component: Cover (The "Closed" Passport) ---
export const PassportCover = ({ onOpen }: { onOpen: () => void }) => {
    return (
        <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto items-center justify-center p-4 perspective-[2000px]">
            {/* Left Panel: STRATEGY */}
            <motion.div
                className="relative w-full md:w-[450px] h-[600px] bg-black/40 backdrop-blur-3xl rounded-l-3xl rounded-r-none overflow-hidden border-l border-y border-white/10 group cursor-pointer origin-right z-10 shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                whileHover={{ rotateY: 5 }}
                initial={{ opacity: 0, rotateY: -10 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                onClick={onOpen}
            >
                {/* Background Pattern: Subtle Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] opacity-30 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-cyan-900/10 to-black/60" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-pink-500/20 to-cyan-500/20 mix-blend-color-dodge" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-10 md:p-12 border-r border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 animate-pulse mix-blend-screen opacity-80" />
                            </div>
                            <span className="font-orbitron text-[10px] font-bold text-cyan-400/80 tracking-[0.3em]">IDENTITY // 999</span>
                        </div>
                        <h3 className="font-orbitron font-bold text-cyan-400 tracking-[0.2em] text-[10px] mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] uppercase opacity-60">STRATEGIC ORIGIN</h3>
                        <h2 className="font-orbitron font-black text-4xl text-white leading-tight">
                            ASTEROID<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">XXXENIA999</span>
                        </h2>
                    </div>

                    <div className="space-y-8">
                        <p className="font-inter text-slate-300 text-sm leading-relaxed border-l-2 border-cyan-500/50 pl-4 bg-gradient-to-r from-cyan-500/5 to-transparent py-2">
                            Engineering the architecture of complex digital systems from the ground up.
                        </p>
                        <button className="w-full py-4 bg-transparent border border-cyan-500/30 text-cyan-300 font-orbitron font-bold tracking-widest hover:bg-cyan-500/10 hover:text-white transition-all uppercase rounded-xl group-hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] backdrop-blur-md">
                            Enter Protocol
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Center Spine */}
            <div className="hidden md:block w-3 h-[580px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 border-y border-white/10 z-0 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-3xl"></div>

            {/* Right Panel: ARCHITECTURE */}
            <motion.div
                className="relative w-full md:w-[450px] h-[600px] bg-black/40 backdrop-blur-3xl rounded-r-3xl rounded-l-none overflow-hidden border-r border-y border-white/10 group cursor-pointer shadow-[0_0_80px_rgba(0,0,0,0.8)] origin-left z-10"
                whileHover={{ rotateY: -5 }}
                initial={{ opacity: 0, rotateY: 10 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                onClick={onOpen}
            >
                {/* Background Pattern: Subtle Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,105,180,0.03)_1px,transparent_1px)] [background-size:40px_40px] opacity-50 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-bl from-black/60 via-pink-900/10 to-black/60" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 bg-gradient-to-bl from-cyan-500/20 via-transparent to-pink-500/20 mix-blend-overlay" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-10 md:p-12 border-l border-white/5">
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-3 mb-4">
                            <span className="font-orbitron text-[10px] font-bold text-pink-500/80 tracking-[0.3em]">HOLOGRAPHIC // SEAL</span>
                            <div className="w-10 h-10 rounded-full border border-pink-500/50 flex items-center justify-center bg-pink-500/10 relative overflow-hidden group-hover:bg-pink-500/20 transition-all">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400 animate-shimmer opacity-50" />
                                <div className="relative z-10 w-6 h-6 border-2 border-white/40 rounded-full flex items-center justify-center text-[8px] font-black text-white">X</div>
                            </div>
                        </div>
                        <h3 className="font-orbitron font-bold text-pink-500 tracking-[0.2em] text-[10px] mb-2 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] opacity-60 uppercase">SYSTEM CLEARANCE</h3>
                        <h2 className="font-orbitron font-black text-4xl text-white leading-tight uppercase">
                            NEURAL<br /><span className="text-pink-500 flex justify-end drop-shadow-[0_0_15px_rgba(236,72_153,0.4)]">ARCHIVE</span>
                        </h2>
                    </div>

                    <div className="space-y-8">
                        <p className="font-inter text-slate-300 text-sm leading-relaxed text-right border-r-2 border-pink-500/50 pr-4 bg-gradient-to-l from-pink-500/5 to-transparent py-2">
                            Assess infrastructure requirements, AI capabilities, and global deployment scale.
                        </p>
                        <button className="w-full py-4 bg-pink-500/10 border border-pink-500/50 text-pink-400 font-orbitron font-bold tracking-widest hover:bg-pink-500 hover:text-white transition-all uppercase rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] backdrop-blur-md">
                            <span className="relative z-10">Access Terminal</span>
                        </button>
                    </div>
                </div>

                {/* Footer Indicators */}
                <div className="absolute bottom-4 left-0 w-full flex justify-between px-8 text-[10px] font-mono tracking-widest text-slate-500 opacity-80 uppercase">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_#22d3ee]" /> Ready for Assessment</div>
                    <div className="flex items-center gap-2">Protocol: 0.9.9 <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_5px_#ec4899]" /></div>
                </div>
            </motion.div>
        </div>
    );
};
