import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Shared styles ─────────────────────────────────────────────────────────────
const label = "block text-[9px] font-mono font-bold text-white/50 uppercase tracking-[0.18em] mb-2"

const chip = (active: boolean) =>
    `px-3 py-2 text-[11px] font-inter font-medium rounded-xl border transition-all duration-200 cursor-pointer text-left backdrop-blur-md ${
        active
            ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
    }`

const nextBtn = "w-full py-3.5 mt-2 font-orbitron font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all " +
    "bg-white text-black " +
    "shadow-[0_0_20px_rgba(255,255,255,0.15)] " +
    "hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"

// ─── Page 1: Pain Anchor ───────────────────────────────────────────────────────
const pains = [
    { icon: '📉', text: 'Site looks outdated / not converting' },
    { icon: '🧩', text: 'No clear tech strategy or architecture' },
    { icon: '🤖', text: 'Need AI features but don\'t know how' },
    { icon: '🚀', text: 'MVP ready but needs to impress investors' },
    { icon: '💥', text: 'Starting from scratch, blank canvas' },
]

export const PageIdentity = ({ onNext }: { onNext: () => void }) => {
    const [pain, setPain] = useState('')
    const [stage, setStage] = useState('')
    const stages = ['Just an idea', 'Early MVP', 'Working product', 'Scaling / Fundraising']

    return (
        <div className="flex flex-col gap-3">
            <div>
                <p className={label}>What's holding you back right now?</p>
                <div className="flex flex-col gap-1.5">
                    {pains.map(p => (
                        <motion.button 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            key={p.text} 
                            onClick={() => { setPain(p.text); window.dispatchEvent(new CustomEvent('play-typing-sound')); }} 
                            className={chip(pain === p.text)} title={p.text}
                        >
                            <span className="mr-2">{p.icon}</span>{p.text}
                        </motion.button>
                    ))}
                </div>
            </div>
            <div>
                <p className={label}>Where are you in the journey?</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {stages.map(s => (
                        <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            key={s} 
                            onClick={() => { setStage(s); window.dispatchEvent(new CustomEvent('play-typing-sound')); }} 
                            className={chip(stage === s)} title={s}
                        >
                            {s}
                        </motion.button>
                    ))}
                </div>
            </div>
            <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { window.dispatchEvent(new CustomEvent('play-launch-sound')); onNext(); }} 
                disabled={!pain || !stage} 
                className={nextBtn} title="Continue"
            >
                Continue →
            </motion.button>
        </div>
    )
}

// ─── Page 2: Goals + Vision ────────────────────────────────────────────────────
const goals = ['Attract investors', 'Generate leads', 'Showcase technology', 'Enterprise sales / Tenders', 'Product launch', 'Brand repositioning']
const vibes = ['Minimal & Premium', 'Dark & Futuristic', 'Bold & Energetic', 'Data-heavy / Technical', 'Playful & Creative']

export const PageQuestionnaire = ({ onNext }: { onNext: () => void }) => {
    const [goal, setGoal] = useState('')
    const [vibe, setVibe] = useState('')

    return (
        <div className="flex flex-col gap-3">
            <div>
                <p className={label}>Primary goal for this project</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {goals.map(g => (
                        <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            key={g} 
                            onClick={() => { setGoal(g); window.dispatchEvent(new CustomEvent('play-typing-sound')); }} 
                            className={chip(goal === g)} title={g}
                        >
                            {g}
                        </motion.button>
                    ))}
                </div>
            </div>
            <div>
                <p className={label}>What feeling should the site evoke?</p>
                <div className="flex flex-wrap gap-1.5">
                    {vibes.map(v => (
                        <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            key={v} 
                            onClick={() => { setVibe(v); window.dispatchEvent(new CustomEvent('play-typing-sound')); }} 
                            className={chip(vibe === v)} title={v}
                        >
                            {v}
                        </motion.button>
                    ))}
                </div>
            </div>
            <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { window.dispatchEvent(new CustomEvent('play-launch-sound')); onNext(); }} 
                disabled={!goal || !vibe} 
                className={nextBtn} title="Continue"
            >
                Continue →
            </motion.button>
        </div>
    )
}

