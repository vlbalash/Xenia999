/* ──────── Weapon System: 4 weapons with Web Audio API sounds ──────── */

export interface WeaponDef {
    id: string
    name: string
    icon: string
    key: string         // keyboard shortcut
    damage: number      // score multiplier
    shardCount: number  // number of shards on impact
    shardSpeed: number  // velocity multiplier
    shardSize: number   // size multiplier
    recoilForce: number
    cooldown: number    // ms between shots
    color: string       // primary color
    description: string
    maxAmmo: number     // clip size
    reloadTime: number  // ms to reload
}

export const WEAPONS: WeaponDef[] = [
    {
        id: 'pistol',
        name: 'PLASMA PISTOL',
        icon: '🔫',
        key: '1',
        damage: 1,
        shardCount: 15,
        shardSpeed: 1,
        shardSize: 1,
        recoilForce: 0.8,
        cooldown: 250,
        color: '#00ffff',
        description: 'Standard issue',
        maxAmmo: 12,
        reloadTime: 1200,
    },
    {
        id: 'shotgun',
        name: 'NOVA SHOTGUN',
        icon: '💥',
        key: '2',
        damage: 3,
        shardCount: 40,
        shardSpeed: 2.0,
        shardSize: 1.4,
        recoilForce: 2.5,
        cooldown: 800,
        color: '#ff6600',
        description: 'Spread devastation',
        maxAmmo: 5,
        reloadTime: 2000,
    },
    {
        id: 'laser',
        name: 'ION LASER',
        icon: '⚡',
        key: '3',
        damage: 2,
        shardCount: 8,
        shardSpeed: 0.5,
        shardSize: 0.6,
        recoilForce: 0.3,
        cooldown: 100,
        color: '#00ff44',
        description: 'Rapid fire beam',
        maxAmmo: 25,
        reloadTime: 1500,
    },
    {
        id: 'railgun',
        name: 'DARK RAILGUN',
        icon: '🌌',
        key: '4',
        damage: 5,
        shardCount: 60,
        shardSpeed: 3.0,
        shardSize: 2.0,
        recoilForce: 4.0,
        cooldown: 1500,
        color: '#bf00ff',
        description: 'Maximum impact',
        maxAmmo: 3,
        reloadTime: 3000,
    },
]

/* ──────── Web Audio API Sound Generator ──────── */
let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
    if (!audioCtx) {
        audioCtx = new AudioContext()
    }
    return audioCtx
}

// White noise buffer for explosion sounds
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
    }
    return buffer
}

export function playWeaponSound(weaponId: string, type: 'shoot' | 'empty' | 'reload' = 'shoot'): void {
    const ctx = getAudioCtx()
    const now = ctx.currentTime

    if (type === 'empty') {
        // Dry fire click
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.05)
        return
    }

    if (type === 'reload') {
        // Mechanical slide/charge sound
        const noise = ctx.createBufferSource()
        noise.buffer = createNoiseBuffer(ctx, 0.4)
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(400, now)
        filter.frequency.linearRampToValueAtTime(1200, now + 0.2)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.linearRampToValueAtTime(0.3, now + 0.2)
        gain.gain.linearRampToValueAtTime(0, now + 0.4)
        noise.connect(filter).connect(gain).connect(ctx.destination)
        noise.start(now)
        return
    }

    // Shoot sounds
    switch (weaponId) {
        case 'pistol': {
            // "Solid" Plasma Chirp - sharper, faster
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(2000, now)
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)
            gain.gain.setValueAtTime(0.3, now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
            osc.connect(gain).connect(ctx.destination)
            osc.start(now)
            osc.stop(now + 0.15)

            // High-freq snap
            const snap = ctx.createOscillator()
            const snapGain = ctx.createGain()
            snap.type = 'square'
            snap.frequency.setValueAtTime(4000, now)
            snap.frequency.exponentialRampToValueAtTime(1000, now + 0.05)
            snapGain.gain.setValueAtTime(0.1, now)
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
            snap.connect(snapGain).connect(ctx.destination)
            snap.start(now)
            snap.stop(now + 0.05)
            break
        }
        case 'shotgun': {
            // Heavy Impact - Multiple layers
            const noise = ctx.createBufferSource()
            noise.buffer = createNoiseBuffer(ctx, 0.5)
            const noiseGain = ctx.createGain()
            const filter = ctx.createBiquadFilter()
            filter.type = 'lowpass'
            filter.frequency.setValueAtTime(4000, now)
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.4)
            noiseGain.gain.setValueAtTime(0.8, now)
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
            noise.connect(filter).connect(noiseGain).connect(ctx.destination)
            noise.start(now)

            // Sub-bass Kick
            const kick = ctx.createOscillator()
            const kickGain = ctx.createGain()
            kick.type = 'sine'
            kick.frequency.setValueAtTime(150, now)
            kick.frequency.exponentialRampToValueAtTime(40, now + 0.3)
            kickGain.gain.setValueAtTime(0.8, now)
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
            kick.connect(kickGain).connect(ctx.destination)
            kick.start(now)
            kick.stop(now + 0.3)
            break
        }
        case 'laser': {
            // Pure Energy Beam
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(1500, now)
            // Frequency Modulation for "sci-fi" texture
            const lfo = ctx.createOscillator()
            lfo.type = 'square'
            lfo.frequency.value = 50 // Fast flutter
            const lfoGain = ctx.createGain()
            lfoGain.gain.value = 500
            lfo.connect(lfoGain).connect(osc.frequency)
            lfo.start(now)
            lfo.stop(now + 0.15)

            osc.frequency.linearRampToValueAtTime(800, now + 0.15)
            gain.gain.setValueAtTime(0.15, now)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

            osc.connect(gain).connect(ctx.destination)
            osc.start(now)
            osc.stop(now + 0.15)
            break
        }
        case 'railgun': {
            // Massive Charge & Discharge
            // 1. The Charge (short upscale)
            const charge = ctx.createOscillator()
            const chargeGain = ctx.createGain()
            charge.type = 'sawtooth'
            charge.frequency.setValueAtTime(100, now)
            charge.frequency.exponentialRampToValueAtTime(2000, now + 0.1)
            chargeGain.gain.setValueAtTime(0.1, now)
            chargeGain.gain.linearRampToValueAtTime(0.4, now + 0.1)
            chargeGain.gain.setValueAtTime(0, now + 0.11)
            charge.connect(chargeGain).connect(ctx.destination)
            charge.start(now)
            charge.stop(now + 0.12)

            // 2. The Blast (Delayed slightly)
            const blastTime = now + 0.1
            const blast = ctx.createOscillator()
            const blastGain = ctx.createGain()
            blast.type = 'triangle' // Warmer, fuller than saw
            blast.frequency.setValueAtTime(80, blastTime)
            blast.frequency.exponentialRampToValueAtTime(20, blastTime + 0.8)
            blastGain.gain.setValueAtTime(1.0, blastTime)
            blastGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.8)
            blast.connect(blastGain).connect(ctx.destination)
            blast.start(blastTime)
            blast.stop(blastTime + 0.8)

            // 3. Shockwave Noise
            const shock = ctx.createBufferSource()
            shock.buffer = createNoiseBuffer(ctx, 0.6)
            const shockFilter = ctx.createBiquadFilter()
            shockFilter.type = 'bandpass'
            shockFilter.frequency.setValueAtTime(1000, blastTime)
            shockFilter.frequency.exponentialRampToValueAtTime(100, blastTime + 0.5)
            const shockGain = ctx.createGain()
            shockGain.gain.setValueAtTime(0.5, blastTime)
            shockGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.5)
            shock.connect(shockFilter).connect(shockGain).connect(ctx.destination)
            shock.start(blastTime)
            break
        }
    }
}

