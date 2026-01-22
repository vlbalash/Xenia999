import { useEffect, useRef, useState } from 'react'

/**
 * Audio System - Procedural Cinematic Audio
 * Generates an ambient drone and a triggering mechanism for typing sounds.
 */
export default function Audio() {
    const [isStarted, setIsStarted] = useState(false)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const droneRef = useRef<any>(null)

    const startAudio = () => {
        if (isStarted) return

        // Initialize Audio Context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContextClass()
        audioCtxRef.current = ctx

        // Create Ambient Drone
        // Multiple oscillators for a rich, "void" texture
        const createDrone = () => {
            const masterGain = ctx.createGain()
            masterGain.gain.setValueAtTime(0, ctx.currentTime)
            masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2)
            masterGain.connect(ctx.destination)

            const osc1 = ctx.createOscillator()
            osc1.type = 'triangle'
            osc1.frequency.setValueAtTime(60, ctx.currentTime) // Low C

            const filter = ctx.createBiquadFilter()
            filter.type = 'lowpass'
            filter.frequency.setValueAtTime(400, ctx.currentTime)

            osc1.connect(filter)
            filter.connect(masterGain)
            osc1.start()

            // Subtle FM modulation for "pulsating" feel
            const lfo = ctx.createOscillator()
            lfo.frequency.setValueAtTime(0.5, ctx.currentTime)
            const lfoGain = ctx.createGain()
            lfoGain.gain.setValueAtTime(10, ctx.currentTime)
            lfo.connect(lfoGain)
            lfoGain.connect(osc1.frequency)
            lfo.start()

            return { osc1, masterGain, lfo }
        }

        droneRef.current = createDrone()
        setIsStarted(true)
        console.log("Audio Engine Started")
    }

    // Play a "blip" sound for typing
    // Expose this via a global event for now
    useEffect(() => {
        const handleTyping = () => {
            if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') return

            const ctx = audioCtxRef.current
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'square'
            osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1)

            gain.gain.setValueAtTime(0.02, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.1)
        }

        window.addEventListener('play-typing-sound', handleTyping)
        return () => window.removeEventListener('play-typing-sound', handleTyping)
    }, [isStarted])

    if (!isStarted) {
        return (
            <div
                className="fixed bottom-8 right-8 z-[100] cursor-pointer rounded-full bg-cyan-500/10 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 backdrop-blur-md outline outline-1 outline-cyan-500/50 transition-all hover:bg-cyan-500/20"
                onClick={startAudio}
            >
                Initialize Audio Engine
            </div>
        )
    }

    return (
        <div className="fixed bottom-8 right-8 z-[100] text-[8px] uppercase tracking-widest text-cyan-500/30">
            Audio Engine Active
        </div>
    )
}
