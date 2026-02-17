import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

// Define EffectsProps interface to match parent usage
interface EffectsProps {
    glitchActive?: boolean
}

export const Effects = ({ glitchActive: _ }: EffectsProps) => {
    return (
        <EffectComposer multisampling={0}>
            <Bloom
                intensity={0.5}
                luminanceThreshold={0.8}
                luminanceSmoothing={0.02}
            />
            {/* 
            <Glitch
                delay={new THREE.Vector2(0, 0)}
                duration={new THREE.Vector2(0.5, 1.2)}
                strength={new THREE.Vector2(0.3, 1.0)}
                mode={GlitchMode.SPORADIC}
                ratio={0.85}
                active={glitchActive}
            />
            <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={new THREE.Vector2(0.001, 0.001)} 
                radialModulation={false}
                modulationOffset={0}
            />
            <Noise opacity={0.03} /> 
            */}
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
        </EffectComposer>
    )
}
