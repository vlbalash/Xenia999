import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Float, PerspectiveCamera } from '@react-three/drei'
import NeuralCore from './NeuralCore'
import ParticleExplosion from './ParticleExplosion'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'
import Effects from './Effects'

export default function Scene() {
    const scroll = useScroll()
    const cameraRef = useRef<THREE.Group>(null!)

    useFrame((_state, delta) => {
        // A simple rig that moves the camera based on scroll
        // The content is 4 pages long.
        // r1: 0-0.25 (Hero)
        // r2: 0.25-0.5 (Growth)
        // r3: 0.5-0.75 (Global)
        // r4: 0.75-1.0 (CTA)

        // Camera Logic (Example)
        // Move camera Y position down as we scroll? 
        // Or rotate around the center?

        // Rotate the entire camera group around 0,0,0
        const targetRotationY = -scroll.offset * (Math.PI * 2)
        // Smooth damp
        // state.camera.position.z ... ?
        // easier: rotate a group holding the camera
        if (cameraRef.current) {
            cameraRef.current.rotation.y = THREE.MathUtils.damp(cameraRef.current.rotation.y, targetRotationY, 4, delta)
        }
    })

    return (
        <>
            <color attach="background" args={['#050505']} />

            {/* Lights */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="cyan" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="purple" />

            {/* Fog for depth */}
            <fog attach="fog" args={['#050505', 5, 20]} />

            {/* Camera Rig Group */}
            <group ref={cameraRef}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            </group>

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <NeuralCore />
                <ParticleExplosion />
            </Float>
            <Effects />
        </>
    )
}
