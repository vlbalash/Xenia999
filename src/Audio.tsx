import { useEffect, useRef, useState } from 'react'

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

    const toggleMute = () => {
        if (!masterGainRef.current || !audioCtxRef.current) return
        const targetGain = isMuted ? 0.6 : 0
        masterGainRef.current.gain.exponentialRampToValueAtTime(targetGain + 0.001, audioCtxRef.current.currentTime + 0.5)
        setIsMuted(!isMuted)
    }

    const startAudio = () => {
        if (isStarted) return

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
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

            requestAnimationFrame(checkPeaks)
        }
        checkPeaks()

        setIsStarted(true)
        console.log("Audio Engine Started with Analyser & Suno Track")
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
        const handleRipple = () => playRippleSound()
        window.addEventListener('play-ripple-sound', handleRipple)

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
            window.removeEventListener('play-typing-sound', handleInteraction)
        }
    }, [isStarted, isMuted])

    if (!isStarted) {
        return (
            <div
                className="fixed bottom-8 right-8 z-[100] cursor-pointer rounded-full bg-cyan-500/10 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 backdrop-blur-md outline outline-1 outline-cyan-500/50 transition-all hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                onClick={startAudio}
            >
                Initialize Neural Audio
            </div>
        )
    }

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-2">
            <div className="text-[8px] uppercase tracking-[0.3em] text-cyan-500/40 animate-pulse">
                Neural Stream Active
            </div>
            <button
                onClick={toggleMute}
                className="group flex items-center gap-3 rounded-full bg-black/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md border border-white/10 hover:border-cyan-500/50 transition-all"
            >
                <div className={`h-1.5 w-1.5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'}`} />
                {isMuted ? 'Muted' : 'Live'}
            </button>
        </div>
    )
}
