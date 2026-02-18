import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Float, PerspectiveCamera } from '@react-three/drei'
import NeuralCore from './NeuralCore'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'
import { Effects } from './Effects'
import { Explosion } from './Explosion'

import RedButton from './RedButton'

export default function Scene({ glitchActive, toggleGlitch }: { glitchActive: boolean, toggleGlitch: () => void }) {
    const scroll = useScroll()
    const cameraRef = useRef<THREE.Group>(null!)

    useFrame((state, delta) => {
        // Rotate the entire camera group around 0,0,0
        const targetRotationY = -scroll.offset * (Math.PI * 2)

        if (cameraRef.current) {
            cameraRef.current.rotation.y = THREE.MathUtils.damp(cameraRef.current.rotation.y, targetRotationY, 4, delta)

            // Subtle hover movement for camera
            state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, Math.sin(state.clock.elapsedTime * 0.5) * 0.1, 0.1)
            state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, Math.cos(state.clock.elapsedTime * 0.5) * 0.1, 0.1)
        }
    })

    return (
        <>
            <color attach="background" args={['#050505']} />

            {/* Lights - Refined for more drama */}
            <ambientLight intensity={0.2} />
            <spotLight position={[20, 20, 10]} angle={0.15} penumbra={1} intensity={2} color="#00ffff" castShadow />
            <spotLight position={[-20, -10, -10]} angle={0.2} penumbra={1} intensity={1.5} color="#ec4899" />
            <pointLight position={[0, 0, 0]} intensity={0.5} color="white" />

            {/* Fog for depth - tighter for more "atmosphere" */}
            <fog attach="fog" args={['#050505', 3, 20]} />

            {/* Camera Rig Group */}
            <group ref={cameraRef}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            </group>

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <NeuralCore />
            </Float>
            <RedButton active={glitchActive} onClick={toggleGlitch} />
            <Explosion active={glitchActive} />
            <Effects glitchActive={glitchActive} />
        </>
    )
}