/* ──────── Global weapon state ──────── */
let currentWeaponIndex = 0
let lastShotTime = 0
let currentAmmo = [12, 5, 25, 3] // Initialize with max ammo
let isReloading = false

const listeners: Array<(weapon: WeaponDef) => void> = []
const ammoListeners: Array<(ammo: number[]) => void> = []
const reloadListeners: Array<(reloading: boolean) => void> = []

export function getCurrentWeapon(): WeaponDef {
    return WEAPONS[currentWeaponIndex]
}

export function getCurrentAmmo(): number {
    return currentAmmo[currentWeaponIndex]
}

export function getAllAmmo(): number[] {
    return [...currentAmmo]
}

export function isWeaponReloading(): boolean {
    return isReloading
}

export function setWeapon(index: number): void {
    if (index >= 0 && index < WEAPONS.length && !isReloading) {
        currentWeaponIndex = index
        listeners.forEach(fn => fn(WEAPONS[index]))
        ammoListeners.forEach(fn => fn(currentAmmo))
    }
}

export function canShoot(): boolean {
    const now = Date.now()
    const weapon = getCurrentWeapon()
    if (isReloading) return false
    if (currentAmmo[currentWeaponIndex] <= 0) return false
    if (now - lastShotTime < weapon.cooldown) return false
    return true
}

export function shoot(): boolean {
    if (!canShoot()) {
        if (currentAmmo[currentWeaponIndex] <= 0 && !isReloading) {
            reloadWeapon()
        }
        return false
    }

    lastShotTime = Date.now()
    currentAmmo[currentWeaponIndex]--
    ammoListeners.forEach(fn => fn(currentAmmo))

    if (currentAmmo[currentWeaponIndex] <= 0) {
        setTimeout(() => reloadWeapon(), 200)
    }

    return true
}

export function reloadWeapon() {
    if (isReloading) return
    const weapon = getCurrentWeapon()
    if (currentAmmo[currentWeaponIndex] >= weapon.maxAmmo) return

    isReloading = true
    reloadListeners.forEach(fn => fn(true))
    playWeaponSound(weapon.id, 'reload')

    setTimeout(() => {
        currentAmmo[currentWeaponIndex] = weapon.maxAmmo
        isReloading = false
        reloadListeners.forEach(fn => fn(false))
        ammoListeners.forEach(fn => fn(currentAmmo))
    }, weapon.reloadTime)
}

export function onWeaponChange(fn: (weapon: WeaponDef) => void): () => void {
    listeners.push(fn)
    return () => {
        const idx = listeners.indexOf(fn)
        if (idx !== -1) listeners.splice(idx, 1)
    }
}

export function onAmmoChange(fn: (ammo: number[]) => void): () => void {
    ammoListeners.push(fn)
    // Initial call
    fn(currentAmmo)
    return () => {
        const idx = ammoListeners.indexOf(fn)
        if (idx !== -1) ammoListeners.splice(idx, 1)
    }
}

export function onReloadChange(fn: (reloading: boolean) => void): () => void {
    reloadListeners.push(fn)
    return () => {
        const idx = reloadListeners.indexOf(fn)
        if (idx !== -1) reloadListeners.splice(idx, 1)
    }
}
