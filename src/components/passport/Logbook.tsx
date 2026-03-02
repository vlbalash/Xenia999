import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Questionnaire } from '../../Questionnaire';

const RotatingInsights = () => {
    const insights = [
        "Insight: Projects with Headless CMS load 4x faster, increasing retention by 30%.",
        "Market Data: 74% of B2B buyers research half or more of their work purchases online.",
        "Architecture: Decoupled frontends reduce server overhead and scale infinitely.",
        "Design: WebGL micro-interactions increase average session duration by 120%."
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % insights.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [insights.length]);

    return (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
            <h4 className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-stone-400 mb-2">Strategic Insight</h4>
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs font-inter text-stone-600 leading-relaxed"
                >
                    {insights[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

export const Logbook = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [combatUnlocked, setCombatUnlocked] = useState(false);
    const [logs, setLogs] = useState<{ id: string, title: string, content: string, date: string, color: string }[]>([
        {
            id: 'init',
            title: 'Protocol Initialization',
            content: 'Client environment mapped. Vanguard system standing by for configuration.',
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            color: '#22d3ee'
        }
    ]);

    useEffect(() => {
        const onOpenLogbook = () => setIsOpen(true);
        const onSiphon = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setLogs(prev => [
                {
                    id: Math.random().toString(),
                    title: detail.message || 'Node Intercepted',
                    content: `System anomaly resolved. Synchronizing parameters.`,
                    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    color: detail.color || '#8b5cf6'
                },
                ...prev
            ]);
        };
        const onDiscount = () => setCombatUnlocked(true);

        window.addEventListener('open-logbook', onOpenLogbook);
        window.addEventListener('siphon-data', onSiphon);
        window.addEventListener('discount-unlocked', onDiscount);
        return () => {
            window.removeEventListener('open-logbook', onOpenLogbook);
            window.removeEventListener('siphon-data', onSiphon);
            window.removeEventListener('discount-unlocked', onDiscount);
        };
    }, []);

    const logbookStyle = { 
        top: 0, 
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'fixed' as const,
    } as React.CSSProperties

    return (
        <>
            {/* ── TOP CENTER TAB ────────────────────────── */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed top-0 z-[150] group journal-tab-top px-8 py-2 flex items-center justify-center bg-white/95 backdrop-blur-xl border-x border-b border-stone-200 rounded-b-2xl shadow-lg cursor-pointer"
                style={logbookStyle}
                whileHover={{ y: 8, backgroundColor: 'rgba(255,255,255,1)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                aria-label="Open Protocol Dashboard"
            >
                <div className="h-[2px] w-12 bg-cyan-400 opacity-50 absolute bottom-1 rounded-full group-hover:bg-cyan-500 transition-colors" />
                <span className="text-stone-800 font-bold tracking-[0.2em] text-[10px] uppercase font-orbitron">Dashboard</span>

                {/* Hover tooltip label */}
                <div className="tab-tooltip-top text-stone-800 bg-white border-stone-200 shadow-xl">
                    <span className="text-cyan-500 mr-2 pulse">✦</span>Access Protocol
                </div>
            </motion.button>

            {/* ── BACKDROP ────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="bd"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[148] bg-stone-900/60 backdrop-blur-md"
                    />
                )}
            </AnimatePresence>

            {/* ── ARCHIVE MODAL (Dashboard Layout) ─────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="modal"
                        initial={{ scale: 0.98, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-[149] flex items-center justify-center p-4 md:p-8 pointer-events-none"
                    >
                        {/* Dashboard Wrapper */}
                        <div className="relative pointer-events-auto flex flex-col w-full max-w-[1240px] h-full max-h-[85vh] bg-[#fafafa] border border-stone-200 rounded-[2rem] shadow-2xl overflow-hidden">
                            
                            {/* Dashboard Header */}
                            <div className="flex-none flex items-center justify-between px-8 py-5 bg-white border-b border-stone-200">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 shadow-sm text-cyan-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="font-orbitron font-black text-stone-800 text-lg tracking-wide uppercase">Vanguard Dashboard</h2>
                                        <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1">
                                            <span>Session: <span className="text-cyan-600 font-bold">0x{Math.random().toString(16).slice(2, 8).toUpperCase()}</span></span>
                                            <span className="w-1 h-1 rounded-full bg-stone-300" />
                                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Uplink Active</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 -mr-2 text-stone-400 hover:text-stone-900 transition-colors bg-white hover:bg-stone-50 rounded-full border border-transparent hover:border-stone-200"
                                    aria-label="Close Protocol Dashboard"
                                    title="Close Protocol Dashboard"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                                {/* NEW 11/10 Dashboard Body (Bento Box Layout) */}
                            <div className="flex-1 overflow-hidden relative p-4 md:p-8 bg-gradient-to-br from-stone-50 via-gray-50 to-stone-100">
                                
                                {/* Animated Ambient Background Mesh (Subtle) */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-200/40 blur-[100px] mix-blend-multiply animate-blob rounded-full" />
                                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 blur-[100px] mix-blend-multiply animate-blob animation-delay-2000 rounded-full" />
                                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/40 blur-[100px] mix-blend-multiply animate-blob animation-delay-4000 rounded-full" />
                                </div>

                                <div className="relative z-10 w-full h-full flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
                                    
                                    {/* LEFT COLUMN: Intelligence & Status (Bento Grid) */}
                                    <div className="w-full md:w-[380px] flex-none flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-8">
                                        
                                        {/* Widget 1: System Protocol Status */}
                                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <h3 className="text-[10px] font-orbitron font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Protocol Status</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="relative flex items-center justify-center w-4 h-4">
                                                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20 animate-ping"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </div>
                                                <span className="text-sm font-inter text-stone-700 font-medium tracking-wide">Awaiting Vanguard Input</span>
                                            </div>
                                        </div>

                                        {/* Widget 2: Combat Bonus (Holographic Card) */}
                                        <div className={`rounded-3xl border p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 relative overflow-hidden group ${combatUnlocked ? 'bg-gradient-to-br from-white/90 to-cyan-50/90 border-cyan-200/60' : 'bg-white/60 border-white/40 opacity-70'}`}>
                                            {combatUnlocked && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/5 via-transparent to-blue-400/5 animate-pulse-slow pointer-events-none" />
                                            )}
                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <h3 className={`text-[10px] font-orbitron font-bold uppercase tracking-[0.2em] ${combatUnlocked ? 'text-cyan-600' : 'text-stone-400'}`}>Combat Bonus</h3>
                                                {combatUnlocked && (
                                                    <motion.span 
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold bg-cyan-100/80 text-cyan-700 tracking-[0.15em] border border-cyan-200/50 shadow-sm"
                                                    >
                                                        ACTIVE
                                                    </motion.span>
                                                )}
                                            </div>
                                            <h4 className={`text-2xl font-orbitron font-black mb-2 relative z-10 tracking-tight ${combatUnlocked ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600' : 'text-stone-400'}`}>
                                                -20% DISCOUNT
                                            </h4>
                                            <p className={`text-xs font-inter leading-relaxed relative z-10 ${combatUnlocked ? 'text-cyan-800/80' : 'text-stone-500'}`}>
                                                {combatUnlocked ? 'Tactical engagement authorized. Premium tier discount securely applied to terminal quote.' : 'Neutralize void anomalies to authorize premium integration discounts.'}
                                            </p>
                                        </div>

                                        {/* Widget 3: Strategic Insights */}
                                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                            <RotatingInsights />
                                        </div>

                                        {/* Widget 4: System Logs */}
                                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[220px]">
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="text-[10px] font-orbitron font-bold text-stone-400 uppercase tracking-[0.2em]">Live Action Log</h3>
                                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-pulse" />
                                            </div>
                                            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                <AnimatePresence initial={false}>
                                                    {logs.slice(0, 5).map((log, i) => (
                                                        <motion.div 
                                                            key={log.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1 - i * 0.15, x: 0 }}
                                                            className="flex gap-4 group"
                                                        >
                                                            <span className={`text-[10px] font-mono whitespace-nowrap pt-0.5 text-[${log.color}] opacity-70`}>{log.date}</span>
                                                            <div>
                                                                <p className="text-xs font-inter font-semibold text-stone-700 leading-tight group-hover:text-stone-900 transition-colors">{log.title}</p>
                                                                <p className="text-[10px] font-inter text-stone-500 leading-snug mt-1">{log.content}</p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: Action & Configuration (Main App Area) */}
                                    <div className="flex-1 bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-6 md:p-10 overflow-y-auto custom-scrollbar relative flex flex-col">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-100/40 to-transparent rounded-tr-[32px] pointer-events-none" />
                                        <div className="max-w-3xl mx-auto w-full relative z-10 flex-1">
                                            <Questionnaire onClose={() => setIsOpen(false)} isEmbedded />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

