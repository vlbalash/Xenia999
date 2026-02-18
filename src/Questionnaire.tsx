import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- PRICING MATRIX (USD) ---
const PRICES = {
    TYPE: {
        landing: 1500,
        corp: 3500,
        shop: 6000
    },
    DESIGN: {
        template: 0,
        unique: 1200,
        premium: 3500
    },
    TECH: {
        px: 800,
        content: 200,
        seo: 500,
        integration: 1500
    },
    ESOTERIC: {
        fengshui: 1333,
        runes: 999,
        astro: 1111
    },
    URGENT_MULTIPLIER: 1.6
}

type SiteType = 'landing' | 'corp' | 'shop'
type DesignLevel = 'template' | 'unique' | 'premium'
type TechAddon = 'px' | 'content' | 'seo' | 'integration'
type EsotericAddon = 'fengshui' | 'runes' | 'astro'

interface QuestionnaireProps {
    onClose: () => void
}

export const Questionnaire = ({ onClose }: QuestionnaireProps) => {
    const [step, setStep] = useState(1)
    const [siteType, setSiteType] = useState<SiteType>('landing')
    const [designLevel, setDesignLevel] = useState<DesignLevel>('unique')
    const [techAddons, setTechAddons] = useState<TechAddon[]>([])
    const [esotericAddons, setEsotericAddons] = useState<EsotericAddon[]>([])
    const [isUrgent, setIsUrgent] = useState(false)
    const [contact, setContact] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)

    // --- Escape key to close ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    // --- CALCULATION LOGIC ---
    const totalPrice = useMemo(() => {
        let base = PRICES.TYPE[siteType] + PRICES.DESIGN[designLevel]
        techAddons.forEach(a => base += PRICES.TECH[a])
        esotericAddons.forEach(a => base += PRICES.ESOTERIC[a])
        return Math.round(base * (isUrgent ? PRICES.URGENT_MULTIPLIER : 1))
    }, [siteType, designLevel, techAddons, esotericAddons, isUrgent])

    const toggleTech = (item: TechAddon) => {
        setTechAddons(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
    }

    const toggleEsoteric = (item: EsotericAddon) => {
        setEsotericAddons(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
    }

    const handleSend = async () => {
        setIsSending(true)
        try {
            const message = [
                `*New Professional Invoice*`,
                `Type: ${siteType} ($${PRICES.TYPE[siteType]})`,
                `Design: ${designLevel} ($${PRICES.DESIGN[designLevel]})`,
                `Tech: ${techAddons.join(', ') || 'None'}`,
                `Esoteric: ${esotericAddons.join(', ') || 'None'}`,
                `Urgent: ${isUrgent ? 'YES' : 'NO'}`,
                `*TOTAL: $${totalPrice}*`,
                `Contact: ${contact}`
            ].join('\n')

            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Invoice #${Math.floor(Math.random() * 10000)}`,
                    email: contact,
                    message: message
                })
            })
            setSent(true)
            setTimeout(() => onClose(), 5000)
        } catch {
            alert('Protocol Connection Error')
        } finally {
            setIsSending(false)
        }
    }

    const nextStep = () => setStep(prev => prev + 1)
    const prevStep = () => setStep(prev => prev - 1)

    const glassStyle = "glass-panel rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden overflow-y-auto max-h-[90vh] flex flex-col"

    return (
        <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl"
            role="dialog"
            aria-modal="true"
            aria-label="Project Calculator"
            style={{
                backgroundImage: 'url(/questionnaire_bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={glassStyle}>
                {/* Header & Close */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <span className="text-[11px] font-orbitron font-bold tracking-[0.5em] text-cyan-400 uppercase">Identity Digital Sales</span>
                        <h2 className="text-3xl font-orbitron font-black text-white mt-1">
                            {step < 6 ? `Phase 0${step}` : "Secure Invoice"}
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

                {/* Progress Bar */}
                <div className="flex gap-2 mb-10" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={6} aria-label="Calculator progress">
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-cyan-400 shadow-[0_0_10px_#00ffff]' : 'bg-white/5'}`} />
                    ))}
                </div>

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
                            {/* Step 1: Base Type */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm font-inter">Select core digital architecture:</p>
                                    <div className="grid gap-3">
                                        {(['landing', 'corp', 'shop'] as SiteType[]).map(t => (
                                            <button key={t} onClick={() => { setSiteType(t); nextStep(); }} className={`text-left p-6 rounded-2xl border transition-all active:scale-95 ${siteType === t ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-orbitron font-bold uppercase tracking-widest text-[11px]">{t === 'landing' ? 'Landing Page' : t === 'corp' ? 'Corporate Portal' : 'E-Commerce'}</span>
                                                    <span className="text-cyan-400 font-mono text-[11px]">${PRICES.TYPE[t]}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Design Level */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm font-inter">Define visual philosophy:</p>
                                    <div className="grid gap-3">
                                        {(['template', 'unique', 'premium'] as DesignLevel[]).map(l => (
                                            <button key={l} onClick={() => { setDesignLevel(l); nextStep(); }} className={`text-left p-6 rounded-2xl border transition-all active:scale-95 ${designLevel === l ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-orbitron font-bold uppercase tracking-widest text-[11px]">{l}</span>
                                                    <span className="text-cyan-400 font-mono text-[11px]">+{PRICES.DESIGN[l]}</span>
                                                </div>
                                                <p className="text-gray-500 text-[11px] mt-2 uppercase tracking-tight">
                                                    {l === 'template' && "High-quality base with minor tweaks"}
                                                    {l === 'unique' && "Custom layout from the ground up"}
                                                    {l === 'premium' && "3D depth, complex animations & radical VFX"}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Tech Add-ons */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm font-inter">Enhance technical integrity:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['px', 'content', 'seo', 'integration'] as TechAddon[]).map(a => (
                                            <button key={a} onClick={() => toggleTech(a)} className={`p-5 rounded-2xl border transition-all text-center active:scale-95 ${techAddons.includes(a) ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                                <span className="font-orbitron font-bold uppercase tracking-widest text-[11px] block mb-2">{a === 'px' ? 'Pixel Perfect' : a === 'content' ? 'Full Content' : a === 'seo' ? 'SEO Master' : 'Integrations'}</span>
                                                <span className="text-cyan-400 font-mono text-[11px]">+${PRICES.TECH[a]}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={nextStep} className="w-full py-4 mt-4 bg-white/10 rounded-xl font-orbitron text-[11px] tracking-[0.3em] hover:bg-white/20 active:scale-95 transition-all">CONFIRM TECH STACK</button>
                                </div>
                            )}

                            {/* Step 4: Esoteric Add-ons */}
                            {step === 4 && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-sm font-inter">Establish brand harmony & energy:</p>
                                    <div className="grid gap-3">
                                        {(['fengshui', 'runes', 'astro'] as EsotericAddon[]).map(a => (
                                            <button key={a} onClick={() => toggleEsoteric(a)} className={`text-left p-6 rounded-2xl border transition-all active:scale-95 ${esotericAddons.includes(a) ? 'border-amber-400/50 bg-amber-400/5' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-orbitron font-bold uppercase tracking-widest text-[11px] text-amber-200">{a === 'fengshui' ? 'Web Feng-Shui' : a === 'runes' ? 'Runic Code Protection' : 'Astro-Numerology'}</span>
                                                    <span className="text-amber-400 font-mono text-[11px]">(+${PRICES.ESOTERIC[a]})</span>
                                                </div>
                                                <p className="text-gray-500 text-[11px] mt-2 italic">
                                                    {a === 'fengshui' && "Strategic grid & color balancing for perfect energy flow"}
                                                    {a === 'runes' && "Embedding protective sigils into the code architecture"}
                                                    {a === 'astro' && "Calculated launch timing & color-domain resonance"}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={nextStep} className="w-full py-4 mt-2 border border-amber-400/20 text-amber-200 rounded-xl font-orbitron text-[11px] tracking-[0.3em] hover:bg-amber-400/5 transition-all active:scale-95">ESTABLISH HARMONY</button>
                                </div>
                            )}

                            {/* Step 5: Timeline & Contact */}
                            {step === 5 && (
                                <div className="space-y-8">
                                    <div className="space-y-4 text-center">
                                        <p className="text-gray-400 text-sm">Select build velocity:</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsUrgent(false)} className={`flex-1 p-4 rounded-xl border font-orbitron text-[11px] tracking-widest active:scale-95 transition-all ${!isUrgent ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5'}`}>STANDARD (4W)</button>
                                            <button onClick={() => setIsUrgent(true)} className={`flex-1 p-4 rounded-xl border font-orbitron text-[11px] tracking-widest active:scale-95 transition-all ${isUrgent ? 'border-red-400 bg-red-400/10' : 'border-white/5'}`}>URGENT (x1.6)</button>
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
                                            className="w-full bg-transparent border-b border-white/20 py-4 text-center text-xl font-orbitron text-white focus:outline-none focus:border-cyan-400 transition-all placeholder:text-white/20"
                                        />
                                    </div>

                                    <button onClick={nextStep} disabled={!contact} className="w-full py-6 bg-cyan-400 text-black font-orbitron font-black tracking-[0.4em] rounded-xl hover:bg-white transition-all disabled:opacity-20 active:scale-95">GENERATE INVOICE</button>
                                </div>
                            )}

                            {/* Step 6: Payment / Requisites */}
                            {step === 6 && !sent && (
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                                        <span className="text-[11px] font-orbitron text-gray-500 uppercase tracking-[0.3em]">Estimated Total</span>
                                        <h3 className="text-5xl font-orbitron font-black text-white mt-4">$ {totalPrice}</h3>
                                        <p className="text-[11px] text-gray-500 mt-2 italic uppercase">Calculated with {isUrgent ? 'URGENT' : 'STANDARD'} priority</p>
                                    </div>

                                    <div className="grid gap-3">
                                        <button
                                            onClick={() => window.open('https://invoice.easystaff.io/cust_log?freel_id=1f0b7f2f-e0fe-6ac4-963a-83690f805e19', '_blank')}
                                            className="w-full py-4 bg-white text-black font-orbitron font-bold tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex justify-between px-8 items-center active:scale-95"
                                        >
                                            <span>FIAT INVOICE</span>
                                            <span className="text-[11px] font-mono opacity-50">BY CARD/BANK</span>
                                        </button>

                                        <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <h4 className="text-[11px] font-orbitron font-bold text-gray-400 tracking-widest uppercase mb-2">Crypto Protocol</h4>
                                            <div className="flex justify-between items-center font-mono text-[12px]">
                                                <span className="text-gray-500">USDT (TRC20)</span>
                                                <span className="text-white bg-white/5 px-2 py-1 rounded">TR7NHqDj...3Z</span>
                                            </div>
                                            <div className="flex justify-between items-center font-mono text-[12px]">
                                                <span className="text-gray-500">BTC</span>
                                                <span className="text-white bg-white/5 px-2 py-1 rounded">bc1qx8m...4p</span>
                                            </div>
                                            <button onClick={handleSend} disabled={isSending} className="w-full py-4 mt-2 border border-cyan-400/30 text-cyan-400 rounded-xl font-orbitron text-[11px] tracking-[0.3em] hover:bg-cyan-400/10 transition-all active:scale-95 disabled:opacity-50"> {isSending ? 'PROCESSING...' : 'ESTABLISH CONTACT & LOG'} </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step Final: Sent */}
                            {sent && (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8">
                                        <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h2 className="text-3xl font-orbitron font-bold text-white mb-4">Transmission Successful</h2>
                                    <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Awaiting Architect Verification</p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                {step > 1 && !sent && (
                    <div className="flex justify-start border-t border-white/5 pt-6">
                        <button onClick={prevStep} className="font-orbitron font-bold text-[11px] text-gray-500 hover:text-white transition-colors tracking-widest uppercase"> [ Back ] </button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
