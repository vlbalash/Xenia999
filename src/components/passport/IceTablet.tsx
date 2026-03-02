import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { PageIdentity, PageQuestionnaire, PageClassification, PageFinal, PageDeliverables, PageRoadmap, PagePricing } from './Pages';

export const IceTablet = () => {
    const [isProtocolActive, setIsProtocolActive] = useState(false);
    const [page, setPage] = useState(0);
    const [engagementMode, setEngagementMode] = useState<'package' | 'custom' | null>(null);
    const [selectedTierOrServices, setSelectedTierOrServices] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Interactive 3D Tilt Logic ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = (mouseX / width) - 0.5;
        const yPct = (mouseY / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const questionnaireComponents = [
        <PageIdentity key="identity" onNext={() => setPage(1)} />,
        <PageQuestionnaire key="questionnaire" onNext={() => setPage(2)} />,
        <PageClassification key="classification" onNext={() => setPage(3)} />,
        <PageDeliverables key="deliverables" onNext={(mode) => { setEngagementMode(mode); setPage(4); }} />,
        engagementMode === 'package' ? (
            <PageRoadmap key="roadmap" onNext={(tier) => { setSelectedTierOrServices(tier); setPage(5); }} />
        ) : (
            <PagePricing key="pricing" onNext={(services, total) => { setSelectedTierOrServices(services.length + ` services (~£${total})`); setPage(5); }} />
        ),
        <PageFinal key="final" tierOrServices={selectedTierOrServices || "Custom Protocol"} />
    ];

    const tabletStyle = { rotateX, rotateY, transformStyle: "preserve-3d" } as React.CSSProperties

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="logbook-container relative w-full max-w-6xl mx-auto py-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
            <motion.div
                style={tabletStyle}
                className="relative flex justify-center"
            >
                {/* The Flight Logbook Surface */}
                <motion.div
                    layout
                    className="logbook-surface mercury-glass w-full max-w-[900px] min-h-[700px] md:min-h-[850px] flex shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                >
                    {/* Left Spine: Spiral Binding (Spring) */}
                    <div className="w-[80px] h-full flex flex-col items-center justify-around py-12 border-r border-white/5 bg-gradient-to-r from-black/40 to-transparent relative z-30">
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="spiral-wire" />
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="relative flex-1 p-8 md:p-16 flex flex-col justify-center overflow-hidden">
                        {/* Mercury Texture & HUD Overlays */}
                        <div className="absolute inset-0 logbook-hud-lines pointer-events-none opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/40 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />
                        
                        <AnimatePresence mode="wait">
                            {!isProtocolActive ? (
                                <motion.div
                                    key="home"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                                    className="flex flex-col space-y-12 relative z-10"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                <div className="w-5 h-5 rounded-full bg-[#aaa] shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse" />
                                            </div>
                                            <span className="font-mono text-[10px] text-white/40 tracking-[0.4em] uppercase">Log: NC-999 // SYSTEM_BOOT</span>
                                        </div>
                                        <h2 className="font-orbitron font-black text-5xl md:text-7xl text-white tracking-tighter uppercase leading-[0.85]">
                                            FLIGHT<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-400">LOGBOOK</span>
                                        </h2>
                                        <p className="max-w-md font-inter text-slate-400 text-sm md:text-base leading-relaxed tracking-wide">
                                            Tactical briefing protocol for asteroid field navigation and strategic infrastructure deployment.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-8 py-6 border-y border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-mono text-white/30 uppercase">Stages</span>
                                            <span className="text-sm font-orbitron font-bold text-white tracking-widest">03 // SECURE</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-mono text-white/30 uppercase">ETA</span>
                                            <span className="text-sm font-orbitron font-bold text-white tracking-widest">~00:03:00</span>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 10 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsProtocolActive(true)}
                                        className="w-fit px-12 py-5 bg-white text-black font-orbitron font-black tracking-[0.3em] uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center gap-4"
                                    >
                                        Initialize Protocol
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="protocol"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, filter: "blur(10px)" }}
                                    className="h-full flex flex-col relative z-20"
                                >
                                    {/* Logbook Header */}
                                    <div className="mb-8 flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Status: Writing...</span>
                                            <span className="font-orbitron font-bold text-lg text-white">
                                                SECT_{page + 1}: {page === 0 ? 'NEURAL_ID' : page === 1 ? 'OBJECTIVE' : page === 2 ? 'CORE_SPECS' : page === 3 ? 'ENGAGEMENT' : page === 4 ? 'ARCHITECTURE' : 'FINAL_LINK'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                <div 
                                                    key={i} 
                                                    className={`w-10 h-1 transition-all duration-500 rounded-px ${i <= page ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/10'}`} 
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={page}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className="h-full"
                                            >
                                                {questionnaireComponents[page]}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                        <button 
                                            onClick={() => setIsProtocolActive(false)}
                                            className="hover:text-red-500 transition-colors"
                                        >
                                            [ ESCAPE_SESSION ]
                                        </button>
                                        <div className="flex gap-6">
                                            <span>X-999_ENCRYPTED</span>
                                            <span>MERCURY_ID: {(Math.random() * 1000).toFixed(0)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Page Edge Lighting */}
                    <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                </motion.div>
            </motion.div>

            {/* Ambient Background Accents */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" />
        </motion.div>
    );
};
