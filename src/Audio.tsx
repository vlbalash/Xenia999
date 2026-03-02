import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Audio System - Integrated Suno Track & Procedural FX
 */
export default function Audio() {
    const [isStarted, setIsStarted] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const masterGainRef = useRef<GainNode | null>(null)
    const sunoAudioRef = useRef<HTMLAudioElement | null>(null)
    const sunoSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)
    const rafIdRef = useRef<number | null>(null)

    const toggleMute = () => {
        if (!masterGainRef.current || !audioCtxRef.current) return
        const targetGain = isMuted ? 0.6 : 0
        masterGainRef.current.gain.exponentialRampToValueAtTime(targetGain + 0.001, audioCtxRef.current.currentTime + 0.5)
        setIsMuted(!isMuted)
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

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioContextClass()
        audioCtxRef.current = ctx

        const mainGain = ctx.createGain()
        mainGain.gain.setValueAtTime(0, ctx.currentTime)
        mainGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1)
        mainGain.connect(ctx.destination)
        masterGainRef.current = mainGain

        // Initialize Suno Track
        const audio = new window.Audio('https://cdn1.suno.ai/047c5bd8-d62d-4b80-84ec-cf7c48bef6da.mp3')
        audio.crossOrigin = 'anonymous'
        audio.loop = true
        sunoAudioRef.current = audio

        const source = ctx.createMediaElementSource(audio)

        // Setup Analyser
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(new ArrayBuffer(bufferLength))
        analyserRef.current = analyser
        dataArrayRef.current = dataArray

        source.connect(analyser)
        analyser.connect(mainGain)
        sunoSourceRef.current = source

        audio.play().catch(e => console.error("Suno audio playback failed:", e))

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
        console.log("Audio Engine Started with Analyser & Suno Track")
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


        // Old interaction sounds (keep for feedback)
        const handleInteraction = () => {
            if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended' || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(2000 + Math.random() * 1000, now)
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05)
            g.gain.setValueAtTime(0.01, now)
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
            osc.connect(g)
            g.connect(masterGainRef.current || ctx.destination)
            osc.start(now)
            osc.stop(now + 0.05)
        }
        window.addEventListener('play-typing-sound', handleInteraction)

        return () => {
            window.removeEventListener('play-ripple-sound', handleRipple)
            window.removeEventListener('play-glass-break', handleGlass)
            window.removeEventListener('play-explosion-boom', handleExplosion)
            window.removeEventListener('liquid-splash', handleSplat)
            window.removeEventListener('play-launch-sound', handleLaunch)
            window.removeEventListener('play-plasma-shot', handlePlasmaShot)
            window.removeEventListener('play-plasma-break', handlePlasmaBreak)
            window.removeEventListener('play-dry-fire', handleDryFire)
            window.removeEventListener('play-charge-start', handleChargeStart)
            window.removeEventListener('play-charge-stop', handleChargeStop)
            window.removeEventListener('play-typing-sound', handleInteraction)
            // Make sure the charge whine always stops on cleanup
            handleChargeStop()
        }
    }, [isStarted, isMuted, playExplosionBoom, playGlassBreak, playLiquidSplat, playRippleSound])

    // Cleanup rAF on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
            sunoAudioRef.current?.pause()
            audioCtxRef.current?.close()
        }
    }, [])

    // This component is now purely a headless controller.
    // UI is handled by the dedicated AudioButton component.
    return null
}
