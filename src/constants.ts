// ── Bot / integrations ──
// Token and chat_id are server-side only (api/send-brief.ts)
// Do NOT add VITE_ prefixed bot secrets here
export const TG_BOT_TOKEN  = '';
export const OWNER_CHAT_ID = '';

export const EASYSTAFF_URL =
  'https://invoice.easystaff.io/cust_log?freel_id=1f0b7f2f-e0fe-6ac4-963a-83690f805e19';

export const STYLE_PALETTES = [
  ['#ffffff','#0d0d0d','#818cf8','#1f2937','#0f172a'], // 0: Zebra    — pure white ↔ black
  ['#ffe600','#ff3300','#b45309','#451a03','#270e01'], // 1: Tiger    — pure yellow ↔ deep red-orange
  ['#00ff88','#0077ff','#15803d','#064e3b','#022c22'], // 2: Iguana   — neon green ↔ vivid blue
  ['#00ffcc','#aa00ff','#0f766e','#042f2e','#011311'], // 3: Chameleon — aqua ↔ violet
  ['#00f0ff','#0022ff','#0369a1','#1e3a8a','#0c1a4b'], // 4: Dolphin  — bright cyan ↔ deep blue
  ['#ff99ff','#6600ff','#7e22ce','#3b0764','#1e0434'], // 5: Butterfly — soft pink ↔ electric violet
  ['#ff1155','#ffaa00','#be123c','#4c0519','#2d020a'], // 6: Colibri  — hot coral ↔ gold
  ['#aaff00','#00ffaa','#4d7c0f','#1a2e05','#0d1702'], // 7: Kohlrabi — electric lime ↔ mint
];

export const SPHERE_COLORS = [
  { name: 'Zebra',      hex: '#e5e7eb', glow: 'rgba(229,231,235,0.7)', colors: STYLE_PALETTES[0], sharpness: 0.85 },
  { name: 'Tiger',      hex: '#ffe600', glow: 'rgba(255,230,0,0.7)',   colors: STYLE_PALETTES[1], sharpness: 0.5 },
  { name: 'Iguana',     hex: '#00ff88', glow: 'rgba(0,255,136,0.7)',   colors: STYLE_PALETTES[2], sharpness: 0.4 },
  { name: 'Chameleon',  hex: '#00ffcc', glow: 'rgba(0,255,204,0.7)',   colors: STYLE_PALETTES[3], sharpness: 0.1 },
  { name: 'Dolphin',    hex: '#00f0ff', glow: 'rgba(0,240,255,0.7)',   colors: STYLE_PALETTES[4], sharpness: 0.1 },
  { name: 'Butterfly',  hex: '#cc66ff', glow: 'rgba(204,102,255,0.7)', colors: STYLE_PALETTES[5], sharpness: 0.2 },
  { name: 'Colibri',    hex: '#ff2255', glow: 'rgba(255,34,85,0.7)',   colors: STYLE_PALETTES[6], sharpness: 0.3 },
  { name: 'Kohlrabi',   hex: '#aaff00', glow: 'rgba(170,255,0,0.7)',   colors: STYLE_PALETTES[7], sharpness: 0.4 },
];