// ─── Page 3: Scope Classification ─────────────────────────────────────────────
const types = ['AI / SaaS Platform', 'DeepTech / R&D', 'AgriTech / Climate', 'Enterprise Software', 'Hardware + Software', 'Portfolio / Studio', 'E-commerce', 'Other']
const scales = ['Landing page only', '3–5 pages', '10+ pages / full platform', 'Mobile app + web', 'Custom (let\'s discuss)']

export const PageClassification = ({ onNext }: { onNext: () => void }) => {
    const [type, setType] = useState('')
    const [scale, setScale] = useState('')

    return (
        <div className="flex flex-col gap-3">
            <div>
                <p className={label}>What type of product is this?</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {types.map(t => (
                        <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            key={t} 
                            onClick={() => { setType(t); window.dispatchEvent(new CustomEvent('play-typing-sound')); }} 
                            className={chip(type === t)} title={t}
                        >
                            {t}
                        </motion.button>
                    ))}
                </div>
            </div>
            <div>
                <p className={label}>Scope & scale</p>
                <div className="flex flex-col gap-1.5">
                    {scales.map(s => (
                        <motion.button 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            key={s} 
                            onClick={() => { setScale(s); window.dispatchEvent(new CustomEvent('play-typing-sound')); }} 
                            className={chip(scale === s)} title={s}
                        >
                            {s}
                        </motion.button>
                    ))}
                </div>
            </div>
            <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { window.dispatchEvent(new CustomEvent('play-launch-sound')); onNext(); }} 
                disabled={!type || !scale} 
                className={nextBtn} title="Continue"
            >
                Continue →
            </motion.button>
        </div>
    )
}

// ─── Page 4: Pricing Model Choice ─────────────────────────────────────────────
export const PageDeliverables = ({ onNext }: { onNext: (mode: 'package' | 'custom') => void }) => {
    const [hover, setHover] = useState<string | null>(null)
    const options = [
        {
            id: 'package',
            icon: '📦',
            title: 'Choose a Package',
            sub: 'Curated bundles at fixed price',
            desc: 'Best for: startups, MVPs, defined scope projects',
            color: 'violet',
        },
        {
            id: 'custom',
            icon: '🔧',
            title: 'Build à la Carte',
            sub: 'Pick only what you need',
            desc: 'Best for: adding features, augmenting existing sites',
            color: 'orange',
        },
    ]
    return (
        <div className="flex flex-col gap-4">
            <div className="text-center">
                <p className="font-inter text-stone-700 font-semibold text-sm">How do you prefer to engage?</p>
                <p className="font-inter text-stone-400 text-xs mt-1">This shapes the proposal we send you</p>
            </div>
            <div className="flex flex-col gap-3">
                {options.map(o => (
                    <motion.button
                        key={o.id}
                        onHoverStart={() => setHover(o.id)}
                        onHoverEnd={() => setHover(null)}
                        onClick={() => { window.dispatchEvent(new CustomEvent('play-launch-sound')); onNext(o.id as 'package' | 'custom'); }}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        title={o.title}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                            hover === o.id
                                ? o.id === 'package'
                                    ? 'border-violet-300 bg-violet-50 shadow-[0_4px_20px_rgba(139,92,246,0.12)]'
                                    : 'border-orange-300 bg-orange-50 shadow-[0_4px_20px_rgba(251,146,60,0.12)]'
                                : 'border-stone-200 bg-white'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{o.icon}</span>
                            <div>
                                <p className="font-inter font-bold text-stone-800 text-sm">{o.title}</p>
                                <p className="font-inter text-stone-500 text-xs mt-0.5">{o.sub}</p>
                                <p className="font-inter text-stone-400 text-[10px] mt-1.5 italic">{o.desc}</p>
                            </div>
                            <span className="ml-auto text-stone-300 text-lg">→</span>
                        </div>
                    </motion.button>
                ))}
            </div>
            <p className="font-inter text-[9px] text-stone-300 text-center tracking-widest uppercase">
                All prices are market-rate UK/EU freelancer estimates
            </p>
        </div>
    )
}

