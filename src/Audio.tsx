import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Audio System - Integrated Suno Track & Procedural FX
 */
export default function Audio() {
    const [isStarted, setIsStarted] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const masterGainRef = useRef<GainNode | null>(null)
    const pannerRef = useRef<StereoPannerNode | null>(null)
    const mixFilterRef = useRef<BiquadFilterNode | null>(null)
    const sunoAudioRef = useRef<HTMLAudioElement | null>(null)
    const sunoSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)
    const rafIdRef = useRef<number | null>(null)
    const bassSampleRef = useRef<AudioBuffer | null>(null)

    const toggleMute = () => {
        if (!masterGainRef.current || !audioCtxRef.current) return
        const goingMute = !isMuted
        masterGainRef.current.gain.exponentialRampToValueAtTime(
            goingMute ? 0.001 : 0.6,
            audioCtxRef.current.currentTime + 0.5
        )
        // Only control HTML5 volume if NOT routed through Web Audio
        if (sunoAudioRef.current && !sunoSourceRef.current) {
            sunoAudioRef.current.volume = goingMute ? 0 : 1.0
        }
        setIsMuted(goingMute)
        window.dispatchEvent(new CustomEvent('audio-active', { detail: { active: !goingMute } }))
    }

    // Listen for external trigger from LeftTabPanel's audio button
    useEffect(() => {
        const onReqStart = () => startAudio()
        const onReqMute = () => toggleMute()
        window.addEventListener('request-audio-start', onReqStart)
        window.addEventListener('request-audio-mute', onReqMute)
        return () => {
            window.removeEventListener('request-audio-start', onReqStart)
            window.removeEventListener('request-audio-mute', onReqMute)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const startAudio = () => {
        if (isStarted) return
        window.dispatchEvent(new CustomEvent('audio-active', { detail: { active: true } }))

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioContextClass()
        audioCtxRef.current = ctx

        const mainGain = ctx.createGain()
        mainGain.gain.setValueAtTime(0, ctx.currentTime)
        mainGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 1)
        mainGain.connect(ctx.destination)
        masterGainRef.current = mainGain

        // ── Mixer chain (FX only): lpFilter → panner → mainGain ──
        // Suno track plays through HTML5 Audio directly (no crossOrigin needed)
        // This avoids CORS issues with the Suno CDN.

        // LP filter — T/B axis
        const mixFilter = ctx.createBiquadFilter()
        mixFilter.type = 'lowpass'
        mixFilter.frequency.value = 18000
        mixFilter.Q.value = 0.7
        mixFilterRef.current = mixFilter

        // Stereo panner — L/R axis
        const panner = ctx.createStereoPanner()
        panner.pan.value = 0
        pannerRef.current = panner

        mixFilter.connect(panner)
        panner.connect(mainGain)

        // Setup Analyser node (driven by a silent oscillator so peak detection
        // loop stays alive for potential future use — won't affect FX)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(new ArrayBuffer(bufferLength))
        analyserRef.current = analyser
        dataArrayRef.current = dataArray
        analyser.connect(mainGain)

        // Suno track — route through Web Audio for mixer control
        const audio = new window.Audio('https://cdn1.suno.ai/047c5bd8-d62d-4b80-84ec-cf7c48bef6da.mp3')
        audio.crossOrigin = 'anonymous'
        audio.loop = true
        audio.volume = 1.0
        sunoAudioRef.current = audio

        audio.play().catch(e => console.warn("Suno track blocked:", e))

        // Route through mixer chain (CORS permitting)
        try {
            const source = ctx.createMediaElementSource(audio)
            source.connect(mixFilter)
            sunoSourceRef.current = source
        } catch {
            // CORS fallback — audio plays directly, mixer affects FX only
            sunoSourceRef.current = null
        }

        // Peak detection loop — store rAF ID for cleanup
        let lastPeakTime = 0
        const checkPeaks = () => {
            if (!analyserRef.current || !dataArrayRef.current) return
            // @ts-expect-error - TypeScript type mismatch between ArrayBufferLike and ArrayBuffer in Web Audio API
            analyserRef.current.getByteFrequencyData(dataArrayRef.current)

            // Calculate average energy in the bass/mid range (approx. first 10 bins)
            let sum = 0
            for (let i = 0; i < 10; i++) {
                sum += dataArrayRef.current[i]
            }
            const average = sum / 10
            const threshold = 180 // Deep bass hit threshold

            const now = Date.now()
            if (average > threshold && now - lastPeakTime > 400) { // Throttle glitches
                const intensity = (average - threshold) / (255 - threshold)
                window.dispatchEvent(new CustomEvent('audio-glitch-peak', {
                    detail: { intensity: Math.min(1, intensity + 0.5) }
                }))
                lastPeakTime = now
            }

            rafIdRef.current = requestAnimationFrame(checkPeaks)
        }
        checkPeaks()

        setIsStarted(true)
    }


    // Tension Sound — energy building: sub-rumble + rising FM whine + ratchet
    const playTensionSound = () => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime
        const dur = 1.1
        const dest = masterGainRef.current || ctx.destination

        // ── Sub rumble: very low sine that grows ──
        const sub = ctx.createOscillator()
        sub.type = 'sine'
        sub.frequency.setValueAtTime(38, now)
        sub.frequency.linearRampToValueAtTime(72, now + dur)
        const subGain = ctx.createGain()
        subGain.gain.setValueAtTime(0.0, now)
        subGain.gain.linearRampToValueAtTime(0.18, now + dur * 0.5)
        subGain.gain.linearRampToValueAtTime(0.0, now + dur)
        sub.connect(subGain); subGain.connect(dest)
        sub.start(now); sub.stop(now + dur)

        // ── FM whine: carrier + modulator for that electric charge feel ──
        const mod = ctx.createOscillator()
        mod.type = 'sine'
        mod.frequency.setValueAtTime(60, now)
        mod.frequency.exponentialRampToValueAtTime(420, now + dur)
        const modDepth = ctx.createGain()
        modDepth.gain.setValueAtTime(80, now)
        modDepth.gain.linearRampToValueAtTime(600, now + dur)
        mod.connect(modDepth)

        const carrier = ctx.createOscillator()
        carrier.type = 'sawtooth'
        carrier.frequency.setValueAtTime(280, now)
        carrier.frequency.exponentialRampToValueAtTime(1600, now + dur * 0.9)
        modDepth.connect(carrier.frequency)

        const carrierGain = ctx.createGain()
        carrierGain.gain.setValueAtTime(0.0, now)
        carrierGain.gain.linearRampToValueAtTime(0.06, now + dur * 0.2)
        carrierGain.gain.linearRampToValueAtTime(0.11, now + dur * 0.88)
        carrierGain.gain.linearRampToValueAtTime(0.0, now + dur)

        // highpass to keep it crisp
        const hp = ctx.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.value = 300

        carrier.connect(hp); hp.connect(carrierGain); carrierGain.connect(dest)
        mod.start(now);     mod.stop(now + dur)
        carrier.start(now); carrier.stop(now + dur)

        // ── AM ratchet: spring ticking, rate accelerates ──
        const sr = ctx.sampleRate
        const bufSize = Math.floor(sr * dur)
        const buf = ctx.createBuffer(1, bufSize, sr)
        const data = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) {
            const t = i / sr
            const amRate = 8 + (t / dur) * 38
            const am = Math.max(0, Math.sin(2 * Math.PI * amRate * t))
            data[i] = (Math.random() * 2 - 1) * am * (t / dur) * 0.9
        }
        const ratchet = ctx.createBufferSource()
        ratchet.buffer = buf
        const rBp = ctx.createBiquadFilter()
        rBp.type = 'bandpass'
        rBp.frequency.setValueAtTime(1400, now)
        rBp.frequency.exponentialRampToValueAtTime(4000, now + dur)
        rBp.Q.value = 2.5
        const rGain = ctx.createGain()
        rGain.gain.setValueAtTime(0.0, now)
        rGain.gain.linearRampToValueAtTime(0.07, now + dur * 0.15)
        rGain.gain.linearRampToValueAtTime(0.12, now + dur * 0.9)
        rGain.gain.linearRampToValueAtTime(0.0, now + dur)
        ratchet.connect(rBp); rBp.connect(rGain); rGain.connect(dest)
        ratchet.start(now); ratchet.stop(now + dur)
    }

    // Ripple Sound Effect Generator
    const playRippleSound = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime

        // Crackly / Electric Ripple
        const bufferSize = ctx.sampleRate * 0.2 // 200ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
            // Noisy signal with some periodic grain
            const noise = Math.random() * 2 - 1
            const grain = Math.sin(i * 0.05) * 0.5
            data[i] = (noise * 0.1 + grain) * (1 - i / bufferSize)
        }

        const source = ctx.createBufferSource()
        source.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(1000 + Math.random() * 2000, now)

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.05, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

        source.connect(filter)
        filter.connect(gain)
        gain.connect(masterGainRef.current || ctx.destination)

        source.start(now)
    }, [isMuted])

    // Glass Break Sound Generator
    const playGlassBreak = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime

        // High frequency noise burst
        const bufferSize = ctx.sampleRate * 0.5
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
            // Exponential decay noise
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1))
        }

        const source = ctx.createBufferSource()
        source.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(2000, now)
        filter.frequency.linearRampToValueAtTime(1000, now + 0.1)

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

        source.connect(filter)
        filter.connect(gain)
        gain.connect(masterGainRef.current || ctx.destination)
        source.start(now)

        // Add a "ting" - sine wave ping
        const osc = ctx.createOscillator()
        const oscGain = ctx.createGain()

        osc.frequency.setValueAtTime(3000 + Math.random() * 1000, now)
        osc.type = 'sine'

        oscGain.gain.setValueAtTime(0.1, now)
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

        osc.connect(oscGain)
        oscGain.connect(masterGainRef.current || ctx.destination)

        osc.start(now)
        osc.stop(now + 0.3)
    }, [isMuted])

    // --- Launch Whoosh (for gallery plates) ---
    const playLaunchSound = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(100, now)
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15)
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4)

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1200, now)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(masterGainRef.current || ctx.destination)

        osc.start(now)
        osc.stop(now + 0.4)
    }, [isMuted])

    // --- Explosion Boom (deep procedural impact) ---
    const playExplosionBoom = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime

        // Sub-bass kick — low sine sweep
        const osc1 = ctx.createOscillator()
        const osc1Gain = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(80, now)
        osc1.frequency.exponentialRampToValueAtTime(20, now + 1.2)
        osc1Gain.gain.setValueAtTime(0.8, now)
        osc1Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
        osc1.connect(osc1Gain)
        osc1Gain.connect(masterGainRef.current || ctx.destination)
        osc1.start(now)
        osc1.stop(now + 1.5)

        // White noise burst for the "crack"
        const bufSize = ctx.sampleRate * 1.5
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15))
        }
        const noiseSrc = ctx.createBufferSource()
        noiseSrc.buffer = buf
        const noiseFilter = ctx.createBiquadFilter()
        noiseFilter.type = 'lowpass'
        noiseFilter.frequency.setValueAtTime(1800, now)
        noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 1.2)
        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.5, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
        noiseSrc.connect(noiseFilter)
        noiseFilter.connect(noiseGain)
        noiseGain.connect(masterGainRef.current || ctx.destination)
        noiseSrc.start(now)

        // High shockwave tail (high-pass hiss fading)
        const tailBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const tailData = tailBuf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) {
            tailData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.8))
        }
        const tailSrc = ctx.createBufferSource()
        tailSrc.buffer = tailBuf
        const tailFilter = ctx.createBiquadFilter()
        tailFilter.type = 'highpass'
        tailFilter.frequency.setValueAtTime(3000, now)
        const tailGain = ctx.createGain()
        tailGain.gain.setValueAtTime(0.15, now)
        tailGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)
        tailSrc.connect(tailFilter)
        tailFilter.connect(tailGain)
        tailGain.connect(masterGainRef.current || ctx.destination)
        tailSrc.start(now)
    }, [isMuted])

    // --- Liquid Splat (wet impact + drip sound) ---
    const playLiquidSplat = useCallback(() => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime

        // Sharp impact burst (the "splat")
        const bufSize = ctx.sampleRate * 0.15
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02))
        }
        const splatSrc = ctx.createBufferSource()
        splatSrc.buffer = buf
        const splatFilter = ctx.createBiquadFilter()
        splatFilter.type = 'bandpass'
        splatFilter.frequency.setValueAtTime(600, now)
        splatFilter.Q.value = 0.8
        const splatGain = ctx.createGain()
        splatGain.gain.setValueAtTime(0.4, now)
        splatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        splatSrc.connect(splatFilter)
        splatFilter.connect(splatGain)
        splatGain.connect(masterGainRef.current || ctx.destination)
        splatSrc.start(now)

        // Slow wet drip tones (randon pings staggered in time)
        for (let d = 0; d < 6; d++) {
            const delay = 0.1 + d * (0.2 + Math.random() * 0.4)
            const freq = 300 + Math.random() * 400
            const drOsc = ctx.createOscillator()
            const drGain = ctx.createGain()
            drOsc.type = 'sine'
            drOsc.frequency.setValueAtTime(freq, now + delay)
            drOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + delay + 0.3)
            drGain.gain.setValueAtTime(0, now + delay)
            drGain.gain.linearRampToValueAtTime(0.06, now + delay + 0.01)
            drGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4)
            drOsc.connect(drGain)
            drGain.connect(masterGainRef.current || ctx.destination)
            drOsc.start(now + delay)
            drOsc.stop(now + delay + 0.5)
        }
    }, [isMuted])

    useEffect(() => {
        const handleToggle = () => {
            if (!isStarted) {
                startAudio();
            } else {
                toggleMute();
            }
        }
        window.addEventListener('toggle-neural-audio', handleToggle)
        
        const handleRipple = () => playRippleSound()
        const handleGlass = () => playGlassBreak()
        const handleExplosion = () => playExplosionBoom()
        const handleSplat = () => playLiquidSplat()
        const handleLaunch = () => playLaunchSound()

        // ── Charge whine — rising oscillator while holding ───────────
        let chargeOsc: OscillatorNode | null = null
        let chargeGain: GainNode | null = null

        const handleChargeStart = () => {
            if (!audioCtxRef.current || isMuted) return
            // Already charging
            if (chargeOsc) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime

            chargeOsc = ctx.createOscillator()
            chargeGain = ctx.createGain()

            chargeOsc.type = 'sawtooth'
            // Start low, ramp up to high over 1.5 s
            chargeOsc.frequency.setValueAtTime(280, now)
            chargeOsc.frequency.linearRampToValueAtTime(2400, now + 1.5)

            chargeGain.gain.setValueAtTime(0, now)
            chargeGain.gain.linearRampToValueAtTime(0.08, now + 0.05)

            chargeOsc.connect(chargeGain)
            chargeGain.connect(masterGainRef.current || ctx.destination)
            chargeOsc.start(now)
        }

        const handleChargeStop = () => {
            if (chargeOsc) {
                try {
                    chargeGain?.gain.setValueAtTime(chargeGain.gain.value, audioCtxRef.current!.currentTime)
                    chargeGain?.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 0.04)
                    chargeOsc.stop(audioCtxRef.current!.currentTime + 0.05)
                } catch (_) { /* already stopped */ }
                chargeOsc = null
                chargeGain = null
            }
        }


        const handlePlasmaShot = (e?: Event) => {
            if (!audioCtxRef.current || isMuted) return
            const charge = (e as CustomEvent)?.detail?.charge ?? 1
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sawtooth'
            const baseFreq = 1200 + charge * 800
            osc.frequency.setValueAtTime(baseFreq, now)
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.12 + charge * 0.06)
            g.gain.setValueAtTime(0.18 + charge * 0.12, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + charge * 0.08)
            osc.connect(g)
            g.connect(masterGainRef.current || ctx.destination)
            osc.start(now)
            osc.stop(now + 0.3)
        }

        // ── Plasma break (impact + glass scatter) ───────────────────
        const handlePlasmaBreak = () => {
            playGlassBreak()
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(600, now)
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.2)
            g.gain.setValueAtTime(0.2, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
            osc.connect(g)
            g.connect(masterGainRef.current || ctx.destination)
            osc.start(now)
            osc.stop(now + 0.2)
        }

        // ── Dry click (no ammo) ──────────────────────────────────────
        const handleDryFire = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'square'
            osc.frequency.setValueAtTime(120, now)
            g.gain.setValueAtTime(0.05, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
            osc.connect(g)
            g.connect(masterGainRef.current || ctx.destination)
            osc.start(now)
            osc.stop(now + 0.05)
        }

        window.addEventListener('play-ripple-sound', handleRipple)
        window.addEventListener('play-glass-break', handleGlass)
        window.addEventListener('play-explosion-boom', handleExplosion)
        window.addEventListener('liquid-splash', handleSplat)
        window.addEventListener('play-launch-sound', handleLaunch)
        window.addEventListener('play-plasma-shot', handlePlasmaShot)
        window.addEventListener('play-plasma-break', handlePlasmaBreak)
        window.addEventListener('play-dry-fire', handleDryFire)
        window.addEventListener('play-charge-start', handleChargeStart)
        window.addEventListener('play-charge-stop', handleChargeStop)

        // ── Reload sound — mechanical clunk + rising chirps ──────────
        const handleReload = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            // Deep thunk: noise burst
            const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
            const d = buf.getChannelData(0)
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2
            const noise = ctx.createBufferSource()
            noise.buffer = buf
            const noiseFilter = ctx.createBiquadFilter()
            noiseFilter.type = 'lowpass'
            noiseFilter.frequency.value = 800
            const noiseGain = ctx.createGain()
            noiseGain.gain.setValueAtTime(0.25, now)
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
            noise.connect(noiseFilter)
            noiseFilter.connect(noiseGain)
            noiseGain.connect(masterGainRef.current || ctx.destination)
            noise.start(now)
            // Rising chirps (6 = ammo count)
            for (let i = 0; i < 6; i++) {
                const t = now + 0.15 + i * 0.08
                const o = ctx.createOscillator()
                const g = ctx.createGain()
                o.type = 'square'
                o.frequency.setValueAtTime(600 + i * 150, t)
                o.frequency.exponentialRampToValueAtTime(1000 + i * 200, t + 0.04)
                g.gain.setValueAtTime(0.06, t)
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
                o.connect(g)
                g.connect(masterGainRef.current || ctx.destination)
                o.start(t)
                o.stop(t + 0.06)
            }
        }
        window.addEventListener('play-reload', handleReload)


        const handleTension = () => playTensionSound()
        window.addEventListener('play-tension-sound', handleTension)


        // Scratch — dual-layer vinyl: low rumble + high sizzle
        let scratchLow: AudioBufferSourceNode | null = null
        let scratchHigh: AudioBufferSourceNode | null = null
        let scratchGainLow: GainNode | null = null
        let scratchGainHigh: GainNode | null = null
        let scratchFilterLow: BiquadFilterNode | null = null
        let scratchFilterHigh: BiquadFilterNode | null = null

        // Reuse same noise buffers — created once per start
        const makeScratchLayer = (ctx: AudioContext) => {
            const bufLen = Math.floor(ctx.sampleRate * 0.5)
            const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
            const data = buf.getChannelData(0)
            // Vinyl surface: coloured noise (pink-ish, not pure white)
            let b0 = 0, b1 = 0, b2 = 0
            for (let i = 0; i < bufLen; i++) {
                const white = Math.random() * 2 - 1
                b0 = 0.99765 * b0 + white * 0.0990460
                b1 = 0.96300 * b1 + white * 0.2965164
                b2 = 0.57000 * b2 + white * 1.0526913
                data[i] = (b0 + b1 + b2 + white * 0.1848) / 4
            }
            const src = ctx.createBufferSource()
            src.buffer = buf
            src.loop = true
            return src
        }

        const handleScratchStart = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination

            // Stop previous if any
            if (scratchLow)  { try { scratchLow.stop()  } catch {} }
            if (scratchHigh) { try { scratchHigh.stop() } catch {} }

            // Start click — short vinyl pop
            const pop = ctx.createOscillator()
            pop.type = 'triangle'
            pop.frequency.setValueAtTime(280, now)
            pop.frequency.exponentialRampToValueAtTime(60, now + 0.03)
            const popGain = ctx.createGain()
            popGain.gain.setValueAtTime(0.18, now)
            popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
            pop.connect(popGain); popGain.connect(dest)
            pop.start(now); pop.stop(now + 0.04)

            // Layer 1: low rumble — body/groove feel
            const lowSrc = makeScratchLayer(ctx)
            const lowFilt = ctx.createBiquadFilter()
            lowFilt.type = 'bandpass'
            lowFilt.frequency.value = 180
            lowFilt.Q.value = 1.8
            const lowGain = ctx.createGain()
            lowGain.gain.setValueAtTime(0.0, now)
            lowGain.gain.linearRampToValueAtTime(0.12, now + 0.03)
            lowSrc.connect(lowFilt); lowFilt.connect(lowGain); lowGain.connect(dest)
            lowSrc.start()

            // Layer 2: high sizzle — needle on vinyl texture
            const highSrc = makeScratchLayer(ctx)
            const highFilt = ctx.createBiquadFilter()
            highFilt.type = 'bandpass'
            highFilt.frequency.value = 3200
            highFilt.Q.value = 3.5
            const highGain = ctx.createGain()
            highGain.gain.setValueAtTime(0.0, now)
            highGain.gain.linearRampToValueAtTime(0.06, now + 0.03)
            highSrc.connect(highFilt); highFilt.connect(highGain); highGain.connect(dest)
            highSrc.start()

            scratchLow = lowSrc;  scratchGainLow = lowGain;  scratchFilterLow = lowFilt
            scratchHigh = highSrc; scratchGainHigh = highGain; scratchFilterHigh = highFilt
        }

        const handleScratchMove = (e: Event) => {
            if (!scratchLow || !audioCtxRef.current) return
            const { velocity } = (e as CustomEvent).detail
            const ctx = audioCtxRef.current
            const speed = Math.abs(velocity)
            const t = ctx.currentTime

            // Low layer: 80Hz (dead stop) → 400Hz (fast drag)
            const lowFreq = 80 + speed * 2400
            if (scratchFilterLow)  scratchFilterLow.frequency.setTargetAtTime(Math.min(400, lowFreq), t, 0.02)
            if (scratchGainLow)    scratchGainLow.gain.setTargetAtTime(Math.min(0.18, 0.01 + speed * 0.5), t, 0.015)

            // High layer: sizzle grows with speed
            const highFreq = 2000 + speed * 8000
            if (scratchFilterHigh) scratchFilterHigh.frequency.setTargetAtTime(Math.min(6000, highFreq), t, 0.02)
            if (scratchGainHigh)   scratchGainHigh.gain.setTargetAtTime(Math.min(0.10, speed * 0.4), t, 0.015)
        }

        const handleScratchStop = () => {
            if (!audioCtxRef.current) return
            const ctx = audioCtxRef.current
            const t = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination

            // Record slowdown: pitch ramps down like a spinning disk losing speed
            if (scratchLow)  scratchLow.playbackRate.setValueAtTime(1.0, t)
            if (scratchLow)  scratchLow.playbackRate.exponentialRampToValueAtTime(0.05, t + 0.28)
            if (scratchHigh) scratchHigh.playbackRate.setValueAtTime(1.0, t)
            if (scratchHigh) scratchHigh.playbackRate.exponentialRampToValueAtTime(0.05, t + 0.22)

            // Fade out gains with the slowdown
            if (scratchGainLow)  scratchGainLow.gain.setTargetAtTime(0.0, t, 0.08)
            if (scratchGainHigh) scratchGainHigh.gain.setTargetAtTime(0.0, t, 0.06)

            // Tail pop — turntable stop thud
            const pop = ctx.createOscillator()
            pop.type = 'triangle'
            pop.frequency.setValueAtTime(90, t)
            pop.frequency.exponentialRampToValueAtTime(28, t + 0.06)
            const popGain = ctx.createGain()
            popGain.gain.setValueAtTime(0.12, t)
            popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
            pop.connect(popGain); popGain.connect(dest)
            pop.start(t); pop.stop(t + 0.07)

            const nLow = scratchLow; const nHigh = scratchHigh
            scratchLow = null; scratchHigh = null
            scratchGainLow = null; scratchGainHigh = null
            scratchFilterLow = null; scratchFilterHigh = null
            setTimeout(() => { try { nLow?.stop()  } catch {} }, 400)
            setTimeout(() => { try { nHigh?.stop() } catch {} }, 400)
        }

        // ── Sustained bass — held mouse button ──
        let bassNodes: { osc1: OscillatorNode, osc2: OscillatorNode, lfo: OscillatorNode, masterGain: GainNode } | null = null

        const handleBassStart = () => {
            if (!audioCtxRef.current || isMuted || bassNodes) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination

            // Base pitch: ~55 Hz (A1), slight detune between two oscillators for thickness
            const osc1 = ctx.createOscillator()
            osc1.type = 'sine'
            osc1.frequency.value = 55
            osc1.detune.value = 0

            const osc2 = ctx.createOscillator()
            osc2.type = 'triangle'
            osc2.frequency.value = 55
            osc2.detune.value = +7   // slight chorus spread

            // Sub harmonic layer — octave down, pure sine
            const osc3 = ctx.createOscillator()
            osc3.type = 'sine'
            osc3.frequency.value = 27.5
            osc3.detune.value = 0

            // Slow LFO — tremolo wobble ~0.4 Hz
            const lfo = ctx.createOscillator()
            lfo.type = 'sine'
            lfo.frequency.value = 0.4
            const lfoDepth = ctx.createGain()
            lfoDepth.gain.value = 0.12
            lfo.connect(lfoDepth)

            // Gain structure
            const g1 = ctx.createGain(); g1.gain.value = 0.45
            const g2 = ctx.createGain(); g2.gain.value = 0.25
            const g3 = ctx.createGain(); g3.gain.value = 0.30

            const master = ctx.createGain()
            master.gain.setValueAtTime(0.0, now)
            master.gain.linearRampToValueAtTime(0.70, now + 0.18)  // slow attack

            // LFO → master gain for tremolo
            lfoDepth.connect(master.gain)

            // LP filter — cuts harshness, keeps it warm
            const lp = ctx.createBiquadFilter()
            lp.type = 'lowpass'
            lp.frequency.value = 320
            lp.Q.value = 1.2

            osc1.connect(g1); g1.connect(lp)
            osc2.connect(g2); g2.connect(lp)
            osc3.connect(g3); g3.connect(lp)
            lp.connect(master)
            master.connect(dest)

            osc1.start(now); osc2.start(now); osc3.start(now); lfo.start(now)
            bassNodes = { osc1, osc2, lfo, masterGain: master }
        }

        const handleBassStop = () => {
            if (!audioCtxRef.current || !bassNodes) return
            const ctx = audioCtxRef.current
            const t = ctx.currentTime
            // Smooth release — 0.35s exponential tail
            bassNodes.masterGain.gain.cancelScheduledValues(t)
            bassNodes.masterGain.gain.setValueAtTime(bassNodes.masterGain.gain.value, t)
            bassNodes.masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
            const nodes = bassNodes
            bassNodes = null
            setTimeout(() => {
                try { nodes.osc1.stop(); nodes.osc2.stop(); nodes.lfo.stop() } catch {}
            }, 400)
        }

        window.addEventListener('bass-hold-start', handleBassStart)
        window.addEventListener('bass-hold-stop',  handleBassStop)

        // ── Preload bass sample ──
        fetch('/bangin-808-bass-bass-falling_C_major.wav')
            .then(r => r.arrayBuffer())
            .then(buf => audioCtxRef.current!.decodeAudioData(buf))
            .then(decoded => { bassSampleRef.current = decoded })
            .catch(() => {})

        // ── Kick / bass sample on mousedown ──
        const handleKick = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination

            // Play bass sample if loaded
            if (bassSampleRef.current) {
                const src = ctx.createBufferSource()
                src.buffer = bassSampleRef.current
                const g = ctx.createGain()
                g.gain.setValueAtTime(0.85, now)
                src.connect(g); g.connect(dest)
                src.start(now)
                return
            }

            // Transient click — noise burst, 4ms
            const cLen = Math.floor(ctx.sampleRate * 0.004)
            const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate)
            const cData = cBuf.getChannelData(0)
            for (let i = 0; i < cLen; i++) cData[i] = (Math.random() * 2 - 1) * (1 - i / cLen)
            const click = ctx.createBufferSource()
            click.buffer = cBuf
            const clickGain = ctx.createGain()
            clickGain.gain.setValueAtTime(0.9, now)
            clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.004)
            click.connect(clickGain); clickGain.connect(dest)
            click.start(now); click.stop(now + 0.004)

            // Sub sine — pitch drops 160 → 38 Hz (punch + body)
            const kick = ctx.createOscillator()
            kick.type = 'sine'
            kick.frequency.setValueAtTime(160, now)
            kick.frequency.exponentialRampToValueAtTime(38, now + 0.18)
            const kickGain = ctx.createGain()
            kickGain.gain.setValueAtTime(0.0, now)
            kickGain.gain.linearRampToValueAtTime(0.95, now + 0.003) // instant punch
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
            kick.connect(kickGain); kickGain.connect(dest)
            kick.start(now); kick.stop(now + 0.38)

            // Body layer — slightly higher sine for mid presence
            const body = ctx.createOscillator()
            body.type = 'sine'
            body.frequency.setValueAtTime(90, now)
            body.frequency.exponentialRampToValueAtTime(55, now + 0.10)
            const bodyGain = ctx.createGain()
            bodyGain.gain.setValueAtTime(0.35, now)
            bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
            body.connect(bodyGain); bodyGain.connect(dest)
            body.start(now); body.stop(now + 0.15)
        }
        window.addEventListener('play-kick', handleKick)

        // ── Mixer move: L/R pan + T/B filter sweep ──
        const handleMixerMove = (e: Event) => {
            if (!audioCtxRef.current) return
            const { x, y } = (e as CustomEvent).detail
            const ctx = audioCtxRef.current
            const t = ctx.currentTime

            // L/R → stereo pan: 0=left(-1) … 0.5=center(0) … 1=right(+1)
            if (pannerRef.current) {
                const pan = x * 2 - 1
                pannerRef.current.pan.setTargetAtTime(pan, t, 0.04)
            }

            // T/B → LP filter sweep with resonance peak in mid-range
            // top(y=0) = open 18kHz | mid(y=0.5) = resonant 1.2kHz | bottom(y=1) = dark 120Hz
            if (mixFilterRef.current) {
                const freq = 120 * Math.pow(150, 1 - y)           // 120 → 18000 Hz exponential
                const q    = 0.7 + Math.sin(y * Math.PI) * 7.0    // 0.7 → 7.7 → 0.7 (peak at mid)
                mixFilterRef.current.frequency.setTargetAtTime(Math.min(18000, freq), t, 0.05)
                mixFilterRef.current.Q.setTargetAtTime(q, t, 0.05)
            }
        }
        window.addEventListener('mixer-move', handleMixerMove)

        window.addEventListener('mixer-scratch-start', handleScratchStart)
        window.addEventListener('mixer-scratch-move', handleScratchMove)
        window.addEventListener('mixer-scratch-stop', handleScratchStop)

        // Hover enter — sci-fi two-tone ping (FM chirp)
        const handleHoverEnter = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination

            // FM chirp: modulator sweeps carrier up
            const mod = ctx.createOscillator()
            mod.type = 'sine'
            mod.frequency.setValueAtTime(180, now)
            mod.frequency.exponentialRampToValueAtTime(480, now + 0.06)
            const modDepth = ctx.createGain()
            modDepth.gain.value = 320

            const carrier = ctx.createOscillator()
            carrier.type = 'sine'
            carrier.frequency.setValueAtTime(640, now)
            carrier.frequency.exponentialRampToValueAtTime(1280, now + 0.06)
            mod.connect(modDepth); modDepth.connect(carrier.frequency)

            const g = ctx.createGain()
            g.gain.setValueAtTime(0.07, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
            carrier.connect(g); g.connect(dest)
            mod.start(now);     mod.stop(now + 0.07)
            carrier.start(now); carrier.stop(now + 0.09)

            // Second harmonic ping — slightly delayed, higher
            const ping = ctx.createOscillator()
            ping.type = 'sine'
            ping.frequency.setValueAtTime(1920, now + 0.03)
            ping.frequency.exponentialRampToValueAtTime(2560, now + 0.09)
            const pingGain = ctx.createGain()
            pingGain.gain.setValueAtTime(0.0, now)
            pingGain.gain.setValueAtTime(0.04, now + 0.03)
            pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
            ping.connect(pingGain); pingGain.connect(dest)
            ping.start(now + 0.03); ping.stop(now + 0.12)
        }
        const handleHoverLeave = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination
            // Soft descending click
            const osc = ctx.createOscillator()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(800, now)
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.05)
            const g = ctx.createGain()
            g.gain.setValueAtTime(0.03, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
            osc.connect(g); g.connect(dest)
            osc.start(now); osc.stop(now + 0.06)
        }

        // Interaction (typing fallback — keep quiet)
        const handleInteraction = () => {
            if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended' || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(1800 + Math.random() * 600, now)
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.04)
            g.gain.setValueAtTime(0.008, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
            osc.connect(g)
            g.connect(masterGainRef.current || ctx.destination)
            osc.start(now); osc.stop(now + 0.04)
        }
        window.addEventListener('hover-button-enter', handleHoverEnter)
        window.addEventListener('hover-button-leave', handleHoverLeave)
        window.addEventListener('play-typing-sound', handleInteraction)

        return () => {
            // Stop active scratch nodes before re-running the effect
            if (scratchLow)  { try { scratchLow.stop()  } catch {} }
            if (scratchHigh) { try { scratchHigh.stop() } catch {} }
            window.removeEventListener('toggle-neural-audio', handleToggle)
            window.removeEventListener('play-ripple-sound', handleRipple)
            window.removeEventListener('play-tension-sound', handleTension)
            window.removeEventListener('play-launch-sound', handleLaunch)
            window.removeEventListener('bass-hold-start', handleBassStart)
            window.removeEventListener('bass-hold-stop',  handleBassStop)
            if (bassNodes) { try { bassNodes.osc1.stop(); bassNodes.osc2.stop(); bassNodes.lfo.stop() } catch {} }
            window.removeEventListener('play-kick', handleKick)
            window.removeEventListener('mixer-move', handleMixerMove)
            window.removeEventListener('mixer-scratch-start', handleScratchStart)
            window.removeEventListener('mixer-scratch-move', handleScratchMove)
            window.removeEventListener('mixer-scratch-stop', handleScratchStop)
            window.removeEventListener('hover-button-enter', handleHoverEnter)
            window.removeEventListener('hover-button-leave', handleHoverLeave)
            window.removeEventListener('play-typing-sound', handleInteraction)
            // Make sure the charge whine always stops on cleanup
            handleChargeStop()
        }
    }, [isStarted, isMuted, playExplosionBoom, playGlassBreak, playLiquidSplat, playRippleSound])

    // Cleanup on unmount: cancel rAF loop, stop audio, close AudioContext
    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
            if (sunoAudioRef.current) sunoAudioRef.current.pause()
            if (audioCtxRef.current) audioCtxRef.current.close()
        }
    }, [])

    return null;
}
