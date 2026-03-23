import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars, Float, PerspectiveCamera, useScroll } from '@react-three/drei'
import NeuralCore from './NeuralCore'
import ParticleExplosion from './ParticleExplosion'
import * as THREE from 'three'
import Effects from './Effects'

interface SceneProps {
  briefingOpen: boolean;
  isCoreLightOn: boolean;
  onToggleCoreLight: () => void;
  sphereColorIndex: number;
}

export default function Scene({ briefingOpen, isCoreLightOn, onToggleCoreLight, sphereColorIndex }: SceneProps) {
    const scroll = useScroll()
    const { width } = useThree((state) => state.viewport)
    const isMobile = width < 7
    
    const xOffset = isMobile ? 0 : Math.min(2.5, width * 0.25)
    const yOffset = isMobile ? 1.5 : 0
    
    const cameraRef = useRef<THREE.Group>(null!)
    const starsRef = useRef<THREE.Group>(null!)
    const neuralCoreRef = useRef<THREE.Group>(null!)
    const animState = useRef({ explode: 0 })
    const pierceProgressRef = useRef(0)
    const animCompletedRef = useRef(false)
    const tensionTriggeredRef = useRef(false)
    const launchTriggeredRef = useRef(false)
    const impactTriggeredRef = useRef(false)
    const briefingTriggeredRef = useRef(false)
    const lastScrollBroadcast = useRef(-1)
    const prevBriefingOpen = useRef(briefingOpen)

    // When briefing closes: reset scroll to top + all animation triggers
    useEffect(() => {
        if (prevBriefingOpen.current && !briefingOpen) {
            // Scroll the ScrollControls overlay back to top
            if (scroll.el) scroll.el.scrollTop = 0
            // Reset all animation state so spheres start fresh
            animCompletedRef.current = false
            pierceProgressRef.current = 0
            animState.current.explode = 0
            tensionTriggeredRef.current = false
            launchTriggeredRef.current = false
            impactTriggeredRef.current = false
            briefingTriggeredRef.current = false
            lastScrollBroadcast.current = -1
        }
        prevBriefingOpen.current = briefingOpen
    }, [briefingOpen])

    useFrame((state, delta) => {
        // Broadcast scroll progress — throttled to avoid per-frame GC pressure
        if (Math.abs(scroll.offset - lastScrollBroadcast.current) > 0.002) {
            lastScrollBroadcast.current = scroll.offset
            window.dispatchEvent(new CustomEvent('scroll-progress', { detail: { offset: scroll.offset } }))
        }

        if (!briefingOpen) {
            // Camera stops rotating at 0.65 — ring is already formed, scene locks for pierce
            const rotationOffset = Math.min(scroll.offset, 0.65)
            const targetRotationY = -(rotationOffset / 0.65) * (Math.PI * 2)

            if (cameraRef.current) {
                cameraRef.current.rotation.y = THREE.MathUtils.damp(
                    cameraRef.current.rotation.y, targetRotationY, 4, delta
                )
            }

            // Animation logic for NeuralCore
            if (neuralCoreRef.current) {
                const offset = scroll.offset
                const animStart = 0.74

                // Lock when fully scrolled through, reset when back at top
                if (!animCompletedRef.current && offset >= 0.97) {
                    animCompletedRef.current = true
                } else if (animCompletedRef.current && offset < 0.05) {
                    animCompletedRef.current = false
                }

                // Reset triggers when scrolled back
                if (offset < 0.60) {
                    tensionTriggeredRef.current = false
                    launchTriggeredRef.current = false
                    impactTriggeredRef.current = false
                    briefingTriggeredRef.current = false
                }

                if (animCompletedRef.current) {
                    // NeuralCore stays disintegrated behind the ring
                    animState.current.explode = 1.0
                    pierceProgressRef.current = 1.0
                    neuralCoreRef.current.position.set(xOffset, -yOffset, -28)
                    neuralCoreRef.current.rotation.y = Math.PI * 3.5
                    neuralCoreRef.current.rotation.x = -0.45
                } else {
                    let coreX = -xOffset
                    let coreY = yOffset
                    let coreZ = 0
                    let explode = 0
                    let scaleX = 1, scaleY = 1, scaleZ = 1

                    const tensionStart = 0.65

                    if (offset > animStart) {
                        // Fire launch sound once
                        if (!launchTriggeredRef.current) {
                            window.dispatchEvent(new CustomEvent('play-launch-sound'))
                            launchTriggeredRef.current = true
                        }

                        const t = (offset - animStart) / (1.0 - animStart)

                        if (t < 0.3) {
                            // Jump arc: spring-loaded ease-in-out X + spinning tumble
                            const subT = t / 0.3
                            const easeX = subT * subT * (3 - 2 * subT)
                            coreX = THREE.MathUtils.lerp(-xOffset, xOffset, easeX)
                            const jumpArc = 1.8 * Math.sin(subT * Math.PI)
                            coreY = THREE.MathUtils.lerp(yOffset, -yOffset, subT) + jumpArc
                            // 1.75 rotations — lands at 270° (long axis aligned with Z = sharp end first)
                            neuralCoreRef.current.rotation.y = subT * Math.PI * 3.5
                            neuralCoreRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.45, subT)
                            // Spring release: scale pops back to 1 quickly
                            const pop = 1 - subT
                            scaleX = 1 + pop * 0.12
                            scaleY = 1 - pop * 0.08
                            scaleZ = 1 + pop * 0.12
                        } else {
                            // Impact moment — fires once when ball arrives at ring position
                            if (!impactTriggeredRef.current) {
                                impactTriggeredRef.current = true
                                window.dispatchEvent(new CustomEvent('particle-impact'))
                                window.dispatchEvent(new CustomEvent('play-impact-sound'))
                            }

                            // Pierce phase: clean Z flight + disintegration
                            const subT = (t - 0.3) / 0.7
                            const ease = subT * subT * (3 - 2 * subT)
                            coreX = xOffset
                            coreY = -yOffset
                            coreZ = THREE.MathUtils.lerp(0, -28.0, ease)
                            pierceProgressRef.current = subT
                            explode = Math.min(1.0, subT * 2.5)

                            // Open briefing when explosion is in full swing
                            if (subT >= 0.35 && !briefingTriggeredRef.current) {
                                briefingTriggeredRef.current = true
                                window.dispatchEvent(new CustomEvent('auto-open-briefing'))
                            }
                            neuralCoreRef.current.rotation.y = Math.PI * 3.5
                            neuralCoreRef.current.rotation.x = -0.45
                        }
                    } else if (offset >= tensionStart) {
                        // ── TENSION PHASE (0.65 → 0.74) ──
                        // Ball coils like a spring: squash Y, bulge X/Z, vibrate
                        const tp = (offset - tensionStart) / (animStart - tensionStart) // 0→1
                        const tpEased = tp * tp // slow start, builds up

                        scaleY = 1 - tpEased * 0.32
                        scaleX = 1 + tpEased * 0.20
                        scaleZ = 1 + tpEased * 0.20

                        // Vibration: amplitude grows with tension
                        const vib = Math.sin(state.clock.elapsedTime * 40) * tpEased * 0.04
                        coreX = -xOffset + vib
                        // Subtle downward sink (loading weight)
                        coreY = yOffset - tpEased * 0.12

                        pierceProgressRef.current = 0
                        neuralCoreRef.current.rotation.y = THREE.MathUtils.lerp(neuralCoreRef.current.rotation.y, 0, delta * 2.5)
                        neuralCoreRef.current.rotation.x = THREE.MathUtils.lerp(neuralCoreRef.current.rotation.x, 0, delta * 2.5)

                        // Fire tension sound once on entering zone
                        if (!tensionTriggeredRef.current) {
                            window.dispatchEvent(new CustomEvent('play-tension-sound'))
                            tensionTriggeredRef.current = true
                        }
                    } else {
                        pierceProgressRef.current = 0
                        neuralCoreRef.current.rotation.y = THREE.MathUtils.lerp(neuralCoreRef.current.rotation.y, 0, delta * 2.5)
                        neuralCoreRef.current.rotation.x = THREE.MathUtils.lerp(neuralCoreRef.current.rotation.x, 0, delta * 2.5)
                    }

                    animState.current.explode = explode
                    neuralCoreRef.current.position.set(coreX, coreY, coreZ)
                    neuralCoreRef.current.scale.set(scaleX, scaleY, scaleZ)
                }
            }

            // Premium pierce: smooth FOV rush (sense of speed, no shake)
            const pierce = pierceProgressRef.current
            const baseFov = isMobile ? 60 : 50
            const rushFov = baseFov + Math.sin(pierce * Math.PI) * 16
            const cam = state.camera as THREE.PerspectiveCamera
            cam.fov = THREE.MathUtils.lerp(cam.fov, rushFov, 0.1)
            state.camera.updateProjectionMatrix()

            // Camera drifts back to center cleanly — no random shake
            state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.08)
            state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, 0.08)
        }

        if (starsRef.current) {
            const warp = 1 + pierceProgressRef.current * Math.sin(pierceProgressRef.current * Math.PI) * 9
            starsRef.current.rotation.y += delta * 0.01 * warp
            starsRef.current.rotation.z += delta * 0.004 * warp
        }
    })

    return (
        <>
            <color attach="background" args={['#000000']} />

            <ambientLight intensity={0.05} />
            <directionalLight position={[5, 5, 5]} intensity={0.25} />
            <fog attach="fog" args={['#000000', 10, 40]} />

            {/* Camera Rig */}
            <group ref={cameraRef}>
                <PerspectiveCamera
                    makeDefault
                    position={[0, 0, isMobile ? 7 : 5]}
                    fov={isMobile ? 60 : 50}
                />
            </group>

            {/* Starscape — three layers, pure white, different depths */}
            <group ref={starsRef}>
                <Stars radius={200} depth={80} count={600} factor={0.9} saturation={0} fade speed={0.05} />
                <Stars radius={100} depth={50} count={300} factor={2.0} saturation={0} fade speed={0.12} />
                <Stars radius={55}  depth={25} count={100} factor={4.0} saturation={0} fade speed={0.25} />
            </group>

            {/* Spheres */}
            {!briefingOpen && (
                <group>
                    {/* Left: NeuralCore — no Float so the flight path is clean and precise */}
                    <group ref={neuralCoreRef} position={[-xOffset, yOffset, 0]}>
                        <NeuralCore
                            hasText={true}
                            basePosition={[0, 0, 0]}
                            isLightingEnabled={isCoreLightOn}
                            onToggleLight={onToggleCoreLight}
                            animState={animState}
                            sphereColorIndex={sphereColorIndex}
                        />
                    </group>
                    {/* Right: ParticleExplosion — gentle float, isolated from NeuralCore */}
                    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                        <group position={[xOffset, -yOffset, 0]}>
                            <ParticleExplosion colorIndex={sphereColorIndex} />
                        </group>
                    </Float>
                </group>
            )}

            <Effects />
        </>
    )
}
