import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- PRICING MATRIX (USD) — Enterprise Positioned ---
const PRICES = {
    STRATEGIC: {
        audit: 1200,
        none: 0
    },
    TECH: {
        template: 0,
        headless: 2500,
        custom: 3500
    },
    GROWTH: {
        cro: 1800
    },
    BRANDING: {
        webgl_lite: 1500,
        webgl_bespoke: 4000
    },
    AI: {
        crm_routing: 1500
    },
    URGENT_MULTIPLIER: 1.5
}

// --- DESCRIPTIONS: what each option includes ---
const DESCRIPTIONS = {
    STRATEGIC: {
        audit: 'Deep-dive competitor analysis and architecture blueprinting before coding begins.',
        none: 'Standard execution based on provided requirements.'
    },
    TECH: {
        template: 'Polished premium layout customized with your brand colors & content.',
        headless: 'Decoupled modern backend delivering content via ultra-fast APIs (Sanity/Contentful).',
        custom: 'Fully custom layout designed and built from scratch — unique to your business.'
    },
    GROWTH: {
        cro: 'Implementation of advanced analytics, dynamic heatmapping, and A/B split-testing infrastructure.'
    },
    BRANDING: {
        webgl_lite: 'Subtle high-end 3D visual accents and micro-interactions.',
        webgl_bespoke: 'Custom 3D shaders, interactive physics objects, and dynamic particle systems tailored to core brand values.'
    },
    AI: {
        crm_routing: 'Intelligent lead capture that qualifies input via LLMs and routes instantly to Slack or HubSpot.'
    }
}

type StrategyLevel = 'audit' | 'none'
type TechLevel = 'template' | 'headless' | 'custom'
type GrowthAddon = 'cro'
type BrandLevel = 'webgl_lite' | 'webgl_bespoke'
type AiAddon = 'crm_routing'

interface QuestionnaireProps {
    onClose: () => void
    isEmbedded?: boolean
}

