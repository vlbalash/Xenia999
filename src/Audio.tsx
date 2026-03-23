import { useEffect, useRef, useState } from 'react'

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

    const toggleMute = () => {
        if (!masterGainRef.current || !audioCtxRef.current) return
        const goingMute = !isMuted
        // FX chain gain
        masterGainRef.current.gain.exponentialRampToValueAtTime(
            goingMute ? 0.001 : 0.6,
            audioCtxRef.current.currentTime + 0.5
        )
        // Suno HTML5 track
        if (sunoAudioRef.current) {
            sunoAudioRef.current.volume = goingMute ? 0 : 1.0
        }
        setIsMuted(goingMute)
        window.dispatchEvent(new CustomEvent('audio-active', { detail: { active: !goingMute } }))
    }

    const startAudio = () => {
        if (isStarted) return
        window.dispatchEvent(new CustomEvent('audio-active', { detail: { active: true } }))

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
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

        // Suno track — plain HTML5, no Web Audio routing (avoids CORS)
        const audio = new window.Audio('https://cdn1.suno.ai/047c5bd8-d62d-4b80-84ec-cf7c48bef6da.mp3')
        audio.loop = true
        audio.volume = 1.0
        sunoAudioRef.current = audio
        sunoSourceRef.current = null  // not connected through Web Audio

        audio.play().catch(e => console.warn("Suno track blocked:", e))

        // Peak detection loop
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

    // ── Shared reverb tail (short plate-style) ──
    const makeReverb = (ctx: AudioContext, decaySec = 0.6, wet = 0.22): ConvolverNode => {
        const sr = ctx.sampleRate
        const len = Math.floor(sr * decaySec)
        const buf = ctx.createBuffer(2, len, sr)
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch)
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5)
            }
        }
        const conv = ctx.createConvolver()
        conv.buffer = buf
        // wet/dry blend
        const wetGain = ctx.createGain()
        wetGain.gain.value = wet
        conv.connect(wetGain)
        ;(conv as any)._wetGain = wetGain
        return conv
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

    // Launch Sound — slingshot release: sub kick + spring snap + long whoosh tail
    const playLaunchSound = () => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime
        const dest = masterGainRef.current || ctx.destination

        // ── Sub kick: deep sine punch ──
        const kick = ctx.createOscillator()
        kick.type = 'sine'
        kick.frequency.setValueAtTime(140, now)
        kick.frequency.exponentialRampToValueAtTime(32, now + 0.12)
        const kickGain = ctx.createGain()
        kickGain.gain.setValueAtTime(0.5, now)
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
        kick.connect(kickGain); kickGain.connect(dest)
        kick.start(now); kick.stop(now + 0.14)

        // ── Spring snap: FM pair — brief metallic ping ──
        const sMod = ctx.createOscillator()
        sMod.type = 'sine'
        sMod.frequency.setValueAtTime(900, now)
        sMod.frequency.exponentialRampToValueAtTime(200, now + 0.08)
        const sModDepth = ctx.createGain()
        sModDepth.gain.value = 1200
        sMod.connect(sModDepth)

        const sCarrier = ctx.createOscillator()
        sCarrier.type = 'triangle'
        sCarrier.frequency.setValueAtTime(1400, now)
        sCarrier.frequency.exponentialRampToValueAtTime(180, now + 0.10)
        sModDepth.connect(sCarrier.frequency)

        const snapGain = ctx.createGain()
        snapGain.gain.setValueAtTime(0.12, now)
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        sCarrier.connect(snapGain); snapGain.connect(dest)
        sMod.start(now);     sMod.stop(now + 0.10)
        sCarrier.start(now); sCarrier.stop(now + 0.12)

        // ── Whoosh: noise sweeping from high to low, long tail ──
        const wLen = Math.floor(ctx.sampleRate * 0.45)
        const wBuf = ctx.createBuffer(1, wLen, ctx.sampleRate)
        const wData = wBuf.getChannelData(0)
        for (let i = 0; i < wLen; i++) wData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / wLen, 1.4)
        const whoosh = ctx.createBufferSource()
        whoosh.buffer = wBuf
        const wHp = ctx.createBiquadFilter()
        wHp.type = 'highpass'
        wHp.frequency.setValueAtTime(3200, now)
        wHp.frequency.exponentialRampToValueAtTime(200, now + 0.45)
        const wGain = ctx.createGain()
        wGain.gain.setValueAtTime(0.20, now)
        wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
        whoosh.connect(wHp); wHp.connect(wGain); wGain.connect(dest)
        whoosh.start(now); whoosh.stop(now + 0.45)

        // ── Short reverb tail on snap ──
        const rev = makeReverb(ctx, 0.5, 0.18)
        ;(rev as any)._wetGain.connect(dest)
        snapGain.connect(rev)
    }

    // Impact Sound — shattering energy: layered crack + sub boom + reverb bloom
    const playImpactSound = () => {
        if (!audioCtxRef.current || isMuted) return
        const ctx = audioCtxRef.current
        const now = ctx.currentTime
        const dest = masterGainRef.current || ctx.destination

        // ── Transient crack (noise burst) ──
        const cLen = Math.floor(ctx.sampleRate * 0.04)
        const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate)
        const cData = cBuf.getChannelData(0)
        for (let i = 0; i < cLen; i++) cData[i] = (Math.random() * 2 - 1) * (1 - i / cLen)
        const crack = ctx.createBufferSource()
        crack.buffer = cBuf
        const crackHp = ctx.createBiquadFilter()
        crackHp.type = 'highpass'
        crackHp.frequency.value = 4000
        const crackGain = ctx.createGain()
        crackGain.gain.setValueAtTime(0.55, now)
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        crack.connect(crackHp); crackHp.connect(crackGain); crackGain.connect(dest)
        crack.start(now); crack.stop(now + 0.04)

        // ── Sub boom: pitched sine drop ──
        const boom = ctx.createOscillator()
        boom.type = 'sine'
        boom.frequency.setValueAtTime(180, now)
        boom.frequency.exponentialRampToValueAtTime(28, now + 0.22)
        const boomGain = ctx.createGain()
        boomGain.gain.setValueAtTime(0.55, now)
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        boom.connect(boomGain); boomGain.connect(dest)
        boom.start(now); boom.stop(now + 0.25)

        // ── Mid crunch: FM metallic ring ──
        const rMod = ctx.createOscillator()
        rMod.type = 'sine'
        rMod.frequency.setValueAtTime(340, now)
        const rModDepth = ctx.createGain()
        rModDepth.gain.value = 800
        rMod.connect(rModDepth)
        const ring = ctx.createOscillator()
        ring.type = 'square'
        ring.frequency.setValueAtTime(520, now)
        ring.frequency.exponentialRampToValueAtTime(80, now + 0.15)
        rModDepth.connect(ring.frequency)
        const ringGain = ctx.createGain()
        ringGain.gain.setValueAtTime(0.10, now)
        ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
        ring.connect(ringGain); ringGain.connect(dest)
        rMod.start(now); rMod.stop(now + 0.15)
        ring.start(now); ring.stop(now + 0.18)

        // ── Shockwave bloom: expanding noise swell ──
        const bLen = Math.floor(ctx.sampleRate * 0.5)
        const bBuf = ctx.createBuffer(1, bLen, ctx.sampleRate)
        const bData = bBuf.getChannelData(0)
        for (let i = 0; i < bLen; i++) bData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bLen, 1.5)
        const bloom = ctx.createBufferSource()
        bloom.buffer = bBuf
        const bloomBp = ctx.createBiquadFilter()
        bloomBp.type = 'bandpass'
        bloomBp.frequency.setValueAtTime(500, now)
        bloomBp.frequency.exponentialRampToValueAtTime(3500, now + 0.06)
        bloomBp.frequency.exponentialRampToValueAtTime(300, now + 0.5)
        bloomBp.Q.value = 0.8
        const bloomGain = ctx.createGain()
        bloomGain.gain.setValueAtTime(0.22, now)
        bloomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        bloom.connect(bloomBp); bloomBp.connect(bloomGain); bloomGain.connect(dest)
        bloom.start(now); bloom.stop(now + 0.5)

        // ── Long reverb tail ──
        const rev = makeReverb(ctx, 1.2, 0.30)
        ;(rev as any)._wetGain.connect(dest)
        boomGain.connect(rev)
        bloomGain.connect(rev)
    }

    // Ripple Sound Effect Generator
    const playRippleSound = () => {
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
    }

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
        window.addEventListener('play-ripple-sound', handleRipple)

        const handleTension = () => playTensionSound()
        window.addEventListener('play-tension-sound', handleTension)

        const handleLaunch = () => playLaunchSound()
        window.addEventListener('play-launch-sound', handleLaunch)

        const handleImpact = () => playImpactSound()
        window.addEventListener('play-impact-sound', handleImpact)

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

        // ── Kick drum on mousedown ──
        const handleKick = () => {
            if (!audioCtxRef.current || isMuted) return
            const ctx = audioCtxRef.current
            const now = ctx.currentTime
            const dest = masterGainRef.current || ctx.destination

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
            window.removeEventListener('play-impact-sound', handleImpact)
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
        }
    }, [isStarted, isMuted])

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