// ─── Page 5A: Package Tiers ────────────────────────────────────────────────────
interface TierData { name: string; price: string; tagline: string; badge?: string; features: string[]; ideal: string; color: string }
const tiers: TierData[] = [
    {
        name: 'Spark',
        price: '£700 – £1,500',
        tagline: 'Your fastest launchpad',
        features: ['Single landing page', 'Mobile-responsive design', 'Basic copywriting', 'Contact form + analytics', '2 revision rounds'],
        ideal: 'Freelancers, small business, quick MVP',
        color: 'stone',
    },
    {
        name: 'Orbit',
        price: '£2,500 – £5,000',
        tagline: 'Grow with confidence',
        badge: '✦ Most Popular',
        features: ['3–5 page website', 'Custom UI/UX design', 'CMS integration', 'Basic SEO setup', 'Performance optimised', '3 revision rounds'],
        ideal: 'Startups, early-stage SaaS, brands',
        color: 'violet',
    },
    {
        name: 'Nova',
        price: '£7,000 – £15,000',
        tagline: 'Investor-grade presence',
        features: ['10+ pages / full platform', 'Premium 3D / WebGL visuals', 'AI-integrated features', 'Custom backend/API', 'Advanced SEO & analytics', '5 revision rounds'],
        ideal: 'Scale-ups, funded startups, enterprise',
        color: 'blue',
    },
    {
        name: 'Xenia',
        price: 'From £20,000',
        tagline: 'Impossible made real',
        badge: '⚡ Full-Stack',
        features: ['Full product build', 'Dedicated dev team', '3D / AR / AI all included', 'White-glove delivery', 'Ongoing retainer support', 'Priority SLA'],
        ideal: 'Enterprise, VC-backed, deep-tech',
        color: 'orange',
    },
]

const colorMap: Record<string, string> = {
    stone: 'border-stone-200 bg-stone-50',
    violet: 'border-violet-300 bg-violet-50',
    blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-300 bg-orange-50',
}
const badgeMap: Record<string, string> = {
    stone: 'bg-stone-200 text-stone-600',
    violet: 'bg-violet-200 text-violet-700',
    blue: 'bg-blue-200 text-blue-700',
    orange: 'bg-orange-200 text-orange-700',
}
const priceMap: Record<string, string> = {
    stone: 'text-stone-700',
    violet: 'text-violet-700',
    blue: 'text-blue-700',
    orange: 'text-orange-600',
}

export const PageRoadmap = ({ onNext }: { onNext: (tier: string) => void }) => {
    const [selected, setSelected] = useState('')

    return (
        <div className="flex flex-col gap-3">
            <p className={label}>Choose a package — all include 1-week kickoff</p>
            <div className="grid grid-cols-2 gap-2">
                {tiers.map(t => (
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        key={t.name}
                        onClick={() => { setSelected(t.name); window.dispatchEvent(new CustomEvent('play-typing-sound')); }}
                        title={t.name}
                        className={`text-left p-3 rounded-2xl border-2 transition-all duration-200 ${
                            selected === t.name
                                ? colorMap[t.color] + ' shadow-md'
                                : 'border-stone-100 bg-white hover:border-stone-200'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className={`font-inter font-black text-xs ${selected === t.name ? priceMap[t.color] : 'text-stone-700'}`}>{t.name}</span>
                            {t.badge && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${badgeMap[t.color]}`}>{t.badge}</span>}
                        </div>
                        <p className={`font-inter font-semibold text-[10px] mb-1 ${selected === t.name ? priceMap[t.color] : 'text-stone-500'}`}>{t.price}</p>
                        <p className="font-inter text-[9px] text-stone-400 italic mb-2">{t.tagline}</p>
                        <ul className="space-y-0.5">
                            {t.features.slice(0, 3).map(f => (
                                <li key={f} className="font-inter text-[9px] text-stone-500 flex gap-1">
                                    <span className="text-green-500">✓</span>{f}
                                </li>
                            ))}
                            {t.features.length > 3 && (
                                <li className="font-inter text-[9px] text-stone-400">+{t.features.length - 3} more included</li>
                            )}
                        </ul>
                    </motion.button>
                ))}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { window.dispatchEvent(new CustomEvent('play-launch-sound')); onNext(selected); }} disabled={!selected} className={nextBtn} title="Select this package">
                Select Package →
            </motion.button>
        </div>
    )
}

