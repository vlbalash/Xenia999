import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';

const TELEMETRY_DATA = [
    "INITIALIZING_NEURAL_CORE...",
    "MERCURY_DRIVE_STATUS: OPTIMAL",
    "SYNCING_QUANTUM_HUD...",
    "LOADING_GLACIAL_TEXTURES...",
    "ESTABLISHING_BIPER_LINK...",
    "CALIBRATING_SENSORS...",
    "DECRYPTING_FLIGHT_LOGS...",
    "AUTHENTICATING_USER_ID: 999",
    "BYPASSING_ANTIGRAVITY_FILTER...",
    "RENDERING_ASTEROID_BELT...",
    "INITIATING_SEQUENCE_4.2...",
    "READY_FOR_DEPLOYMENT"
];

export const Preloader = () => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [telemetryIndex, setTelemetryIndex] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const progressTimer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressTimer);
                    setTimeout(() => setLoading(false), 800);
                    return 100;
                }
                const increment = Math.random() * 8 + 2;
                return Math.min(prev + increment, 100);
            });
        }, 150);

        const telemetryTimer = setInterval(() => {
            setTelemetryIndex(prev => (prev + 1) % TELEMETRY_DATA.length);
        }, 400);

        return () => {
            clearInterval(progressTimer);
            clearInterval(telemetryTimer);
        };
    }, []);

    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.setAttribute('aria-valuenow', Math.round(progress).toString());
        }
    }, [progress]);

    const visibleTelemetry = useMemo(() => {
        return TELEMETRY_DATA.slice(0, telemetryIndex + 1).slice(-8);
    }, [telemetryIndex]);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ 
                        opacity: 0, 
                        scale: 1.1,
                        filter: 'blur(30px) brightness(2)',
                    }}
                    transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
                    className="preloader-bg font-orbitron"
                >
                    <div className="preloader-vignette" />
                    <div className="preloader-scanline" />
                    
                    {/* Left Telemetry Feed */}
                    <div className="absolute top-10 left-10 flex flex-col gap-1 z-10">
                        {visibleTelemetry.map((text, i) => (
                            <motion.div
                                key={`${text}-${i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1 - (visibleTelemetry.length - 1 - i) * 0.15, x: 0 }}
                                className="telemetry-line"
                            >
                                <span className="text-white/20 mr-2">[{ (i + telemetryIndex).toString(16).padStart(2, '0') }]</span>
                                {text}
                            </motion.div>
                        ))}
                    </div>

                    {/* Right System Info */}
                    <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 z-10 text-right">
                        <div className="telemetry-line text-white/40">SYSTEM_RECOGNITION: PASS</div>
                        <div className="telemetry-line text-white/40">LOCATION_ID: XENIA_HUB</div>
                        <div className="telemetry-line text-cyan-500/60 font-black">ANTIGRAVITY_v4.2_MERCURY</div>
                    </div>

                    <div 
                        ref={progressRef}
                        className="relative z-20 flex flex-col items-center justify-center" 
                        role="progressbar" 
                        title="System loading"
                        aria-label="System loading progress"
                        {...({
                            'aria-valuemin': 0,
                            'aria-valuemax': 100,
                            'aria-valuenow': 0
                        } as any)}
                    >
                        <div className="mercury-loader-container" aria-hidden="true">
                            <div className="mercury-outer-ring" />
                            <div className="mercury-mid-ring" />
                            <div className="mercury-pulse" />
                            
                            {/* Central Mercury Ball */}
                                    <motion.div 
                                        animate={{ 
                                            scale: [1, 1.1, 0.95, 1.05, 1],
                                            rotate: [0, 90, 180, 270, 360],
                                            borderRadius: [
                                                "42% 58% 70% 30% / 45% 45% 55% 55%",
                                                "50% 50% 33% 67% / 55% 27% 73% 45%",
                                                "30% 70% 70% 30% / 30% 30% 70% 70%",
                                                "42% 58% 70% 30% / 45% 45% 55% 55%"
                                            ]
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="w-32 h-32 bg-gradient-to-br from-slate-200 via-white to-slate-500 shadow-[0_0_80px_rgba(255,255,255,0.25)] relative border border-white/40 mix-blend-overlay"
                                    >
                                        <div className="absolute inset-2 border border-white/20 rounded-[inherit] mix-blend-overlay" />
                                    </motion.div>
                        </div>

                        <div className="mt-12 flex flex-col items-center">
                            <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-white text-3xl font-black tracking-[0.7em] uppercase translate-x-[0.35em]"
                            >
                                LOADING
                            </motion.div>
                            
                            <div className="w-64 h-[2px] bg-white/5 mt-8 relative overflow-hidden">
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                                    initial={{ left: '-100%' }}
                                    animate={{ left: `${progress - 100}%` }}
                                    transition={{ type: 'spring', damping: 20 }}
                                />
                                {/* Progress Glitch Element */}
                                <motion.div
                                    animate={{ 
                                        opacity: [0, 1, 0],
                                        left: [`${progress - 10}%`, `${progress - 5}%`, `${progress}%`] 
                                    }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="absolute top-0 w-4 h-full bg-white/30 blur-sm"
                                />
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-white/30 tracking-widest">
                                BYTES_RECEIVED: {Math.floor(progress * 1024).toLocaleString()} KB // COMPLETE: {Math.floor(progress)}%
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-10 text-[9px] font-mono text-white/10 uppercase tracking-[0.5em] z-10">
                        ESTABLISHING NEURAL DEEP LINK // SECTOR: ANTIGRAVITY_999
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
