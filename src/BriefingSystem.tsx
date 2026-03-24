import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SERVICE_PACKAGES, ADD_ONS, DESIGN_LEVELS, TIMELINES,
  ServicePackage, DesignLevel, Timeline,
} from './BriefingData';
import { EASYSTAFF_URL } from './constants';

interface BriefingSystemProps { onClose: () => void; }

// ── Animated counter ──
function useCountUp(target: number, duration = 700) {
  const [n, setN] = useState(target);
  const prev = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    const from = prev.current, diff = target - from, t0 = performance.now();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      setN(Math.round(from + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    });
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return n;
}

// ── Icons ──
const SoundIcon = ({ on }: { on: boolean }) => on ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const LS_KEY = 'xenia_brief_v1';

function formatBriefMessage(p: {
  pkg: ServicePackage | null; design: DesignLevel; timeline: Timeline | null;
  addons: Set<string>; projectName: string; clientTelegram: string;
  clientEmail: string; projectDesc: string; estimate: number;
}) {
  const names = Array.from(p.addons).map(id => ADD_ONS.find(a => a.id === id)?.name).filter(Boolean);
  const clientHandle = p.clientTelegram
    ? (p.clientTelegram.startsWith('@') ? p.clientTelegram : '@' + p.clientTelegram)
    : null;
  const rushTag = (p.timeline?.surcharge ?? 1) > 1
    ? ` ⚡ <b>+${Math.round(((p.timeline?.surcharge ?? 1) - 1) * 100)}% rush</b>`
    : '';
  const lines: (string | null)[] = [
    `╔══════════════════════════╗`,
    `  ✦ <b>XENIA999 — NEW BRIEF</b> ✦`,
    `╚══════════════════════════╝`,
    ``,
    `<b>PROJECT</b>  ${p.projectName ? `<code>${p.projectName}</code>` : '—'}`,
    `<b>PACKAGE</b>  ${p.pkg?.name || '—'}`,
    `           <i>$${(p.pkg?.price ?? 0).toLocaleString('en-US')} base</i>`,
    ``,
    `<b>VISUAL</b>   ${p.design.name}  ×${p.design.multiplier}`,
    `<b>TIMELINE</b> ${p.timeline ? `${p.timeline.label} · ${p.timeline.time}` : '—'}${rushTag}`,
    names.length
      ? `<b>MODULES</b>  ${names.join(' · ')}`
      : null,
    ``,
    `──────────────────────────`,
    `💰 <b>ESTIMATE</b>  $${p.estimate.toLocaleString('en-US')}+`,
    `──────────────────────────`,
    ``,
    clientHandle ? `👤 <b>Telegram:</b> ${clientHandle}` : null,
    p.clientEmail  ? `📧 <b>Email:</b>    ${p.clientEmail}` : null,
    p.projectDesc  ? `\n📝 <b>Brief:</b>\n<i>${p.projectDesc}</i>` : null,
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

function buildBriefKeyboard(p: {
  clientTelegram: string;
}) {
  const buttons: { text: string; url: string }[][] = [];
  if (p.clientTelegram) {
    const handle = p.clientTelegram.startsWith('@') ? p.clientTelegram.slice(1) : p.clientTelegram;
    buttons.push([{ text: '💬 Reply to Client', url: `https://t.me/${handle}` }]);
  }
  buttons.push([{ text: '💼 Create Invoice', url: 'https://invoice.easystaff.io/cust_log?freel_id=1f0b7f2f-e0fe-6ac4-963a-83690f805e19' }]);
  return { inline_keyboard: buttons };
}


function formatBriefPlain(p: Parameters<typeof formatBriefMessage>[0]) {
  const names = Array.from(p.addons).map(id => ADD_ONS.find(a => a.id === id)?.name).filter(Boolean);
  return [
    `PROJECT BRIEF — ${p.projectName || 'Untitled'}`, `──────────────────────────────`,
    `Package:  ${p.pkg?.name || '—'} ($${p.pkg?.price?.toLocaleString('en-US') || 0})`,
    `Visual:   ${p.design.name} ×${p.design.multiplier}`,
    `Timeline: ${p.timeline ? `${p.timeline.label} · ${p.timeline.time}` : '—'}`,
    names.length ? `Modules:  ${names.join(', ')}` : null,
    `Estimate: $${p.estimate.toLocaleString('en-US')}+`, ``,
    p.clientTelegram ? `Telegram: ${p.clientTelegram}` : null,
    p.clientEmail ? `Email:    ${p.clientEmail}` : null,
    p.projectDesc ? `\nDescription:\n${p.projectDesc}` : null,
  ].filter((l): l is string => l !== null).join('\n');
}

async function sendBriefToBot(text: string, replyMarkup?: object): Promise<boolean> {
  try {
    const res = await fetch(`/api/send-brief`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Theme tokens ──
function makeTheme(dark: boolean) {
  return dark ? {
    // backgrounds
    pageBg:        '#020914',
    overlayBg:     'rgba(0,0,0,0.65)',
    sidebarBg:     'rgba(7,17,30,0.88)',
    rightBg:       'rgba(6,15,28,0.80)',
    cardBg:        'rgba(7,17,30,0.85)',
    cardBgHover:   'rgba(9,21,32,0.95)',
    summaryBg:     'rgba(5,16,28,0.90)',
    inputBg:       'rgba(7,17,30,0.95)',
    restoreBg:     'rgba(5,22,35,0.98)',
    topbarBtnBg:   'transparent',
    // borders
    border:        '#0e1e30',
    borderHover:   '#1a3a50',
    borderFocus:   '#2dd4bf',
    // text
    text:          '#e8edf2',
    subText:       '#6b8096',
    mutedText:     '#2e3f50',
    // accents
    teal:          '#2dd4bf',
    indigo:        '#818cf8',
    amber:         '#fbbf24',
    // heading gradient
    headGrad:      'linear-gradient(135deg, #ffffff 0%, #2dd4bf 55%, #818cf8 100%)',
    // ghost step number
    ghostNum:      'rgba(45,212,191,0.04)',
    // divider
    divider:       '#0a1624',
    // dot grid
    dotGrid:       'rgba(45,212,191,0.07)',
    dotGridMask:   'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
    // scrollbar
    scrollThumb:   '#1a3a50',
    // btn
    btnBack:       'bg-[#07111e] hover:bg-[#0c1e2e] text-[#6b8096] border-[#0e1e30]',
    btnPrimary:    'from-[#2dd4bf] to-[#818cf8] text-[#030812]',
    btnCopy:       'bg-[rgba(7,17,30,0.7)] border-[#0e1e30] text-[#6b8096]',
    btnCopyActive: 'border-[#2dd4bf] text-[#2dd4bf]',
    btnEasystaff:  'bg-[rgba(7,17,30,0.5)] border-[#0e1e30] text-[#2e3f50]',
  } : {
    pageBg:        '#f0f4f8',
    overlayBg:     'rgba(240,244,248,0.0)',
    sidebarBg:     'rgba(255,255,255,0.92)',
    rightBg:       'rgba(255,255,255,0.85)',
    cardBg:        'rgba(255,255,255,0.90)',
    cardBgHover:   'rgba(250,253,255,1.0)',
    summaryBg:     'rgba(255,255,255,0.95)',
    inputBg:       'rgba(255,255,255,1.0)',
    restoreBg:     'rgba(255,255,255,0.98)',
    topbarBtnBg:   'transparent',
    border:        '#dde6f0',
    borderHover:   '#93c5d8',
    borderFocus:   '#0d9488',
    text:          '#0a1628',
    subText:       '#4a6070',
    mutedText:     '#94aabf',
    teal:          '#0d9488',
    indigo:        '#4f46e5',
    amber:         '#d97706',
    headGrad:      'linear-gradient(135deg, #0a1628 0%, #0d9488 55%, #4f46e5 100%)',
    ghostNum:      'rgba(13,148,136,0.06)',
    divider:       '#e8f0f7',
    dotGrid:       'rgba(13,148,136,0.06)',
    dotGridMask:   'radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)',
    scrollThumb:   '#c0d4e0',
    btnBack:       'bg-white hover:bg-[#f5f9fc] text-[#4a6070] border-[#dde6f0]',
    btnPrimary:    'from-[#0d9488] to-[#4f46e5] text-white',
    btnCopy:       'bg-white border-[#dde6f0] text-[#4a6070]',
    btnCopyActive: 'border-[#0d9488] text-[#0d9488]',
    btnEasystaff:  'bg-[rgba(255,255,255,0.7)] border-[#dde6f0] text-[#94aabf]',
  };
}

export const BriefingSystem: React.FC<BriefingSystemProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [isDark, setIsDark] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedDesignLevel, setSelectedDesignLevel] = useState<DesignLevel>(DESIGN_LEVELS[0]);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline | null>(null);
  const [projectName, setProjectName] = useState('');
  const [clientTelegram, setClientTelegram] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isAccessibleMode, setIsAccessibleMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasSavedBrief, setHasSavedBrief] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const T = makeTheme(isDark);

  useEffect(() => {
    const h = (e: Event) => setAudioOn((e as CustomEvent).detail.active);
    window.addEventListener('audio-active', h);
    return () => window.removeEventListener('audio-active', h);
  }, []);

  const toggleAudio = () => window.dispatchEvent(new CustomEvent('toggle-neural-audio'));

  useEffect(() => {
    try { if (localStorage.getItem(LS_KEY)) setShowRestore(true); } catch {}
  }, []);

  const restoreBrief = useCallback(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (s.packageId)  { const p = SERVICE_PACKAGES.find(x => x.id === s.packageId); if (p) setSelectedPackage(p); }
      if (s.designId)   { const d = DESIGN_LEVELS.find(x => x.id === s.designId); if (d) setSelectedDesignLevel(d); }
      if (s.addons)     setSelectedAddOns(new Set(s.addons));
      if (s.timelineId) { const tl = TIMELINES.find(x => x.id === s.timelineId); if (tl) setSelectedTimeline(tl); }
      if (s.projectName)    setProjectName(s.projectName);
      if (s.clientTelegram) setClientTelegram(s.clientTelegram);
      if (s.clientEmail)    setClientEmail(s.clientEmail);
      if (s.projectDesc)    setProjectDesc(s.projectDesc);
      if (s.step) { setDir(1); setStep(s.step); }
      setShowRestore(false);
    } catch {}
  }, []);

  const dismissRestore = () => { localStorage.removeItem(LS_KEY); setShowRestore(false); };

  useEffect(() => {
    if (!hasSavedBrief && !selectedPackage) return;
    setHasSavedBrief(true);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        step, packageId: selectedPackage?.id, designId: selectedDesignLevel.id,
        addons: Array.from(selectedAddOns), timelineId: selectedTimeline?.id,
        projectName, clientTelegram, clientEmail, projectDesc,
      }));
    } catch {}
  }, [step, selectedPackage, selectedDesignLevel, selectedAddOns, selectedTimeline, projectName, clientTelegram, clientEmail, projectDesc]);

  const totalPrice = useMemo(() => {
    let base = selectedPackage?.price || 0, addons = 0;
    selectedAddOns.forEach(id => { const a = ADD_ONS.find(x => x.id === id); if (a) addons += a.priceMin; });
    const rush = selectedTimeline?.surcharge ?? 1;
    return Math.round((base + addons) * selectedDesignLevel.multiplier * rush);
  }, [selectedPackage, selectedAddOns, selectedDesignLevel, selectedTimeline]);

  const animatedPrice = useCountUp(totalPrice);
  const briefParams = useMemo(() => ({
    pkg: selectedPackage, design: selectedDesignLevel, timeline: selectedTimeline,
    addons: selectedAddOns, projectName, clientTelegram, clientEmail, projectDesc, estimate: totalPrice,
  }), [selectedPackage, selectedDesignLevel, selectedTimeline, selectedAddOns, projectName, clientTelegram, clientEmail, projectDesc, totalPrice]);

  const telegramUrl = useMemo(() => {
    const parts = [
      `pkg=${selectedPackage?.id || 'none'}`,
      `est=${totalPrice}`,
      projectName ? `name=${encodeURIComponent(projectName).slice(0, 40)}` : null,
    ].filter(Boolean);
    return `https://t.me/XENIA999bot?start=${parts.join('_')}`;
  }, [selectedPackage, totalPrice, projectName]);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const toggleAddOn = (id: string) => {
    const next = new Set(selectedAddOns);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedAddOns(next);
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    setSubmitError(false);
    const keyboard = buildBriefKeyboard({ clientTelegram });
    const ok = await sendBriefToBot(formatBriefMessage(briefParams), keyboard);
    if (ok) {
      try { localStorage.removeItem(LS_KEY); } catch {}
      setSubmitDone(true);
      window.open(telegramUrl, '_blank');
    } else {
      setSubmitError(true);
    }
    setIsSubmitting(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatBriefPlain(briefParams)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const STEP_LABELS = ['Package', 'Visual', 'Modules', 'Timeline', 'Launch'];

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d * 48, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit:   (d: number) => ({ opacity: 0, x: d * -48, scale: 0.97 }),
  };

  // ── Input style ──
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1px solid ${T.border}`, fontSize: 14,
    background: T.inputBg, color: T.text,
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s',
  };

  // ── Orb accent colour per variant ──
  const orbAccent = (v?: string) =>
    v === 'starter'   ? '#34d399' :
    v === 'corporate' ? '#60a5fa' :
    v === 'ecommerce' ? '#e879f9' :
    v === 'premium'   ? (isDark ? '#e5e7eb' : '#d1d5db') :
    v === 'extra'     ? T.amber : T.teal;

  const orbBg = (v?: string, sel = false) => {
    const dark: Record<string, [string, string]> = {
      starter:   ['rgba(4,31,19,0.95)',   'rgba(2,13,7,0.82)'],
      corporate: ['rgba(2,22,48,0.95)',   'rgba(1,11,26,0.82)'],
      ecommerce: ['rgba(30,6,36,0.95)',   'rgba(15,3,19,0.82)'],
      premium:   ['rgba(8,8,8,0.98)',     'rgba(5,5,5,0.88)'],
      extra:     ['rgba(18,8,0,0.98)',    'rgba(10,5,0,0.85)'],
    };
    const light: Record<string, [string, string]> = {
      starter:   ['rgba(236,253,245,1.0)',  'rgba(255,255,255,1.0)'],
      corporate: ['rgba(239,246,255,1.0)',  'rgba(255,255,255,1.0)'],
      ecommerce: ['rgba(253,244,255,1.0)',  'rgba(255,255,255,1.0)'],
      premium:   ['rgba(30,30,30,0.96)',    'rgba(20,20,20,0.90)'],
      extra:     ['rgba(255,251,235,1.0)',  'rgba(255,255,255,1.0)'],
    };
    const map = isDark ? dark : light;
    const pair = map[v || ''] || (isDark ? ['rgba(7,17,30,0.92)','rgba(5,14,25,0.82)'] : ['rgba(255,255,255,1.0)','rgba(255,255,255,1.0)']);
    return pair[sel ? 0 : 1];
  };

  const orbGlow = (v?: string) => {
    const c: Record<string, string> = {
      starter:   'rgba(52,211,153,',
      corporate: 'rgba(96,165,250,',
      ecommerce: 'rgba(232,121,249,',
      premium:   'rgba(220,220,220,',
      extra:     'rgba(251,191,36,',
    };
    const base = c[v || ''] || 'rgba(45,212,191,';
    return `0 0 40px ${base}0.25), 0 0 80px ${base}0.10)`;
  };

  // ── Shared top toolbar items ──
  const TopBtn = ({ onClick, active, children, label }: { onClick: () => void; active?: boolean; children: React.ReactNode; label?: string }) => (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs tracking-widest uppercase transition-all duration-200"
      style={{
        border: `1px solid ${active ? T.teal + '60' : T.border}`,
        color: active ? T.teal : T.subText,
        background: active ? T.teal + '10' : 'transparent',
      }}
    >
      {children}{label && <span className="hidden lg:inline">{label}</span>}
    </button>
  );

  // ── Ghost step number ──
  const GhostNum = ({ n }: { n: string }) => (
    <div className="absolute -top-6 -left-2 text-[110px] font-black leading-none select-none pointer-events-none"
      style={{ color: T.ghostNum, fontFamily: "'Orbitron', sans-serif", zIndex: 0 }}>{n}</div>
  );

  // ── Gradient heading ──
  const GH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <h1 className={`font-black tracking-tight relative z-10 select-none ${className}`}
      style={{ fontFamily: "'Orbitron', sans-serif", background: T.headGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {children}
    </h1>
  );

  // helper — accent color keyed to selected package
  const pkgAccent = selectedPackage?.colorVariant === 'extra' ? T.amber : T.teal;

  return (
    <div
      className="fixed inset-0 z-[100] flex overflow-hidden transition-colors duration-500"
      style={{
        fontFamily: "'Inter', 'Orbitron', sans-serif",
        zoom: isAccessibleMode ? 1.2 : 1,
        color: T.text,
        ['--brief-thumb' as string]: T.scrollThumb,
        ['--brief-muted' as string]: T.mutedText + '88',
      }}
    >
      {/* BG */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundColor: T.pageBg,
        backgroundImage: isDark
          ? "url('/media_f169d67b-65ae-4235-8bb8-bb8e04823e9a_1773962700283.jpg')"
          : 'radial-gradient(ellipse 80% 60% at 15% 8%, rgba(180,215,245,0.9) 0%, transparent 55%), radial-gradient(ellipse 65% 55% at 85% 85%, rgba(195,210,250,0.75) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 55% 45%, rgba(215,230,252,0.5) 0%, transparent 70%)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
      }} />
      <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-500" style={{ background: T.overlayBg, backdropFilter: isDark ? 'blur(3px)' : 'none' }} />

      {/* Dot grid */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500" style={{
        backgroundImage: `radial-gradient(circle, ${T.dotGrid} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        maskImage: T.dotGridMask, WebkitMaskImage: T.dotGridMask,
      }} />

      {/* Restore banner */}
      <AnimatePresence>
        {showRestore && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 py-2.5 px-6"
            style={{ background: T.restoreBg, borderBottom: `1px solid ${T.teal}25` }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.teal }} />
            <span className="text-[11px]" style={{ color: T.subText }}>Unfinished brief saved.</span>
            <button onClick={restoreBrief} className="text-xs font-black px-4 py-1.5 rounded-lg" style={{ background: T.teal, color: isDark ? '#030812' : 'white' }}>Restore</button>
            <button onClick={dismissRestore} className="text-[11px] transition-colors" style={{ color: T.mutedText }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEFT SIDEBAR ── */}
      <div className="relative z-10 hidden lg:flex w-[220px] flex-col p-7 justify-between transition-all duration-500"
        style={{ background: T.sidebarBg, borderRight: `1px solid ${T.border}`, backdropFilter: 'blur(24px)' }}
      >
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: `1px solid ${T.teal}40`, background: `${T.teal}12` }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.teal }} />
            </div>
            <span className="text-[9px] tracking-[0.38em] uppercase font-bold" style={{ color: T.teal }}>XENIA / STUDIO</span>
          </div>

          {/* Steps */}
          <div>
            {STEP_LABELS.map((label, i) => {
              const done = step > i + 1, active = step === i + 1;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={active ? { boxShadow: [`0 0 0px ${T.amber}00`, `0 0 10px ${T.amber}70`, `0 0 0px ${T.amber}00`] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-500"
                      style={{
                        background: done ? T.teal : 'transparent',
                        borderColor: done ? T.teal : active ? T.amber : T.border,
                        color: done ? (isDark ? '#030812' : 'white') : active ? T.amber : T.mutedText,
                      }}
                    >{done ? '✓' : i + 1}</motion.div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className="w-px h-6 my-0.5 transition-colors duration-500" style={{ background: done ? T.teal + '40' : T.border }} />
                    )}
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.22em] pt-1 transition-colors duration-300"
                    style={{ color: active ? T.text : done ? T.teal : T.subText }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected pkg */}
          {selectedPackage && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl transition-colors duration-500"
              style={{ background: isDark ? 'rgba(5,22,35,0.8)' : 'rgba(13,148,136,0.06)', border: `1px solid ${T.teal}25` }}
            >
              <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: T.teal }}>Selected</p>
              <p className="text-[11px] font-bold leading-tight">{selectedPackage.name}</p>
              <p className="text-[10px] mt-1 font-mono" style={{ color: selectedPackage.colorVariant === 'extra' ? T.amber : T.teal }}>from ${selectedPackage.price.toLocaleString('en-US')}</p>
            </motion.div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {/* Theme toggle */}
            <button onClick={() => setIsDark(d => !d)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs transition-all duration-300"
              style={{ border: `1px solid ${T.border}`, color: T.subText, background: isDark ? 'transparent' : `${T.teal}08`,
                       boxShadow: !isDark ? `0 0 12px ${T.teal}15` : 'none' }}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
              <span className="text-[9px] tracking-widest uppercase">{isDark ? 'Dark' : 'Light'}</span>
            </button>
            {/* Accessibility */}
            <button onClick={() => setIsAccessibleMode(p => !p)}
              className="w-11 flex items-center justify-center py-3 rounded-xl border text-xs transition-all duration-200"
              style={{ border: `1px solid ${isAccessibleMode ? T.teal + '60' : T.border}`, color: isAccessibleMode ? T.teal : T.mutedText, background: isAccessibleMode ? T.teal + '10' : 'transparent' }}
              title="Accessibility Mode"
            >👓</button>
            {/* Sound */}
            <button onClick={toggleAudio}
              className="w-11 flex items-center justify-center py-3 rounded-xl border text-xs transition-all duration-200"
              style={{ border: `1px solid ${audioOn ? T.teal + '60' : T.border}`, color: audioOn ? T.teal : T.mutedText, background: audioOn ? T.teal + '10' : 'transparent' }}
            ><SoundIcon on={audioOn} /></button>
          </div>
          {/* Progress */}
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <div key={s} className="h-0.5 flex-1 rounded-full transition-all duration-500"
                style={{ background: step >= s ? T.teal : T.border }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── CENTER ── */}
      <div className="brief-scroll relative z-10 flex-1 flex flex-col p-6 md:p-10 overflow-y-auto transition-colors duration-500">

        {/* Top bar */}
        <div className="absolute top-5 right-5 md:top-6 md:right-6 flex items-center gap-2 z-20">
          <TopBtn onClick={() => setIsDark(d => !d)} active={!isDark}>
            {isDark ? <MoonIcon /> : <SunIcon />}
          </TopBtn>
          <TopBtn onClick={toggleAudio} active={audioOn}>
            <SoundIcon on={audioOn} />
            <span className="hidden lg:inline">{audioOn ? 'Sound On' : 'Sound Off'}</span>
          </TopBtn>
          <button onClick={onClose}
            className="transition-all text-xs tracking-widest uppercase px-5 py-2 rounded-full border"
            style={{ border: `1px solid ${T.border}`, color: T.mutedText }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = T.text; (e.target as HTMLElement).style.borderColor = T.subText; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = T.mutedText; (e.target as HTMLElement).style.borderColor = T.border; }}
          >✕ Exit</button>
        </div>

        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center mt-14 md:mt-4">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25,0.1,0.25,1] }}
                className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10"
              >
                {/* Left: slim step label */}
                <div className="hidden lg:flex flex-col items-center gap-3 pt-1 shrink-0 w-10 select-none">
                  <div className="w-px flex-1 max-h-8" style={{ background: `linear-gradient(180deg, transparent, ${T.teal}40)` }} />
                  <span className="text-[8px] font-black tracking-[0.35em] uppercase"
                    style={{ color: T.teal, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    01 / 05
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.teal }} />
                  <div className="w-px flex-1" style={{ background: `${T.teal}20` }} />
                </div>

                {/* Right: cards fill everything */}
                <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-3 select-none">
                  <p className="text-[9px] tracking-[0.42em] font-black uppercase" style={{ color: T.teal }}>Select Package</p>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${T.teal}30, transparent)` }} />
                  <p className="text-[8px] tracking-widest" style={{ color: T.mutedText }}>Step 01 / 05</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_PACKAGES.map((pkg, idx) => { // idx used for badge number
                    const sel = selectedPackage?.id === pkg.id;
                    const isExtra = pkg.colorVariant === 'extra';
                    const isPremium = pkg.colorVariant === 'premium';
                    const ac = orbAccent(pkg.colorVariant);
                    // high-contrast text for each variant
                    const descColor = isPremium
                      ? 'rgba(255,255,255,0.75)'
                      : isExtra
                        ? (isDark ? 'rgba(255,225,150,0.82)' : '#78350f')
                        : (isDark ? 'rgba(200,218,230,0.85)' : '#334155');
                    const featureColor = isPremium
                      ? 'rgba(255,255,255,0.80)'
                      : isExtra
                        ? (isDark ? 'rgba(255,225,150,0.88)' : '#78350f')
                        : (isDark ? 'rgba(210,225,238,0.90)' : '#1e293b');

                    return (
                      <motion.div key={pkg.id}
                        whileHover={{ scale: 1.015, transition: { duration: 0.18 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedPackage(pkg); go(2); }}
                        className={`cursor-pointer rounded-3xl relative overflow-hidden select-none flex flex-col
                          ${isExtra ? 'sm:col-span-2' : ''}`}
                        style={{
                          background: orbBg(pkg.colorVariant, sel),
                          border: `1px solid ${sel ? ac + 'aa' : ac + '22'}`,
                          boxShadow: sel
                            ? orbGlow(pkg.colorVariant)
                            : isDark
                              ? `inset 0 1px 0 ${ac}10`
                              : '0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
                          padding: isExtra ? '22px 24px' : '18px 20px 16px',
                          transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
                        }}
                      >
                        {/* Corner radial accent */}
                        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
                          style={{ background: `radial-gradient(circle, ${ac}14 0%, transparent 70%)` }} />

                        {/* Selected wash */}
                        {sel && (
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 85% 15%, ${ac}0a 0%, transparent 60%)` }} />
                        )}

                        {/* Extra aurora pulse */}
                        {isExtra && (
                          <motion.div className="absolute inset-0 pointer-events-none rounded-3xl"
                            animate={{ opacity: [0.04, 0.11, 0.04] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(251,113,133,0.08) 50%, rgba(167,139,250,0.12) 100%)' }}
                          />
                        )}

                        {/* Top shimmer line */}
                        <div className="absolute top-0 left-12 right-12 h-px pointer-events-none"
                          style={{ background: `linear-gradient(90deg, transparent, ${ac}${sel ? '50' : '18'}, transparent)` }} />

                        {/* Bottom accent strip */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none transition-all duration-300"
                          style={{ background: sel
                            ? `linear-gradient(90deg, transparent 0%, ${ac}80 25%, ${ac}80 75%, transparent 100%)`
                            : `linear-gradient(90deg, transparent 0%, ${ac}18 50%, transparent 100%)` }} />

                        {/* Decorative icon — Elite: diamond */}
                        {isPremium && (
                          <div className="absolute top-3 right-3 pointer-events-none">
                            {/* Sparkle dots */}
                            {[
                              { x: -18, y: -6,  d: 2.2, delay: 0    },
                              { x:  14, y: -14, d: 1.6, delay: 0.45 },
                              { x:  22, y:  8,  d: 1.8, delay: 0.9  },
                              { x: -10, y:  20, d: 1.4, delay: 1.35 },
                              { x:  6,  y:  26, d: 1.2, delay: 1.8  },
                            ].map((s, i) => (
                              <motion.div key={i}
                                className="absolute rounded-full"
                                style={{ width: s.d * 2, height: s.d * 2, left: 20 + s.x, top: 20 + s.y, background: 'white' }}
                                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }}
                                transition={{ duration: 1.8, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
                              />
                            ))}
                            {/* Diamond gem */}
                            <motion.div
                              animate={{ scale: [1, 1.07, 1] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.7)) drop-shadow(0 0 20px rgba(200,220,255,0.4))' }}
                            >
                              <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                                {/* Facets */}
                                <path d="M6 3h12l4 6-10 13L2 9Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.90)" strokeWidth="0.7" strokeLinejoin="round"/>
                                <path d="M2 9h20" stroke="rgba(255,255,255,0.60)" strokeWidth="0.6"/>
                                <path d="M6 3L2 9l10 13" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
                                <path d="M18 3l4 6-10 13" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
                                <path d="M6 3l6 6-4 13" stroke="rgba(255,255,255,0.25)" strokeWidth="0.45"/>
                                <path d="M18 3l-6 6 4 13" stroke="rgba(255,255,255,0.25)" strokeWidth="0.45"/>
                                <path d="M6 3l6 6h0L18 3" stroke="rgba(255,255,255,0.50)" strokeWidth="0.5"/>
                                {/* Centre shine */}
                                <ellipse cx="12" cy="8" rx="2" ry="1.2" fill="rgba(255,255,255,0.55)" />
                              </svg>
                            </motion.div>
                          </div>
                        )}

                        {/* Decorative icon — Extra: sparkling crown */}
                        {isExtra && (
                          <div className="absolute top-3 right-4 pointer-events-none">
                            {/* Sparkle stars */}
                            {[
                              { x: -22, y:  2,  size: 10, delay: 0    },
                              { x:  14, y: -10, size:  8, delay: 0.55 },
                              { x:  28, y:  12, size:  7, delay: 1.1  },
                              { x: -8,  y:  28, size:  6, delay: 1.65 },
                              { x:  18, y:  30, size:  9, delay: 0.3  },
                            ].map((s, i) => (
                              <motion.svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10"
                                className="absolute"
                                style={{ left: 20 + s.x, top: 18 + s.y }}
                                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4], rotate: [0, 45, 90] }}
                                transition={{ duration: 2.2, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
                              >
                                <path d="M5 0L5.8 4.2 10 5 5.8 5.8 5 10 4.2 5.8 0 5 4.2 4.2Z" fill={ac}/>
                              </motion.svg>
                            ))}
                            {/* Crown */}
                            <motion.div
                              animate={{ scale: [1, 1.06, 1], y: [0, -2, 0] }}
                              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ filter: `drop-shadow(0 0 10px ${ac}cc) drop-shadow(0 0 24px ${ac}66)` }}
                            >
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                                <path d="M2 7l4 5 6-8 6 8 4-5-2 10H4Z"
                                  fill={ac + 'cc'} stroke={ac} strokeWidth="0.8" strokeLinejoin="round"/>
                                <path d="M4 17h16" stroke={ac} strokeWidth="1.2" strokeLinecap="round"/>
                                {/* Jewel dots on crown tips */}
                                <circle cx="12" cy="4"  r="1.1" fill="white" opacity="0.9"/>
                                <circle cx="6"  cy="12" r="0.9" fill="white" opacity="0.75"/>
                                <circle cx="18" cy="12" r="0.9" fill="white" opacity="0.75"/>
                              </svg>
                            </motion.div>
                          </div>
                        )}

                        {/* Selected check */}
                        {sel && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                            className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ background: ac, color: '#030812', boxShadow: `0 0 14px ${ac}55` }}
                          >✓</motion.div>
                        )}

                        {/* ── Card content ── */}
                        <div className={`relative z-10 ${isExtra ? 'sm:flex sm:gap-8 sm:items-start' : 'h-full flex flex-col'}`}>
                          <div className={isExtra ? 'sm:flex-[0_0_36%]' : 'flex flex-col flex-1'}>

                            {/* Header row: badge + index */}
                            <div className="flex items-center gap-2 mb-2">
                              {(pkg.badgeText || pkg.recommended) && (
                                <span className="text-[7px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest leading-none"
                                  style={{
                                    background: isPremium
                                      ? 'rgba(255,255,255,0.92)'
                                      : isExtra ? ac : `${ac}1e`,
                                    color: (isPremium || isExtra) ? '#030812' : ac,
                                    border: `1px solid ${(isPremium || isExtra) ? 'transparent' : ac + '38'}`,
                                  }}>
                                  {pkg.badgeText || 'TOP CHOICE'}
                                </span>
                              )}
                              <span className="text-[8px] font-black opacity-20 tabular-nums"
                                style={{ color: ac, fontFamily: "'Orbitron', sans-serif" }}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            </div>

                            {/* Name */}
                            <h3 className="font-black leading-snug mb-2"
                              style={{
                                fontSize: 15,
                                letterSpacing: '0.03em',
                                color: ac,
                                fontFamily: "'Orbitron', sans-serif",
                                textShadow: sel ? `0 0 28px ${ac}50` : 'none',
                              }}>
                              {pkg.name}
                            </h3>

                            {/* Description */}
                            <p className="text-xs leading-relaxed mb-4" style={{ color: descColor }}>
                              {pkg.description}
                            </p>

                            {/* Feature list — regular cards only */}
                            {!isExtra && (
                              <div className="space-y-2 mb-4">
                                {pkg.features.slice(0, 4).map((f, i) => (
                                  <div key={i} className="flex items-start gap-2.5">
                                    <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                      <circle cx="6.5" cy="6.5" r="6" stroke={ac} strokeOpacity="0.4" strokeWidth="1"/>
                                      <circle cx="6.5" cy="6.5" r="2.5" fill={ac} fillOpacity="0.85"/>
                                    </svg>
                                    <span className="text-[11px] leading-snug font-medium" style={{ color: featureColor }}>
                                      {f}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mt-auto">
                              <span className="text-[11px] font-bold" style={{ color: ac, opacity: 0.65 }}>from</span>
                              <span
                                className="font-black leading-none"
                                style={{
                                  fontSize: 22,
                                  fontFamily: "'Orbitron', sans-serif",
                                  color: ac,
                                  textShadow: sel ? `0 0 24px ${ac}55` : 'none',
                                }}
                              >
                                ${pkg.price.toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>

                          {/* Extra right col: full feature grid */}
                          {isExtra && (
                            <div
                              className="sm:flex-1 mt-5 sm:mt-0 pt-5 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-8"
                              style={{ borderColor: `${ac}18` }}
                            >
                              <p className="text-[9px] uppercase tracking-[0.4em] mb-3 font-black" style={{ color: `${ac}80` }}>
                                Full scope
                              </p>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                                {pkg.features.map((f, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <svg className="flex-shrink-0 mt-1" width="11" height="11" viewBox="0 0 13 13" fill="none">
                                      <circle cx="6.5" cy="6.5" r="6" stroke={ac} strokeOpacity="0.4" strokeWidth="1"/>
                                      <circle cx="6.5" cy="6.5" r="2.5" fill={ac} fillOpacity="0.85"/>
                                    </svg>
                                    <span className="text-[11px] leading-snug font-medium" style={{ color: featureColor }}>{f}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                </div>{/* /right cards */}
              </motion.div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25,0.1,0.25,1] }} className="space-y-6"
              >
                <div className="relative">
                  <GhostNum n="02" />
                  <p className="text-[9px] tracking-[0.45em] font-bold uppercase mb-2 relative z-10 select-none" style={{ color: T.teal }}>Step 02 / 05</p>
                  <GH className="text-3xl md:text-4xl mb-2">Visual Execution</GH>
                  <p className="text-sm relative z-10" style={{ color: isDark ? 'rgba(210,225,238,0.82)' : '#334155' }}>Define the aesthetic density and technological depth.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DESIGN_LEVELS.map((level, idx) => {
                    const sel = selectedDesignLevel.id === level.id;
                    return (
                      <motion.div key={level.id}
                        whileHover={{ scale: 1.025, y: -3, transition: { duration: 0.18 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedDesignLevel(level); go(3); }}
                        className="cursor-pointer p-6 rounded-3xl border relative overflow-hidden select-none flex flex-col"
                        style={{
                          background: sel
                            ? (isDark ? 'rgba(4,28,38,0.96)' : 'rgba(13,148,136,0.07)')
                            : T.cardBg,
                          borderColor: sel ? T.teal + 'aa' : T.border,
                          boxShadow: sel
                            ? `0 0 36px ${T.teal}18, inset 0 1px 0 ${T.teal}20`
                            : `inset 0 1px 0 ${T.border}`,
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {sel && (
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 60% 0%, ${T.teal}08 0%, transparent 65%)` }} />
                        )}
                        <div className="absolute top-0 left-10 right-10 h-px pointer-events-none"
                          style={{ background: `linear-gradient(90deg, transparent, ${T.teal}${sel ? '45' : '15'}, transparent)` }} />

                        {/* Multiplier badge top-right */}
                        <div className="absolute top-4 right-4">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                            style={{
                              background: sel ? T.teal + '1e' : 'transparent',
                              color: sel ? T.teal : T.mutedText,
                              border: `1px solid ${sel ? T.teal + '40' : T.border}`,
                              fontFamily: "'Orbitron', sans-serif",
                            }}>
                            ×{level.multiplier}
                          </span>
                        </div>

                        {/* Density bars */}
                        <div className="flex gap-1.5 mb-5 relative z-10">
                          {[1, 2, 3].map(b => (
                            <motion.div key={b}
                              animate={sel && b <= idx + 1 ? { opacity: [0.7, 1, 0.7] } : {}}
                              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: b * 0.25 }}
                              className="h-[7px] flex-1 rounded-full transition-all duration-500"
                              style={{
                                background: b <= idx + 1
                                  ? (sel
                                    ? `linear-gradient(90deg, ${T.teal}, ${T.teal}80)`
                                    : T.teal + '50')
                                  : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'),
                              }} />
                          ))}
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col">
                          <h3 className="text-sm font-black tracking-widest uppercase mb-2"
                            style={{ color: sel ? T.teal : T.text }}>
                            {level.name}
                          </h3>
                          <p className="text-xs leading-relaxed mb-4 flex-1"
                            style={{ color: isDark ? 'rgba(210,225,238,0.80)' : '#334155' }}>
                            {level.description}
                          </p>
                          <div className="text-[10px] font-black uppercase tracking-wider"
                            style={{ color: sel ? T.indigo : (isDark ? 'rgba(180,200,220,0.55)' : '#64748b') }}>
                            {level.multiplier === 1 ? 'Base price' : `+${Math.round((level.multiplier - 1) * 100)}% aesthetic load`}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <button onClick={() => go(1)} className={`px-8 py-3.5 rounded-xl text-xs tracking-widest border transition-all ${T.btnBack}`}>← Back</button>
              </motion.div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25,0.1,0.25,1] }} className="space-y-6"
              >
                <div className="relative">
                  <GhostNum n="03" />
                  <p className="text-[9px] tracking-[0.45em] font-bold uppercase mb-2 relative z-10 select-none" style={{ color: T.teal }}>Step 03 / 05</p>
                  <GH className="text-3xl md:text-4xl mb-2">Neural Modules</GH>
                  <p className="text-sm relative z-10" style={{ color: isDark ? 'rgba(210,225,238,0.82)' : '#334155' }}>Optional AI tools and autonomous agents.</p>
                </div>
                <div className="brief-scroll grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[52vh] overflow-y-auto pr-2">
                  {ADD_ONS.map(addon => {
                    const sel = selectedAddOns.has(addon.id);
                    return (
                      <motion.div key={addon.id}
                        whileHover={{ scale: 1.012, y: -1, transition: { duration: 0.15 } }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => toggleAddOn(addon.id)}
                        className="cursor-pointer rounded-2xl border relative overflow-hidden select-none"
                        style={{
                          background: sel
                            ? (isDark ? 'rgba(12,10,38,0.96)' : 'rgba(79,70,229,0.06)')
                            : T.cardBg,
                          borderColor: sel ? T.indigo + 'aa' : T.border,
                          boxShadow: sel
                            ? `0 0 20px ${T.indigo}18, inset 0 0 0 1px ${T.indigo}18`
                            : `inset 0 1px 0 ${T.border}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Left accent bar */}
                        <motion.div
                          initial={false}
                          animate={{ scaleY: sel ? 1 : 0, opacity: sel ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 top-0 bottom-0 w-[3px] origin-top rounded-l-2xl"
                          style={{ background: `linear-gradient(180deg, ${T.indigo}, ${T.indigo}50)` }}
                        />
                        <div className="p-4 pl-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black mb-1 leading-tight"
                                style={{ color: sel ? T.indigo : T.text }}>
                                {addon.name}
                              </h4>
                              <p className="text-xs leading-relaxed"
                                style={{ color: isDark ? 'rgba(210,225,238,0.78)' : '#334155' }}>
                                {addon.description}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                              {/* Toggle circle */}
                              <motion.div
                                animate={{ scale: sel ? 1.08 : 1, rotate: sel ? 0 : 45 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                                style={{
                                  background: sel ? T.indigo : 'transparent',
                                  border: `1.5px solid ${sel ? T.indigo : T.border}`,
                                  color: sel ? 'white' : T.mutedText,
                                  boxShadow: sel ? `0 0 12px ${T.indigo}45` : 'none',
                                  transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                                }}
                              >{sel ? '✓' : '+'}</motion.div>
                              {/* Price range */}
                              <span className="text-[8px] font-mono font-bold whitespace-nowrap"
                                style={{ color: sel ? T.indigo : T.mutedText }}>
                                ${addon.priceMin.toLocaleString('en-US')}–${addon.priceMax.toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => go(2)} className={`px-8 py-3.5 rounded-xl text-xs tracking-widest border transition-all ${T.btnBack}`}>← Back</button>
                  <button onClick={() => go(4)} className={`px-12 py-3.5 rounded-xl text-xs tracking-widest font-black transition-all hover:opacity-90 bg-gradient-to-r ${T.btnPrimary}`}>Continue →</button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4 ── */}
            {step === 4 && (
              <motion.div key="s4" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.25,0.1,0.25,1] }} className="space-y-6"
              >
                <div className="relative">
                  <GhostNum n="04" />
                  <p className="text-[9px] tracking-[0.45em] font-bold uppercase mb-2 relative z-10 select-none" style={{ color: T.teal }}>Step 04 / 05</p>
                  <GH className="text-3xl md:text-4xl mb-2">Strategic Timeline</GH>
                  <p className="text-sm relative z-10" style={{ color: isDark ? 'rgba(210,225,238,0.82)' : '#334155' }}>Choose delivery pace and production intensity.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {TIMELINES.map((item, idx) => {
                    const sel = selectedTimeline?.id === item.id;
                    const urgencyColor = [T.teal, T.amber, '#f87171'][idx];
                    return (
                      <motion.div key={item.id}
                        whileHover={{ scale: 1.025, y: -3, transition: { duration: 0.18 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedTimeline(item); go(5); }}
                        className="p-6 rounded-3xl cursor-pointer relative overflow-hidden select-none border flex flex-col"
                        style={{
                          background: sel
                            ? (isDark ? 'rgba(4,22,32,0.96)' : 'rgba(13,148,136,0.07)')
                            : T.cardBg,
                          borderColor: sel ? urgencyColor + 'aa' : T.border,
                          boxShadow: sel
                            ? `0 0 36px ${urgencyColor}1a, inset 0 1px 0 ${urgencyColor}20`
                            : `inset 0 1px 0 ${T.border}`,
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {/* Top edge glow */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl pointer-events-none transition-all duration-300"
                          style={{ background: sel
                            ? `linear-gradient(90deg, transparent, ${urgencyColor}cc, ${urgencyColor}cc, transparent)`
                            : `linear-gradient(90deg, transparent, ${urgencyColor}28, transparent)` }} />

                        {/* BG wash when selected */}
                        {sel && (
                          <div className="absolute inset-0 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 50% 0%, ${urgencyColor}0a 0%, transparent 65%)` }} />
                        )}

                        {/* Speed bars */}
                        <div className="flex gap-1.5 mb-5 relative z-10">
                          {[1, 2, 3].map(b => (
                            <div key={b} className="h-[6px] flex-1 rounded-full transition-all duration-400"
                              style={{
                                background: b <= idx + 1
                                  ? urgencyColor + (sel ? 'cc' : '50')
                                  : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'),
                              }} />
                          ))}
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col">
                          {/* Urgency badge */}
                          <div className="mb-3 flex items-center gap-2 flex-wrap">
                            <span className="text-[7px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest"
                              style={{
                                background: urgencyColor + '1e',
                                color: urgencyColor,
                                border: `1px solid ${urgencyColor}38`,
                              }}>
                              {item.urgencyTag}
                            </span>
                            {item.surcharge > 1 && (
                              <span className="text-[7px] px-2 py-1 rounded-full font-black uppercase tracking-widest"
                                style={{
                                  background: urgencyColor + '12',
                                  color: urgencyColor,
                                  border: `1px solid ${urgencyColor}30`,
                                }}>
                                +{Math.round((item.surcharge - 1) * 100)}% rush
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] tracking-[0.28em] font-black uppercase mb-1.5"
                            style={{ color: isDark ? 'rgba(200,218,232,0.70)' : '#475569' }}>{item.label}</p>

                          <h3 className="font-black mb-3 leading-none flex-1"
                            style={{
                              fontSize: 28,
                              fontFamily: "'Orbitron', sans-serif",
                              color: sel ? urgencyColor : T.text,
                              textShadow: sel ? `0 0 28px ${urgencyColor}45` : 'none',
                            }}>
                            {item.time}
                          </h3>

                          <p className="text-xs leading-relaxed font-medium"
                            style={{ color: isDark ? 'rgba(210,225,238,0.80)' : '#334155' }}>{item.note}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <button onClick={() => go(3)} className={`px-8 py-3.5 rounded-xl text-xs tracking-widest border transition-all ${T.btnBack}`}>← Back</button>
              </motion.div>
            )}

            {/* ── STEP 5 ── */}
            {step === 5 && (
              <motion.div key="s5" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.4, ease: [0.25,0.1,0.25,1] }} className="space-y-6 py-2"
              >
                <div className="text-center">
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                    style={{ border: `1px solid ${T.teal}`, background: T.teal + '12', boxShadow: `0 0 32px ${T.teal}30` }}
                  >
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: T.teal }} />
                  </motion.div>
                  <p className="text-[9px] tracking-[0.45em] font-bold uppercase mb-2 select-none" style={{ color: T.teal }}>Configuration Complete</p>
                  <GH className="text-3xl md:text-4xl mb-2">Ready to Launch</GH>
                  <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: isDark ? 'rgba(210,225,238,0.82)' : '#334155' }}>Fill in contact details — your brief lands directly in Telegram.</p>
                </div>

                {/* Summary */}
                <div className="rounded-2xl p-5 space-y-4 backdrop-blur-2xl transition-all duration-500"
                  style={{ background: T.summaryBg, border: `1px solid ${T.teal}25`, boxShadow: `0 0 40px ${T.teal}08` }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Package', value: selectedPackage?.name || '—', color: T.teal },
                      { label: 'Visual', value: selectedDesignLevel.name, color: T.indigo },
                      { label: 'Timeline', value: selectedTimeline?.time || '—', color: T.amber },
                      { label: 'Modules', value: selectedAddOns.size > 0 ? `${selectedAddOns.size} added` : 'None', color: T.subText },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p className="text-[10px] uppercase tracking-[0.25em] mb-1 font-bold" style={{ color }}>{label}</p>
                        <p className="text-sm font-black leading-tight">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedAddOns.size > 0 && (
                    <div className="pt-3" style={{ borderTop: `1px solid ${T.divider}` }}>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(selectedAddOns).map(id => {
                          const a = ADD_ONS.find(x => x.id === id);
                          return <span key={id} className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: T.indigo + '18', color: T.indigo, border: `1px solid ${T.indigo}30` }}>{a?.name}</span>;
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex items-end justify-between pt-3" style={{ borderTop: `1px solid ${T.divider}` }}>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] mb-1 font-bold" style={{ color: T.mutedText }}>Estimated Total</p>
                      <div className="text-4xl font-black tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", color: pkgAccent }}>
                        ${animatedPrice.toLocaleString('en-US')}
                      </div>
                      <p className="text-[9px] mt-0.5" style={{ color: T.mutedText }}>*subject to final discovery</p>
                    </div>
                    <button onClick={() => go(4)} className={`px-6 py-3 rounded-xl text-xs tracking-widest border transition-all ${T.btnBack}`}>← Edit</button>
                  </div>
                </div>

                {/* Contact fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Project Name', value: projectName, setter: setProjectName, placeholder: 'Aurora Fashion Store', type: 'text' },
                    { label: 'Your Telegram', value: clientTelegram, setter: setClientTelegram, placeholder: '@username', type: 'text' },
                    { label: 'Email (optional)', value: clientEmail, setter: setClientEmail, placeholder: 'you@company.com', type: 'email' },
                  ].map(({ label, value, setter, placeholder, type }) => (
                    <div key={label}>
                      <label className="block text-[10px] uppercase tracking-[0.25em] mb-1.5 font-bold" style={{ color: T.subText }}>{label}</label>
                      <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                        className="brief-input"
                        style={{ ...inputStyle }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = T.borderFocus}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = T.border}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-[8px] uppercase tracking-[0.35em] mb-1.5" style={{ color: T.mutedText }}>Project Description (optional)</label>
                    <textarea value={projectDesc} onChange={e => setProjectDesc(e.target.value)}
                      placeholder="Briefly describe your project goals and requirements..."
                      className="brief-input brief-scroll"
                      rows={3} style={{ ...inputStyle, resize: 'none' }}
                      onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = T.borderFocus}
                      onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = T.border}
                    />
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleLaunch} disabled={isSubmitting}
                      className={`flex-1 py-4 font-black text-sm tracking-[0.12em] rounded-2xl disabled:opacity-60 transition-all bg-gradient-to-r ${submitDone ? '' : T.btnPrimary}`}
                      style={submitDone ? { background: T.cardBg, color: T.teal, border: `1px solid ${T.teal}40` } : { boxShadow: `0 8px 40px ${T.teal}28` }}
                    >
                      {isSubmitting ? 'Sending…' : submitDone ? '✓ Brief Sent — Open Telegram' : 'Launch via Telegram →'}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleCopy}
                      className={`px-6 py-4 rounded-2xl text-[11px] font-bold tracking-widest uppercase transition-all border ${copied ? T.btnCopyActive : T.btnCopy}`}
                    >
                      {copied ? '✓ Copied' : 'Copy Brief'}
                    </motion.button>
                  </div>
                  <motion.a whileHover={{ scale: 1.005 }}
                    href={EASYSTAFF_URL} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-[11px] font-bold tracking-widest uppercase transition-all border ${T.btnEasystaff}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                    Pay / Invoice via EasyStaff
                    <span className="text-[9px] opacity-40">↗</span>
                  </motion.a>
                  {submitDone && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl px-4 py-3 text-center"
                      style={{ background: T.teal + '10', border: `1px solid ${T.teal}30` }}
                    >
                      <p className="text-xs font-bold" style={{ color: T.teal }}>✓ Brief delivered to XENIA999</p>
                      {clientTelegram && (
                        <p className="text-[10px] mt-0.5" style={{ color: T.subText }}>Confirmation sent to {clientTelegram.startsWith('@') ? clientTelegram : '@' + clientTelegram}</p>
                      )}
                    </motion.div>
                  )}
                  {submitError && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl px-4 py-3 text-center"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      <p className="text-xs font-bold text-red-400">Failed to send — try Copy Brief and send manually</p>
                      <p className="text-[10px] mt-0.5" style={{ color: T.subText }}>or contact <a href="https://t.me/XXXENIA999" className="underline">@XXXENIA999</a> directly</p>
                    </motion.div>
                  )}
                  <p className="text-center text-[9px]" style={{ color: T.mutedText }}>@XENIA999bot · response within 24h · xxxenia999.tech</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative z-10 hidden xl:flex w-[210px] flex-col p-7 transition-all duration-500"
        style={{ background: T.rightBg, borderLeft: `1px solid ${T.border}`, backdropFilter: 'blur(24px)' }}
      >
        <h3 className="text-[9px] tracking-[0.35em] uppercase font-bold mb-6" style={{ color: T.mutedText }}>Live Quote</h3>
        <div className="brief-scroll flex-1 space-y-4 overflow-y-auto pr-0.5">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: T.teal }}>Package</p>
            <p className="text-xs font-bold leading-tight">{selectedPackage?.name || '—'}</p>
            <p className="text-sm font-black mt-1">{selectedPackage ? `$${selectedPackage.price.toLocaleString('en-US')}` : '—'}</p>
          </div>
          <div className="pt-3" style={{ borderTop: `1px solid ${T.divider}` }}>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: T.indigo }}>Design</p>
            <p className="text-xs font-bold uppercase">{selectedDesignLevel.name}</p>
            <p className="text-[10px]" style={{ color: T.mutedText }}>×{selectedDesignLevel.multiplier}</p>
          </div>
          {selectedTimeline && (
            <div className="pt-3" style={{ borderTop: `1px solid ${T.divider}` }}>
              <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: T.amber }}>Timeline</p>
              <p className="text-xs font-bold">{selectedTimeline.time}</p>
            </div>
          )}
          {selectedPackage?.features && (
            <div className="space-y-1.5 pt-3" style={{ borderTop: `1px solid ${T.divider}` }}>
              <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: T.mutedText }}>Includes</p>
              <ul className="space-y-1">
                {selectedPackage.features.slice(0, 5).map((f, i) => (
                  <li key={i} className="text-[10px] pl-2 leading-relaxed"
                    style={{ borderLeft: `2px solid ${selectedPackage.colorVariant === 'extra' ? T.amber + '50' : T.border}`, color: isDark ? 'rgba(210,225,238,0.80)' : '#334155' }}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {selectedAddOns.size > 0 && (
            <div className="space-y-1.5 pt-3" style={{ borderTop: `1px solid ${T.divider}` }}>
              <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: T.amber }}>Modules ({selectedAddOns.size})</p>
              {Array.from(selectedAddOns).map(id => {
                const a = ADD_ONS.find(x => x.id === id);
                return (
                  <div key={id} className="flex justify-between text-[10px]">
                    <span style={{ color: isDark ? 'rgba(210,225,238,0.80)' : '#334155' }}>{a?.name}</span>
                    <span className="font-bold" style={{ color: T.text }}>${a?.priceMin}+</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="pt-5" style={{ borderTop: `1px solid ${T.border}` }}>
          <p className="text-[9px] tracking-widest uppercase font-bold mb-1" style={{ color: T.mutedText }}>Total Est.</p>
          <div className="text-2xl font-black leading-none" style={{ fontFamily: "'Orbitron', sans-serif", color: pkgAccent }}>
            ${animatedPrice.toLocaleString('en-US')}
          </div>
          <p className="text-[8px] font-mono mt-1.5 leading-tight" style={{ color: T.mutedText }}>*final quote after discovery</p>
        </div>
      </div>
    </div>
  );
};