// ─── Page 5B: À la Carte Service Builder ──────────────────────────────────────
interface Service { id: string; name: string; price: number; priceLabel: string; category: string }
const services: Service[] = [
    // Design
    { id: 'lp', name: 'Landing Page Design', price: 700, priceLabel: '£700', category: 'Design' },
    { id: 'ux', name: 'Full UX/UI Design System', price: 1200, priceLabel: '£1,200', category: 'Design' },
    { id: 'brand', name: 'Brand Identity Package', price: 800, priceLabel: '£800', category: 'Design' },
    // Development
    { id: 'cms', name: 'CMS Integration (Sanity/Strapi)', price: 600, priceLabel: '£600', category: 'Dev' },
    { id: 'api', name: 'Custom API / Backend', price: 1500, priceLabel: '£1,500', category: 'Dev' },
    { id: 'auth', name: 'Auth + User Accounts', price: 900, priceLabel: '£900', category: 'Dev' },
    // Premium / 3D
    { id: '3d', name: 'Premium 3D / WebGL Scene', price: 2000, priceLabel: '£2,000', category: '3D/Motion' },
    { id: 'anim', name: 'Motion & Micro-animations', price: 600, priceLabel: '£600', category: '3D/Motion' },
    // AI
    { id: 'ai', name: 'AI Feature (chatbot, recs, etc)', price: 1200, priceLabel: '£1,200', category: 'AI' },
    { id: 'ai2', name: 'AI Content Generation Pipeline', price: 900, priceLabel: '£900', category: 'AI' },
    // SEO / Analytics
    { id: 'seo', name: 'SEO Audit + On-page Setup', price: 400, priceLabel: '£400', category: 'SEO' },
    { id: 'analytics', name: 'Analytics + Tracking Setup', price: 200, priceLabel: '£200', category: 'SEO' },
    { id: 'content', name: 'Copywriting (per page)', price: 150, priceLabel: '£150/pg', category: 'Content' },
]

const categories = ['Design', 'Dev', '3D/Motion', 'AI', 'SEO', 'Content']
const catColor: Record<string, string> = {
    Design: 'bg-pink-50 text-pink-600 border-pink-200',
    Dev: 'bg-blue-50 text-blue-600 border-blue-200',
    '3D/Motion': 'bg-violet-50 text-violet-600 border-violet-200',
    AI: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    SEO: 'bg-amber-50 text-amber-600 border-amber-200',
    Content: 'bg-stone-50 text-stone-500 border-stone-200',
}

