import { motion } from 'framer-motion'

export function LiquidMarquee() {
    return (
        <div className="fixed bottom-0 left-0 w-full h-10 md:h-12 bg-black/40 backdrop-blur-md border-t border-cyan-500/30 overflow-hidden z-[150] pointer-events-none">
            {/* Flowing liquid background (cyan) */}
            <motion.div 
                className="absolute inset-0 w-[200%] bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent,rgba(34,211,238,0.3),transparent)]"
                style={{ mixBlendMode: 'screen' }}
                animate={{ x: ['-50%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Fluid bubbles effect inner shadow */}
            <div className="absolute inset-0 shadow-[inset_0_4px_15px_rgba(34,211,238,0.3),inset_0_-4px_15px_rgba(34,211,238,0.1)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.15),transparent_50%)]" />

            {/* Marquee Text */}
            <div className="relative h-full flex items-center">
                <motion.div
                    className="flex whitespace-nowrap text-cyan-300 font-orbitron font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                    <div className="flex items-center shrink-0 pr-8">
                         {Array.from({ length: 10 }).map((_, i) => (
                             <span key={`first-${i}`} className="flex items-center">
                                 CREATE THE IMPOSSIBLE<span className="text-cyan-500/40 mx-8 md:mx-12">●</span>
                             </span>
                         ))}
                    </div>
                    <div className="flex items-center shrink-0 pr-8">
                         {Array.from({ length: 10 }).map((_, i) => (
                             <span key={`second-${i}`} className="flex items-center">
                                 CREATE THE IMPOSSIBLE<span className="text-cyan-500/40 mx-8 md:mx-12">●</span>
                             </span>
                         ))}
                    </div>
                </motion.div>
            </div>
            
            {/* Glossy liquid highlight on the top edge */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent" />
        </div>
    )
}
