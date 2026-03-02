import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { PageIdentity, PageQuestionnaire, PageClassification, PageFinal } from './Pages';

export const PassportBook = ({ onClose }: { onClose: () => void }) => {
    const [page, setPage] = useState(0);

    const components = [
        <PageIdentity key="identity" onNext={() => setPage(1)} />,
        <PageQuestionnaire key="questionnaire" onNext={() => setPage(2)} />,
        <PageClassification key="classification" onNext={() => setPage(3)} />,
        <PageFinal key="final" tierOrServices="TBD" />
    ];

    return (
        <motion.div
            className="relative w-full max-w-5xl h-[850px] bg-black/40 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 flex"
        >
            {/* Holographic Overlay on Book */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 bg-gradient-to-tr from-[#22d3ee]/20 via-transparent to-[#ec4899]/20" />

            {/* Sidebar / Spine */}
            <div className="w-16 md:w-24 bg-black/50 border-r border-white/5 flex flex-col items-center py-8 z-20 shadow-[8px_0_30px_rgba(0,0,0,0.5)]">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mb-8 shadow-[0_0_15px_#22d3ee] animate-pulse-glow" />
                <div className="flex-1 flex flex-col gap-4 text-[10px] font-mono text-slate-500 [writing-mode:vertical-rl] uppercase tracking-widest">
                    <span className={page >= 0 ? "text-cyan-400 font-bold" : ""}>STRATEGY</span>
                    <span className={page >= 1 ? "text-cyan-400 font-bold transition-colors delay-300" : "transition-colors delay-300"}>ARCHITECTURE</span>
                    <span className={page >= 2 ? "text-cyan-400 font-bold transition-colors delay-300" : "transition-colors delay-300"}>EVALUATION</span>
                </div>
                <button 
                    onClick={onClose} 
                    className="mt-8 p-2 text-slate-500 hover:text-cyan-400 transition-colors"
                    title="Close Passport"
                    aria-label="Close Passport"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent z-10">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-screen" />
                
                {/* Page Transitions */}
                <div className="relative h-full w-full p-8 md:p-12 text-slate-200">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -30, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full"
                        >
                            {components[page]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