export const PagePricing = ({ onNext }: { onNext: (services: string[], total: number) => void }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [activeCategory, setActiveCategory] = useState('Design')

    const toggle = (id: string) => setSelected(prev => {
        const n = new Set(prev)
        n.has(id) ? n.delete(id) : n.add(id)
        return n
    })

    const filtered = services.filter(s => s.category === activeCategory)
    const total = services.filter(s => selected.has(s.id)).reduce((acc, s) => acc + s.price, 0)

    return (
        <div className="flex flex-col gap-3">
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap">
                {categories.map(c => (
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        key={c}
                        onClick={() => { setActiveCategory(c); window.dispatchEvent(new CustomEvent('play-typing-sound')); }}
                        title={c}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                            activeCategory === c ? catColor[c] : 'border-stone-200 text-stone-400 bg-white'
                        }`}
                    >
                        {c}
                    </motion.button>
                ))}
            </div>

            {/* Service list for active category */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-1.5"
                >
                    {filtered.map(s => (
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            key={s.id}
                            onClick={() => { toggle(s.id); window.dispatchEvent(new CustomEvent('play-typing-sound')); }}
                            title={s.name}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                                selected.has(s.id)
                                    ? 'border-violet-300 bg-violet-50 shadow-sm'
                                    : 'border-stone-100 bg-white hover:border-stone-200'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] border transition-all ${
                                    selected.has(s.id) ? 'bg-violet-500 border-violet-500 text-white' : 'border-stone-300'
                                }`}>
                                    {selected.has(s.id) ? '✓' : ''}
                                </span>
                                <span className="font-inter text-xs text-stone-700">{s.name}</span>
                            </div>
                            <span className="font-inter font-bold text-xs text-stone-500 whitespace-nowrap ml-2">{s.priceLabel}</span>
                        </motion.button>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Running total */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="font-inter text-[10px] text-stone-400 uppercase tracking-wider">{selected.size} service{selected.size !== 1 ? 's' : ''} selected</span>
                <span className="font-inter font-black text-stone-800 text-sm">
                    {total > 0 ? `~£${total.toLocaleString()}` : '£0'}
                </span>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { window.dispatchEvent(new CustomEvent('play-launch-sound')); onNext(Array.from(selected), total); }}
                disabled={selected.size === 0}
                className={nextBtn}
                title="Request proposal"
            >
                Request Proposal →
            </motion.button>
        </div>
    )
}

// ─── Page 6: Contact + Closing ─────────────────────────────────────────────────
const inputCls = "w-full bg-white/5 border border-white/10 focus:border-cyan-400 text-white font-mono text-xs p-3 rounded-xl outline-none transition-all placeholder:text-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-md"

export const PageFinal = ({ tierOrServices }: { tierOrServices: string }) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = () => {
        if (!name || !email) return
        // In production: POST to API / webhook
        console.log('Lead captured:', { name, email, selection: tierOrServices })
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-6 py-10 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                    className="text-6xl filter drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                >
                    🚀
                </motion.div>
                <h3 className="font-orbitron font-black text-white text-2xl tracking-widest uppercase">Protocol Initiated.</h3>
                <p className="font-mono text-cyan-300/70 text-sm leading-relaxed max-w-[280px]">
                    Neural link established. Custom proposal decrypting within <strong>24 hours</strong>.
                </p>
                <div className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <p className="font-orbitron font-bold text-cyan-300 text-[10px] tracking-[0.2em] uppercase">
                        Spec: {tierOrServices}
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                    <p className="font-mono text-[9px] text-white/40 tracking-[0.3em] uppercase">
                        Secure Connection Active
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 backdrop-blur-md text-center">
                <p className="font-mono text-[9px] text-cyan-400/70 uppercase tracking-[0.2em] font-bold mb-1">Target Specs</p>
                <p className="font-orbitron text-white text-sm font-bold tracking-widest">{tierOrServices || 'Custom Build'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className={label}>Commander ID</p>
                    <input
                        type="text"
                        className={inputCls}
                        placeholder="ALEX J."
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div>
                    <p className={label}>Comms Link</p>
                    <input
                        type="email"
                        className={inputCls}
                        placeholder="alex@corp.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                    { id: '24h', label: '24H TURNAROUND', val: '100%' },
                    { id: 'dep', label: 'NO DEPOSIT', val: 'ACTIVE' },
                    { id: 'str', label: 'STRAT_CALL', val: 'FREE' }
                ].map(s => (
                    <div key={s.id} className="flex flex-col items-center justify-center py-2.5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md">
                        <span className="font-orbitron font-bold text-cyan-300 text-xs mb-0.5">{s.val}</span>
                        <span className="font-mono text-[7px] text-white/40 tracking-widest leading-none">{s.label}</span>
                    </div>
                ))}
            </div>

            <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => { window.dispatchEvent(new CustomEvent('play-explosion-boom')); handleSubmit(); }} 
                disabled={!name || !email} 
                className={nextBtn} 
                title="Transmit Coordinates"
            >
                Transmit Coordinates 🚀
            </motion.button>

            <p className="font-mono text-[9px] text-white/30 text-center uppercase tracking-widest mt-2">
                [ End-to-End Encrypted Transmission ]
            </p>
        </div>
    )
}
