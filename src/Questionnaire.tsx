import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type SiteType = 'landing' | 'ecommerce' | 'corporate' | 'creative'

interface QuestionnaireProps {
    onClose: () => void
}

export const Questionnaire = ({ onClose }: QuestionnaireProps) => {
    const [step, setStep] = useState(1)
    const [siteType, setSiteType] = useState<SiteType | null>(null)
    const [contact, setContact] = useState('')

    // Placeholder function for images - normally these would be the generated assets
    const getTypeImage = (type: SiteType) => {
        // Using CSS gradients as placeholders until images are ready
        switch (type) {
            case 'landing': return 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
            case 'ecommerce': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            case 'corporate': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            case 'creative': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        }
    }

    const handleSend = () => {
        const message = `🚀 NEW PROJECT INQUIRY%0A%0A--------------------------------%0A📁 TYPE: ${siteType?.toUpperCase()}%0A👤 CONTACT: ${contact}%0A--------------------------------`
        window.open(`https://t.me/XXXENIA999?text=${message}`, '_blank')
        onClose()
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-orbitron font-bold text-white text-center mb-8">
                                Select <span className="text-cyan-400">Project Type</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(['landing', 'ecommerce', 'corporate', 'creative'] as SiteType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => { setSiteType(type); setStep(2) }}
                                        className="relative group overflow-hidden rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all duration-300 h-32 md:h-40 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10"
                                    >
                                        <div
                                            className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                                            style={{ background: getTypeImage(type) }}
                                        />
                                        <span className="relative z-10 font-orbitron font-bold uppercase tracking-widest text-white">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6 text-center"
                        >
                            <h2 className="text-2xl font-orbitron font-bold text-white mb-2">
                                Contact <span className="text-cyan-400">Protocol</span>
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">Where should we send the blueprint?</p>

                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="@telegram_handle or email"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-white text-center focus:outline-none focus:border-cyan-400/50 transition-all font-mono"
                                autoFocus
                            />

                            <div className="flex gap-4 justify-center mt-8">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 text-gray-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={!contact}
                                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold font-orbitron tracking-widest rounded shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Initialize
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                    <motion.div
                        className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                        animate={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
