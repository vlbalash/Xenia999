import { EffectComposer, Bloom, Glitch, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { GlitchMode, BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useState, useEffect } from 'react'

export default function Effects() {
    const [glitchActive, setGlitchActive] = useState(false)

    useEffect(() => {
        const handleGlitchPeak = (e: any) => {
            const intensity = e.detail?.intensity || 0.5

            setGlitchActive(true)
            window.dispatchEvent(new CustomEvent('play-ripple-sound'))

            // Duration and strength based on audio intensity
            const duration = 200 + intensity * 800
            setTimeout(() => {
                setGlitchActive(false)
            }, duration)
        }

        window.addEventListener('audio-glitch-peak', handleGlitchPeak)
        return () => window.removeEventListener('audio-glitch-peak', handleGlitchPeak)
    }, [])

    return (
        <EffectComposer multisampling={0}>
            <Bloom
                intensity={1.0}
                luminanceThreshold={0.5}
                luminanceSmoothing={0.02}
            />
            <Glitch
                delay={new THREE.Vector2(0, 0)} // Handled by active prop
                duration={new THREE.Vector2(0.5, 1.2)}
                strength={new THREE.Vector2(0.3, 1.0)}
                mode={GlitchMode.SPORADIC}
                ratio={0.85}
                active={glitchActive}
            />
            <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={new THREE.Vector2(0.002, 0.002)}
                radialModulation={false}
                modulationOffset={0}
            />
            <Noise opacity={0.1} />
        </EffectComposer>
    )
}
