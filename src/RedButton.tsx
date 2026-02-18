import { useState, useRef } from 'react'
import { Text, Float, useScroll } from '@react-three/drei'
import { useSpring, animated, config } from '@react-spring/three'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RedButtonProps {
    onClick: () => void
    active: boolean
}

export default function RedButton({ onClick, active }: RedButtonProps) {
    const [hovered, setHover] = useState(false)
    const groupRef = useRef<THREE.Group>(null!)
    const glowRef = useRef<THREE.PointLight>(null!)
    const scroll = useScroll()

    const { scale, emissiveIntensity } = useSpring({
        scale: hovered ? 1.3 : 1,
        emissiveIntensity: hovered ? 5 : active ? 3 : 1,
        config: active ? config.stiff : config.wobbly
    })

    // Only show when scrolled near the bottom + pulsing glow
    useFrame((state, delta) => {
        if (glowRef.current) {
            glowRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 3) * 1.5
        }

        if (groupRef.current) {
            // Show when scroll offset > 0.85 (safe zone)
            const visible = active || scroll.offset > 0.85
            // Target Y = -0.5 (High up, just below center)
            const targetY = visible ? -0.5 : -10

            // Base scale 0.35 (approx 1/3 of original size)
            const currentScale = visible ? 0.35 : 0

            groupRef.current.position.y = THREE.MathUtils.damp(
                groupRef.current.position.y, targetY, 4, delta
            )

            // Apply scale damp
            groupRef.current.scale.setScalar(
                THREE.MathUtils.damp(groupRef.current.scale.x, currentScale, 4, delta)
            )

            // Keep button facing the camera by matching camera rig rotation
            const cameraAngle = -scroll.offset * Math.PI * 2
            groupRef.current.rotation.y = THREE.MathUtils.damp(
                groupRef.current.rotation.y, cameraAngle, 4, delta
            )
            const radius = 3.5
            const targetX = Math.sin(cameraAngle) * radius
            const targetZ = Math.cos(cameraAngle) * radius
            groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4, delta)
            groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 4, delta)
        }
    })

    return (
        <group ref={groupRef} position={[0, -10, 0]}>
            <group
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
                    {/* Glow light */}
                    <pointLight
                        ref={glowRef}
                        position={[0, 0.3, 0]}
                        color={active ? "#ff3333" : "#aa0000"}
                        intensity={2}
                        distance={5}
                        decay={2}
                    />

                    {/* Button Base */}
                    <mesh position={[0, -0.1, 0]}>
                        <cylinderGeometry args={[0.7, 0.8, 0.25, 32]} />
                        <meshStandardMaterial color="#1a1a1a" metalness={0.95} roughness={0.05} />
                    </mesh>

                    {/* Button Ring */}
                    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.65, 0.04, 16, 64]} />
                        <meshStandardMaterial
                            color="#ff4444"
                            emissive="#ff0000"
                            emissiveIntensity={1.5}
                            toneMapped={false}
                        />
                    </mesh>

                    {/* Button Top */}
                    <animated.mesh position={[0, 0.1, 0]} scale={scale}>
                        <cylinderGeometry args={[0.55, 0.55, 0.25, 32]} />
                        <animated.meshStandardMaterial
                            color={active ? "#ff0000" : "#cc0000"}
                            emissive={active ? "#ff0000" : "#aa0000"}
                            emissiveIntensity={emissiveIntensity}
                            toneMapped={false}
                        />
                    </animated.mesh>

                    {/* Warning Text */}
                    <Text
                        position={[0, 0.5, 0]}
                        fontSize={0.12}
                        color="white"
                        font="https://fonts.gstatic.com/s/orbitron/v25/yMJRMIlzdpvBhQQL_Qq7dys.woff"
                        textAlign="center"
                        maxWidth={1.5}
                        anchorY="bottom"
                    >
                        {active ? "BOOM" : "DON'T\nPRESS"}
                    </Text>
                </Float>
            </group>
        </group>
    )
}
