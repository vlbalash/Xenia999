import { useState, useEffect } from 'react'
import { EffectComposer, SelectiveBloom, Glitch, Vignette } from '@react-three/postprocessing'
import { GlitchMode } from 'postprocessing'
import * as THREE from 'three'

const GLITCH_DELAY = new THREE.Vector2(0, 0)

export default function Effects() {
    const [glitchActive, setGlitchActive] = useState(false)

    useEffect(() => {
        const handleGlitchPeak = (e: any) => {
            const intensity = e.detail?.intensity || 0.5
            setGlitchActive(true)
            window.dispatchEvent(new CustomEvent('play-ripple-sound'))
            const duration = 200 + intensity * 800
            setTimeout(() => setGlitchActive(false), duration)
        }
        window.addEventListener('audio-glitch-peak', handleGlitchPeak)
        return () => window.removeEventListener('audio-glitch-peak', handleGlitchPeak)
    }, [])

    return (
        <EffectComposer multisampling={0}>
            <SelectiveBloom
                intensity={0.30}
                luminanceThreshold={0.85}
                luminanceSmoothing={0.06}
            />
            <Vignette
                eskil={false}
                offset={0.25}
                darkness={0.45}
            />
            <Glitch
                delay={GLITCH_DELAY}
                duration={new THREE.Vector2(0.5, 1.2)}
                strength={new THREE.Vector2(0.3, 1.0)}
                mode={GlitchMode.SPORADIC}
                ratio={0.85}
                active={glitchActive}
            />
        </EffectComposer>
    )
}
