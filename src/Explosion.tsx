import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const Explosion = ({ active }: { active: boolean }) => {
    const meshRef = useRef<THREE.Points>(null!)
    const particleCount = 800
    const [phase, setPhase] = useState(0) // 0=idle, 1=exploding, 2=fading

    const [positions, velocities, colors] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3)
        const vel = new Float32Array(particleCount * 3)
        const col = new Float32Array(particleCount * 3)
        return [pos, vel, col]
    }, [])

    const resetParticles = useCallback(() => {
        const palette = [
            [1.0, 0.1, 0.0],
            [1.0, 0.4, 0.0],
            [1.0, 0.8, 0.0],
            [1.0, 1.0, 1.0],
            [1.0, 0.0, 0.3],
        ]

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = 0.05 + Math.random() * 0.2

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = r * Math.cos(phi)

            const speed = 0.1 + Math.random() * 0.35
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 0.03
            velocities[i * 3 + 2] = Math.cos(phi) * speed

            const c = palette[Math.floor(Math.random() * palette.length)]
            colors[i * 3] = c[0]
            colors[i * 3 + 1] = c[1]
            colors[i * 3 + 2] = c[2]
        }

        if (meshRef.current) {
            const geom = meshRef.current.geometry
            geom.attributes.position.needsUpdate = true
            geom.attributes.color.needsUpdate = true
            const mat = meshRef.current.material as THREE.PointsMaterial
            mat.opacity = 1
        }
    }, [positions, velocities, colors])

    useEffect(() => {
        if (active) {
            resetParticles()
            setPhase(1)
            const timer = setTimeout(() => setPhase(2), 2500)
            return () => clearTimeout(timer)
        } else {
            setPhase(0)
        }
    }, [active, resetParticles])

    useFrame((_, delta) => {
        if (phase === 0 || !meshRef.current) return

        const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute
        const mat = meshRef.current.material as THREE.PointsMaterial

        for (let i = 0; i < particleCount; i++) {
            posAttr.array[i * 3] += velocities[i * 3]
            posAttr.array[i * 3 + 1] += velocities[i * 3 + 1]
            posAttr.array[i * 3 + 2] += velocities[i * 3 + 2]

            velocities[i * 3 + 1] -= 0.001
            velocities[i * 3] *= 0.975
            velocities[i * 3 + 1] *= 0.975
            velocities[i * 3 + 2] *= 0.975
        }
        posAttr.needsUpdate = true

        if (phase === 2) {
            mat.opacity = Math.max(0, mat.opacity - delta * 0.4)
        }
    })

    if (phase === 0) return null

    return (
        <group position={[0, -0.5, 0]}>
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particleCount}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={particleCount}
                        array={colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.08}
                    vertexColors
                    transparent
                    opacity={1}
                    blending={THREE.AdditiveBlending}
                    sizeAttenuation
                    depthWrite={false}
                />
            </points>
        </group>
    )
}
