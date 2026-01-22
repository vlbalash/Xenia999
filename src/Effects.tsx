import { EffectComposer, Bloom, Glitch, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { GlitchMode, BlendFunction } from 'postprocessing'
import * as THREE from 'three'

export default function Effects() {
    return (
        <EffectComposer multisampling={0}>
            <Bloom
                intensity={1.0}
                luminanceThreshold={0.5}
                luminanceSmoothing={0.02}
            />
            <Glitch
                delay={new THREE.Vector2(1.5, 3.5)}
                duration={new THREE.Vector2(0.6, 1.0)}
                strength={new THREE.Vector2(0.3, 1.0)}
                mode={GlitchMode.SPORADIC}
                ratio={0.85}
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