export const Questionnaire = ({ onClose, isEmbedded = false }: QuestionnaireProps) => {
    const progressRef = useRef<HTMLDivElement>(null)
    const [step, setStep] = useState(0)
    
    // Step 1: Strategy & Scale
    const [strategy, setStrategy] = useState<StrategyLevel>('none')
    
    // Step 2: Architecture & Tech
    const [tech, setTech] = useState<TechLevel>('template')
    const [growthAddons, setGrowthAddons] = useState<GrowthAddon[]>([])
    
    // Step 3: Visual & AI Layer
    const [brand, setBrand] = useState<BrandLevel>('webgl_lite')
    const [aiAddons, setAiAddons] = useState<AiAddon[]>([])

    // Step 4: Dispatch
    const [isUrgent, setIsUrgent] = useState(false)
    const [contact, setContact] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [discountActive, setDiscountActive] = useState(false)

    // Listen for discount unlock event from shooting gallery
    useEffect(() => {
        const handleDiscount = () => setDiscountActive(true)
        window.addEventListener('discount-unlocked', handleDiscount)
        return () => window.removeEventListener('discount-unlocked', handleDiscount)
    }, [])

    // --- Escape key to close ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // Update ARIA valuenow via ref to satisfy strict linters
    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.setAttribute('aria-valuenow', step.toString())
        }
    }, [step])

    // --- CALCULATION LOGIC ---
    const totalPrice = useMemo(() => {
        let base = PRICES.STRATEGIC[strategy] + PRICES.TECH[tech] + PRICES.BRANDING[brand]
        growthAddons.forEach(a => base += PRICES.GROWTH[a])
        aiAddons.forEach(a => base += PRICES.AI[a])
        const afterUrgency = Math.round(base * (isUrgent ? PRICES.URGENT_MULTIPLIER : 1))
        return discountActive ? Math.round(afterUrgency * 0.80) : afterUrgency
    }, [strategy, tech, growthAddons, brand, aiAddons, isUrgent, discountActive])

    const toggleGrowth = (item: GrowthAddon) => {
        setGrowthAddons(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
    }

    const toggleAi = (item: AiAddon) => {
        setAiAddons(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
    }

    const handleSend = async () => {
        setIsSending(true)
        try {
            const message = [
                `*New Project Request*`,
                `Strategy: ${strategy} ($${PRICES.STRATEGIC[strategy]})`,
                `Tech Stack: ${tech} ($${PRICES.TECH[tech]})`,
                `Visual: ${brand} ($${PRICES.BRANDING[brand]})`,
                `Growth: ${growthAddons.join(', ') || 'None'}`,
                `AI: ${aiAddons.join(', ') || 'None'}`,
                `Urgent: ${isUrgent ? 'YES' : 'NO'}`,
                discountActive ? `Discount: 20% COMBAT BONUS applied` : '',
                `*TOTAL: $${totalPrice}*`,
                `Contact: ${contact}`
            ].filter(Boolean).join('\n')

            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Quote #${Math.floor(Math.random() * 10000)}`,
                    email: contact,
                    message: message
                })
            })
            setSent(true)
            setTimeout(() => onClose(), 5000)
        } catch {
            alert('Connection Error — try again')
        } finally {
            setIsSending(false)
        }
    }

    const nextStep = () => setStep(prev => prev + 1)
    const prevStep = () => setStep(prev => prev - 1)

    const containerStyle = isEmbedded
        ? "relative w-full h-full flex flex-col pt-4"
        : "fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl"

    const glassStyle = isEmbedded
        ? "flex-1 flex flex-col w-full h-full"
        : "glass-panel rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden overflow-y-auto max-h-[90vh] flex flex-col"

    return (
        <motion.div
            className={`${containerStyle} ${!isEmbedded ? 'questionnaire-window-bg' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Project Calculator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={glassStyle}>
                {/* Header & Close (only show if NOT embedded) */}
                {!isEmbedded && (
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="text-[11px] font-orbitron font-bold tracking-[0.5em] text-cyan-400 uppercase">Interactive Configurator</span>
                            <h2 className="text-3xl font-orbitron font-black text-white mt-1">
                                {step === 0 ? 'Project Requirements' : step < 4 ? `Phase 0${step}` : "Configuration Complete"}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close questionnaire"
                            className="text-white/30 hover:text-white transition-colors p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {/* Progress Bar — only show after step 0 */}
                {step > 0 && (
                    <div 
                        ref={progressRef}
                        className="flex gap-2 mb-10" 
                        role="progressbar" 
                        aria-label={`Step ${step} of 6`}
                    >




                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-stone-200'}`} />
                        ))}
                    </div>
                )}

                {/* Discount Banner */}
                {discountActive && step > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-3 rounded-xl border border-yellow-400/30 bg-yellow-400/5 flex items-center gap-3"
                    >
                        <span className="text-yellow-400 text-lg">🎯</span>
                        <div>
                            <span className="text-yellow-400 font-orbitron font-bold text-[11px] tracking-widest">COMBAT BONUS ACTIVE</span>
                            <p className="text-yellow-300/60 text-[10px] font-mono">Score 999 achieved — 20% discount applied to your invoice</p>
                        </div>
                    </motion.div>
                )}

                {/* Content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Step 0: Intro / Value Proposition */}
                            {step === 0 && (
                                <div className="space-y-8">
                                    <p className={`text-base font-inter leading-relaxed ${isEmbedded ? 'text-stone-600' : 'text-gray-300'}`}>
                                        I provide <span className={`font-bold font-soul text-xl mx-1 ${isEmbedded ? 'text-stone-900' : 'text-white'}`}>website development with soul</span>. From sleek landing pages to complex 3D portals, I focus on radical aesthetics and technical precision.
                                        Transparent pricing, honest deadlines, no hidden fees.
                                    </p>

                                    <div className="grid gap-4">
                                        {[
                                            { icon: '⚡', title: 'Fast & precise', desc: 'Standard delivery 3–4 weeks. Urgent orders accepted with priority queue.' },
                                            { icon: '💎', title: 'What you see is what you pay', desc: 'The calculator below builds your invoice live. You see every line item before committing.' },
                                            { icon: '🎯', title: 'Shoot 999 targets — get 20% off', desc: 'Play the shooting gallery on this site. Reach 999 score and unlock a real discount.' }
                                        ].map(item => (
                                            <div key={item.icon} className={`flex gap-4 p-4 rounded-2xl border ${isEmbedded ? 'bg-white border-stone-100 shadow-sm' : 'bg-white/3 border-white/5'}`}>
                                                <span className="text-2xl">{item.icon}</span>
                                                <div>
                                                    <p className={`font-orbitron font-bold text-[13px] tracking-wide ${isEmbedded ? 'text-stone-800' : 'text-white'}`}>{item.title}</p>
                                                    <p className={`text-[12px] mt-1 font-inter leading-relaxed ${isEmbedded ? 'text-stone-500' : 'text-gray-500'}`}>{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mb-4">Starting from <span className={isEmbedded ? 'text-cyan-600 font-bold' : 'text-white font-bold'}>$700</span> · Payment: fiat or crypto · NDA available</p>
                                        <button
                                            onClick={nextStep}
                                            className={`w-full py-5 font-orbitron font-black tracking-[0.4em] rounded-xl transition-all active:scale-95 text-sm ${isEmbedded ? 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200' : 'bg-cyan-400 text-black hover:bg-white'}`}
                                        >
                                            BEGIN MISSION →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Base Type */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <p className={`text-sm font-inter ${isEmbedded ? 'text-stone-500' : 'text-gray-400'}`}>Select primary project scope & strategy:</p>
                                    <div className="grid gap-3">
                                        {(['audit', 'none'] as StrategyLevel[]).map(s => (
                                            <button key={s} onClick={() => { setStrategy(s); nextStep(); }} className={`text-left p-6 rounded-2xl border transition-all active:scale-95 ${strategy === s ? (isEmbedded ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-cyan-400 bg-cyan-400/10') : (isEmbedded ? 'border-stone-200 bg-white hover:border-stone-300 shadow-sm text-stone-700' : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-300')}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-orbitron font-bold uppercase tracking-widest text-[11px] ${strategy === s && isEmbedded ? 'text-cyan-700' : ''}`}>{s === 'audit' ? 'Market Ecosystem & Technical Audit' : 'Standard Execution Plan'}</span>
                                                    <span className={`${isEmbedded ? 'text-cyan-600' : 'text-cyan-400'} font-mono text-[13px] font-bold`}>{PRICES.STRATEGIC[s] === 0 ? 'Included' : `+ $${PRICES.STRATEGIC[s]}`}</span>
                                                </div>
                                                <p className={`text-[11px] font-inter leading-relaxed ${isEmbedded ? (strategy === s ? 'text-cyan-800/70' : 'text-stone-500') : 'text-gray-500'}`}>{DESCRIPTIONS.STRATEGIC[s]}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Architecture & Tech */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <p className={`text-sm font-inter font-semibold ${isEmbedded ? 'text-stone-600' : 'text-gray-300'}`}>Core Application Architecture:</p>
                                        <div className="grid gap-3">
                                            {(['template', 'headless', 'custom'] as TechLevel[]).map(t => (
                                                <button key={t} onClick={() => setTech(t)} className={`text-left p-5 rounded-2xl border transition-all active:scale-95 ${tech === t ? (isEmbedded ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-cyan-400 bg-cyan-400/10') : (isEmbedded ? 'border-stone-200 bg-white hover:border-stone-300 shadow-sm text-stone-700' : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-300')}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`font-orbitron font-bold uppercase tracking-widest text-[11px] ${tech === t && isEmbedded ? 'text-cyan-700' : ''}`}>
                                                            {t === 'template' ? 'Polished Template' : t === 'headless' ? 'Headless Serverless CMS' : 'Bespoke Application'}
                                                        </span>
                                                        <span className={`${isEmbedded ? 'text-cyan-600' : 'text-cyan-400'} font-mono text-[12px] font-bold`}>
                                                            {PRICES.TECH[t] === 0 ? 'Included' : `+$${PRICES.TECH[t]}`}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[11px] font-inter leading-relaxed ${isEmbedded ? (tech === t ? 'text-cyan-800/70' : 'text-stone-500') : 'text-gray-500'}`}>{DESCRIPTIONS.TECH[t]}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <p className={`text-sm font-inter font-semibold ${isEmbedded ? 'text-stone-600' : 'text-gray-300'}`}>Growth Engine (Optional):</p>
                                        {(['cro'] as GrowthAddon[]).map(a => (
                                            <button key={a} onClick={() => toggleGrowth(a)} className={`text-left p-5 rounded-2xl border transition-all active:scale-95 w-full ${growthAddons.includes(a) ? (isEmbedded ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-amber-400/50 bg-amber-400/5') : (isEmbedded ? 'border-stone-200 bg-white hover:border-stone-300 shadow-sm text-stone-700' : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-300')}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`font-orbitron font-bold uppercase tracking-widest text-[11px] ${growthAddons.includes(a) && isEmbedded ? 'text-amber-700' : (isEmbedded ? 'text-stone-600' : 'text-amber-200')}`}>
                                                            Conversion Rate Optimization (CRO)
                                                        </span>
                                                        <span className={`${isEmbedded ? 'text-amber-600' : 'text-amber-400'} font-mono text-[12px] font-bold`}>+${PRICES.GROWTH[a]}</span>
                                                    </div>
                                                    <p className={`text-[11px] font-inter leading-relaxed ${isEmbedded ? (growthAddons.includes(a) ? 'text-amber-800/70' : 'text-stone-500') : 'text-gray-500'}`}>{DESCRIPTIONS.GROWTH[a]}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={nextStep} className={`w-full py-4 mt-2 rounded-xl font-orbitron text-[11px] tracking-[0.3em] transition-all active:scale-95 ${isEmbedded ? 'border border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100' : 'bg-white/10 hover:bg-white/20'}`}>CONFIRM STACK</button>
                                </div>
                            )}

                            {/* Step 3: Visual & AI Layer */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <p className={`text-sm font-inter font-semibold ${isEmbedded ? 'text-stone-600' : 'text-gray-300'}`}>Visual Identity & Identity Design:</p>
                                        <div className="grid gap-3">
                                            {(['webgl_lite', 'webgl_bespoke'] as BrandLevel[]).map(l => (
                                                <button key={l} onClick={() => setBrand(l)} className={`text-left p-5 rounded-2xl border transition-all active:scale-95 ${brand === l ? (isEmbedded ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-cyan-400 bg-cyan-400/10') : (isEmbedded ? 'border-stone-200 bg-white hover:border-stone-300 shadow-sm text-stone-700' : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-300')}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`font-orbitron font-bold uppercase tracking-widest text-[11px] ${brand === l && isEmbedded ? 'text-cyan-700' : ''}`}>
                                                            {l === 'webgl_lite' ? 'Premium Identity' : 'Bespoke WebGL Identity'}
                                                        </span>
                                                        <span className={`${isEmbedded ? 'text-cyan-600' : 'text-cyan-400'} font-mono text-[12px] font-bold`}>
                                                            +${PRICES.BRANDING[l]}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[11px] font-inter leading-relaxed ${isEmbedded ? (brand === l ? 'text-cyan-800/70' : 'text-stone-500') : 'text-gray-500'}`}>{DESCRIPTIONS.BRANDING[l]}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className={`text-sm font-inter font-semibold ${isEmbedded ? 'text-stone-600' : 'text-gray-300'}`}>Automation & AI Infrastructure (Optional):</p>
                                        {(['crm_routing'] as AiAddon[]).map(a => (
                                            <button key={a} onClick={() => toggleAi(a)} className={`text-left p-6 rounded-2xl border transition-all active:scale-95 w-full ${aiAddons.includes(a) ? (isEmbedded ? 'border-purple-400 bg-purple-50 shadow-sm' : 'border-purple-400/50 bg-purple-400/5') : (isEmbedded ? 'border-stone-200 bg-white hover:border-stone-300 shadow-sm text-stone-700' : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-300')}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-orbitron font-bold uppercase tracking-widest text-[11px] ${aiAddons.includes(a) && isEmbedded ? 'text-purple-700' : (isEmbedded ? 'text-stone-600' : 'text-purple-200')}`}>
                                                        AI Lead Routing & CRM Sync
                                                    </span>
                                                    <span className={`${isEmbedded ? 'text-purple-600' : 'text-purple-400'} font-mono text-[12px] font-bold`}>+${PRICES.AI[a]}</span>
                                                </div>
                                                <p className={`text-[11px] font-inter leading-relaxed ${isEmbedded ? (aiAddons.includes(a) ? 'text-purple-800/70' : 'text-stone-500') : 'text-gray-500'}`}>{DESCRIPTIONS.AI[a]}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={nextStep} className={`w-full py-4 mt-2 border rounded-xl font-orbitron text-[11px] tracking-[0.3em] transition-all active:scale-95 ${isEmbedded ? 'border-purple-200 text-purple-600 hover:bg-purple-50' : 'border-purple-400/20 text-purple-200 hover:bg-purple-400/5'}`}>ESTABLISH CORE</button>
                                </div>
                            )}

                            {/* Step 4: Timeline & Dispatch (formerly Step 5/6) */}
                            {step === 4 && !sent && (
                                <div className="space-y-8">
                                    <div className="space-y-4 text-center">
                                        <p className={`text-sm ${isEmbedded ? 'text-stone-500' : 'text-gray-400'}`}>Select delivery speed:</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsUrgent(false)} className={`flex-1 p-5 rounded-xl border font-orbitron active:scale-95 transition-all ${!isUrgent ? (isEmbedded ? 'border-cyan-400 bg-cyan-50 shadow-sm text-cyan-700' : 'border-cyan-400 bg-cyan-400/10 text-white') : (isEmbedded ? 'border-stone-200 bg-white text-stone-500 hover:border-stone-300' : 'border-white/5 text-gray-500')}`}>
                                                <span className="text-[11px] tracking-widest block">STANDARD</span>
                                                <span className={`text-[10px] mt-1 block font-inter ${!isUrgent && isEmbedded ? 'text-cyan-800/70' : 'opacity-70'}`}>3–4 weeks</span>
                                            </button>
                                            <button onClick={() => setIsUrgent(true)} className={`flex-1 p-5 rounded-xl border font-orbitron active:scale-95 transition-all ${isUrgent ? (isEmbedded ? 'border-red-400 bg-red-50 shadow-sm text-red-700' : 'border-red-400 bg-red-400/10 text-white') : (isEmbedded ? 'border-stone-200 bg-white text-stone-500 hover:border-stone-300' : 'border-white/5 text-gray-500')}`}>
                                                <span className="text-[11px] tracking-widest block">URGENT</span>
                                                <span className={`text-[10px] mt-1 block font-inter ${isUrgent && isEmbedded ? 'text-red-800/70' : 'opacity-70'}`}>+50% — 1–2 weeks</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-center pt-4">
                                        <label htmlFor="contact-input" className="sr-only">Contact information</label>
                                        <input
                                            id="contact-input"
                                            type="text"
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            placeholder="TELEGRAM @HANDLE OR EMAIL"
                                            className={`w-full bg-transparent border-b py-4 text-center text-xl font-orbitron focus:outline-none focus:border-cyan-400 transition-all ${isEmbedded ? 'border-stone-300 text-stone-800 placeholder:text-stone-300' : 'border-white/20 text-white placeholder:text-white/20'}`}
                                        />
                                    </div>

                                    <div className={`rounded-2xl p-6 border text-center ${isEmbedded ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                                        <span className={`text-[11px] font-orbitron uppercase tracking-[0.3em] ${isEmbedded ? 'text-stone-500' : 'text-gray-500'}`}>Your Estimate</span>
                                        <h3 className={`text-5xl font-orbitron font-black mt-2 ${isEmbedded ? 'text-stone-800' : 'text-white'}`}>
                                            ${totalPrice.toLocaleString()}
                                        </h3>
                                        <p className={`text-[11px] mt-3 font-inter leading-relaxed ${isEmbedded ? 'text-stone-500' : 'text-gray-500'}`}>
                                            Includes: {strategy === 'audit' ? 'Full Strategy' : 'Standard'} · {tech} architecture
                                            {growthAddons.length > 0 && ` · CRO`}
                                            {brand === 'webgl_bespoke' && ` · Bespoke WebGL`}
                                            {aiAddons.length > 0 && ` · AI Routing`}
                                            {isUrgent && ' · URGENT +50%'}
                                        </p>
                                    </div>

                                    <button onClick={handleSend} disabled={!contact || isSending} className={`w-full py-6 font-orbitron font-black tracking-[0.4em] rounded-xl transition-all disabled:opacity-20 active:scale-95 ${isEmbedded ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-cyan-400 text-black hover:bg-white'}`}>
                                        {isSending ? 'SENDING...' : 'DISPATCH REQUEST →'}
                                    </button>
                                </div>
                            )}

                            {/* Final: Sent */}
                            {sent && (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20 flex flex-col items-center">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 ${isEmbedded ? 'bg-cyan-50' : 'bg-cyan-500/10'}`}>
                                        <svg className={`w-10 h-10 ${isEmbedded ? 'text-cyan-500' : 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h2 className={`text-3xl font-orbitron font-bold mb-4 ${isEmbedded ? 'text-stone-800' : 'text-white'}`}>Request Sent!</h2>
                                    <p className={`font-mono text-sm uppercase tracking-widest ${isEmbedded ? 'text-stone-500' : 'text-gray-400'}`}>I'll reach out within 24 hours</p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                {step > 0 && !sent && (
                    <div className={`flex justify-start border-t items-center ${isEmbedded ? 'border-stone-100 pt-6 mt-6' : 'border-white/5 pt-6'}`}>
                        <button onClick={prevStep} className={`font-orbitron font-bold text-[11px] tracking-widest uppercase transition-colors ${isEmbedded ? 'text-stone-400 hover:text-stone-700' : 'text-gray-500 hover:text-white'}`}>[ ← Back ]</button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
