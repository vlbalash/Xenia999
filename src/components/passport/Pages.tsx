import { useState } from 'react';

// --- Page 1: Identification (Keep as is - Lead Gen) ---
export const PageIdentity = ({ onNext }: { onNext: (data: any) => void }) => {
    const [formData, setFormData] = useState({ name: '', handle: '', type: 'Client' });

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-orbitron font-bold text-cyan-400 mb-8 border-b border-cyan-500/20 pb-4">
                01 // IDENTIFICATION
            </h2>

            <div className="space-y-6 flex-1">
                <div className="space-y-2">
                    <label className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest">Name / Organization</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-black/40 border-b border-white/10 focus:border-cyan-400 text-white font-orbitron p-3 outline-none transition-colors"
                        placeholder="ENTER NAME"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest">Contact (Telegram/Email)</label>
                    <input
                        type="text"
                        value={formData.handle}
                        onChange={e => setFormData({ ...formData, handle: e.target.value })}
                        className="w-full bg-black/40 border-b border-white/10 focus:border-cyan-400 text-white font-orbitron p-3 outline-none transition-colors"
                        placeholder="@HANDLE"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Client', 'Partner', 'Investor', 'Observer'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFormData({ ...formData, type })}
                                className={`p-3 text-xs font-orbitron border rounded-lg transition-all text-left ${formData.type === type ? 'border-cyan-400 bg-cyan-400/10 text-white' : 'border-white/5 text-gray-500 hover:border-white/20'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onNext(formData)}
                disabled={!formData.handle}
                className="w-full py-4 mt-6 bg-cyan-500 text-black font-orbitron font-bold tracking-widest hover:bg-white transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
                INITIALIZE SESSION &gt;&gt;
            </button>
        </div>
    );
};

// --- Page 2: Project Specs (Website Creation) ---
export const PageQuestionnaire = ({ onNext }: { onNext: (data: any) => void }) => {

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-orbitron font-bold text-pink-500 mb-8 border-b border-pink-500/20 pb-4">
                02 // SYSTEM SPECS
            </h2>

            <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">

                <div className="space-y-3">
                    <label className="text-xs font-orbitron text-white">Target Infrastructure (Estimated Market Value)</label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { name: 'Landing Page / Portfolio', price: '$1k - $3k' },
                            { name: 'Corporate / Brand Site', price: '$3k - $7k' },
                            { name: 'E-Commerce / Shop', price: '$7k - $15k' },
                            { name: 'Web3 / dApp Interface', price: '$15k+' }
                        ].map(opt => (
                            <label key={opt.name} className="flex items-center justify-between p-3 bg-white/10 rounded border border-white/10 cursor-pointer hover:border-pink-500/50 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="infra" className="accent-pink-500 w-4 h-4" />
                                    <span className="text-xs font-mono text-white font-bold">{opt.name}</span>
                                </div>
                                <span className="text-[10px] font-orbitron text-pink-400">{opt.price}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-orbitron text-white">Budget Allocation</label>
                    <input type="range" min="1" max="4" step="1" className="w-full accent-pink-500 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] font-mono text-white font-bold px-1">
                        <span>$1k</span><span>$5k</span><span>$10k</span><span>$20k+</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-orbitron text-white">Core Objective & Features</label>
                    <textarea
                        className="w-full bg-white/10 border border-white/20 rounded p-3 text-xs font-mono text-white placeholder-gray-400 focus:border-pink-500 outline-none h-20 resize-none focus:bg-white/15 transition-colors"
                        placeholder="Describe your vision, required features, and goals..."
                    ></textarea>
                </div>
            </div>

            <button
                onClick={() => onNext({})}
                className="w-full py-4 mt-6 border border-pink-500 text-pink-500 font-orbitron font-bold tracking-widest hover:bg-pink-500 hover:text-white transition-all rounded bg-pink-500/5 shadow-[0_0_15px_rgba(236,72,153,0.1)]"
            >
                CONFIRM SPECS &gt;&gt;
            </button>
        </div>
    );
};

// --- Page 3: Visual Aesthetics ---
export const PageClassification = ({ onNext }: { onNext: (data: any) => void }) => {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-orbitron font-bold text-amber-400 mb-8 border-b border-amber-500/20 pb-4">
                03 // VISUAL CORE
            </h2>

            <p className="font-mono text-xs text-gray-400 mb-4">Select desired aesthetic protocol:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {[
                    { title: 'Minimalist Void', desc: 'Clean, spacious, typography-driven.' },
                    { title: 'Cyber-Noir', desc: 'Dark, neon, futuristic, glitch elements.' },
                    { title: 'Corporate Glass', desc: 'Professional, frosted glass, premium feel.' },
                    { title: 'Avant-Garde', desc: 'Experimental, WebGL, breaking conventions.' }
                ].map((item, i) => (
                    <div key={item.title} className="group relative p-4 border border-white/10 rounded-xl hover:border-amber-400/50 cursor-pointer transition-all bg-white/5 hover:bg-amber-400/10">
                        <div className="text-[10px] font-mono text-gray-500 mb-2">STYLE_0{i + 1}</div>
                        <h3 className="font-orbitron font-bold text-white group-hover:text-amber-400 transition-colors">{item.title}</h3>
                        <p className="text-[10px] text-gray-400 mt-2 leading-tight">{item.desc}</p>
                    </div>
                ))}
            </div>

            <button
                onClick={() => onNext({})}
                className="w-full py-4 mt-6 bg-amber-500 text-black font-orbitron font-bold tracking-widest hover:bg-white transition-all rounded shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
                FINALIZE DATA &gt;&gt;
            </button>
        </div>
    );
}

// --- Page 4: Finalization & Payment ---
export const PageFinal = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl md:text-3xl font-orbitron font-black text-white">
                    PROTOCOL<br /><span className="text-cyan-400">READY</span>
                </h2>
                <p className="font-mono text-xs text-gray-500 tracking-widest">SECURE GATEWAY DETECTED</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
                <a
                    href="https://invoice.easystaff.io/cust_log?freel_id=1f0b7f2f-e0fe-6ac4-963a-83690f805e19"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative w-full py-5 bg-cyan-500 text-black font-orbitron font-black text-lg tracking-widest rounded-xl overflow-hidden hover:scale-105 transition-transform shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        INITIATE PAYMENT
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>

                <p className="text-[10px] font-mono text-cyan-500/70 uppercase">
                    Processed via EasyStaff<br />
                    <span className="text-gray-600">Additional protocols loading...</span>
                </p>
            </div>

            <div className="pt-8 border-t border-white/5 w-full">
                <button className="flex items-center justify-center gap-3 text-xs font-mono text-gray-400 hover:text-green-400 transition-colors mx-auto group">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    ENCRYPTED UPLINK
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white ml-2">@genesis_uplink</span>
                </button>
            </div>
        </div>
    );
}
