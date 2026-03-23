import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    PageIdentity,
    PageQuestionnaire,
    PageClassification,
    PageDeliverables,
    PageRoadmap,
    PagePricing,
    PageFinal,
} from './Pages'

interface Props {
    isOpen: boolean
    onClose: () => void
}

/**
 * LogbookModal — 7-step psychological sales funnel.
 * Flow:  Pain → Goals → Scope → Pricing Mode → [Package | Services] → Contact
 * Branch: page 4 routes to either PageRoadmap (packages) or PagePricing (à la carte)
 */
export function LogbookModal({ isOpen, onClose }: Props) {
    const [page, setPage] = useState(0)
    const [mode, setMode] = useState<'package' | 'custom' | null>(null)
    const [finalSummary, setFinalSummary] = useState('')

    const TOTAL_STEPS = 6 // Pain / Goals / Scope / Mode / Pick / Contact
    // Actual page index maps: 0=Pain,1=Goals,2=Scope,3=Mode,4=Pick(branch),5=Contact
    const progress = Math.round((page / TOTAL_STEPS) * 100)

    const stepTitles = [
        'What\'s your challenge?',
        'Your vision',
        'Project scope',
        'How to engage?',
        mode === 'package' ? 'Choose your package' : 'Build your plan',
        'Almost there',
    ]

    const handleClose = () => {
        onClose()
        // reset after animation
        setTimeout(() => {
            setPage(0)
            setMode(null)
            setFinalSummary('')
        }, 400)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, y: 32, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-md bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col max-h-[min(680px,94vh)]">
                            {/* Header */}
                            <div className="flex-none px-5 pt-5 pb-3">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-inter text-[9px] font-bold text-stone-300 uppercase tracking-[0.2em]">
                                            Step {page + 1} of {TOTAL_STEPS + 1}
                                        </p>
                                        <h2 className="font-inter font-black text-stone-800 text-base mt-0.5 leading-tight">
                                            {stepTitles[page] ?? 'Your brief'}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all text-sm"
                                        aria-label="Close"
                                        title="Close"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>

                            {/* Scrollable content area — minimal to avoid need for scroll */}
                            <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={page}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        transition={{ duration: 0.22, ease: 'easeOut' }}
                                    >
                                        {page === 0 && (
                                            <PageIdentity onNext={() => setPage(1)} />
                                        )}
                                        {page === 1 && (
                                            <PageQuestionnaire onNext={() => setPage(2)} />
                                        )}
                                        {page === 2 && (
                                            <PageClassification onNext={() => setPage(3)} />
                                        )}
                                        {page === 3 && (
                                            <PageDeliverables onNext={(m) => {
                                                setMode(m)
                                                setPage(4)
                                            }} />
                                        )}
                                        {page === 4 && mode === 'package' && (
                                            <PageRoadmap onNext={(tier) => {
                                                setFinalSummary(tier)
                                                setPage(5)
                                            }} />
                                        )}
                                        {page === 4 && mode === 'custom' && (
                                            <PagePricing onNext={(svcs, total) => {
                                                setFinalSummary(svcs.length > 0 ? `${svcs.length} services · ~£${total.toLocaleString()}` : 'Custom build')
                                                setPage(5)
                                            }} />
                                        )}
                                        {page === 5 && (
                                            <PageFinal tierOrServices={finalSummary} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Back nav */}
                            {page > 0 && (
                                <div className="flex-none px-5 pb-4">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        className="text-stone-400 hover:text-stone-600 font-inter text-[10px] tracking-wider uppercase transition-colors"
                                        title="Go back"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
