import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { Effects } from './Effects'
import { Asteroid } from './Asteroid'

import { ShootingGallery } from './ShootingGallery'

export default function Scene() {
    const [glitchActive, setGlitchActive] = useState(false)
    const cameraRef = useRef<THREE.Group>(null!)
    const scroll = useScroll()
    const explosionFiredRef = useRef(false)

    useFrame((state, delta) => {
        // Broadcast R3F scroll offset so DOM components can react to scroll
        window.dispatchEvent(new CustomEvent('scroll-offset', { detail: { offset: scroll.offset } }))

        // Dispatch explosion sound when asteroid explodes (scroll > 0.80)
        if (scroll.offset > 0.80 && !explosionFiredRef.current) {
            explosionFiredRef.current = true
            window.dispatchEvent(new CustomEvent('play-explosion-boom'))
        }
        if (scroll.offset < 0.75) {
            // Reset when user scrolls back up
            explosionFiredRef.current = false
        }

        // Automatically trigger glitchActive state so Overlay knows explosion is happening
        if (scroll.offset > 0.80 && !glitchActive) {
            setGlitchActive(true)
        } else if (scroll.offset < 0.75 && glitchActive) {
            setGlitchActive(false) 
        }

        // Rotate the entire camera group around 0,0,0 based on scroll
        const targetRotationY = -scroll.offset * (Math.PI * 2)

        if (cameraRef.current) {
            cameraRef.current.rotation.y = THREE.MathUtils.damp(cameraRef.current.rotation.y, targetRotationY, 4, delta)

            // Subtle idle camera drift
            state.camera.position.x = THREE.MathUtils.lerp(
                state.camera.position.x,
                Math.sin(state.clock.elapsedTime * 0.3) * 0.15,
                0.05
            )
            state.camera.position.y = THREE.MathUtils.lerp(
                state.camera.position.y,
                Math.cos(state.clock.elapsedTime * 0.2) * 0.1,
                0.05
            )
        }
    })

    return (
        <>
            <color attach="background" args={['#020205']} />

            {/* Minimal dramatic lighting */}
            <ambientLight intensity={0.1} />
            <spotLight position={[10, 10, 5]} angle={0.2} penumbra={1} intensity={1.5} color="#ff2200" />
            <spotLight position={[-10, -10, -5]} angle={0.25} penumbra={1} intensity={0.8} color="#ff4400" />
            <pointLight position={[0, 0, 2]} intensity={0.3} color="#ff0000" />

            {/* Camera Rig */}
            <group ref={cameraRef}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            </group>

            {/* The Asteroid handles its own interactive, scroll-linked explosion internally */}
            <Asteroid />

            {/* Falling plates shooting gallery */}
            <ShootingGallery />

            {/* Return the starry space background */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1.5} />

            <Effects glitchActive={glitchActive} />
        </>
    )
}

