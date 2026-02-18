import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { PageIdentity, PageQuestionnaire, PageClassification, PageFinal } from './Pages';

export const PassportBook = ({ onClose }: { onClose: () => void }) => {
    const [page, setPage] = useState(0);

    const components = [
        <PageIdentity onNext={() => setPage(1)} />,
        <PageQuestionnaire onNext={() => setPage(2)} />,
        <PageClassification onNext={() => setPage(3)} />,
        <PageFinal />
    ];

    return (
        <motion.div
            className="relative w-full max-w-5xl h-[600px] bg-[#050510] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex"
        >
            {/* Sidebar / Spine */}
            <div className="w-16 md:w-24 bg-[#020205] border-r border-white/5 flex flex-col items-center py-8 z-20">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mb-8 shadow-[0_0_10px_#06b6d4]" />
                <div className="flex-1 flex flex-col gap-4 text-[10px] font-mono text-gray-600 vertical-text" style={{ writingMode: 'vertical-rl' }}>
                    <span className={page >= 0 ? "text-cyan-500" : ""}>ID_VERIFICATION</span>
                    <span className={page >= 1 ? "text-pink-500" : ""}>PARAMETERS</span>
                    <span className={page >= 2 ? "text-amber-500" : ""}>CLASSIFICATION</span>
                </div>
                <button onClick={onClose} className="mt-8 p-2 text-white/20 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Warning_sign.svg/1200px-Warning_sign.svg.png"
                        className="w-24 h-24 mix-blend-overlay filter invert" alt="watermark" />
                </div>

                {/* Page Transitions */}
                <div className="relative h-full w-full p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="h-full"
                        >
                            {components[page]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Holographic Overlay on Book */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-10 bg-gradient-to-tr from-cyan-500/20 via-transparent to-pink-500/20" />
        </motion.div>
    );
};
