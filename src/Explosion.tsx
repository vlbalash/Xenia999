import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 15000

const PALETTE = [
    [1.0, 0.9, 0.2], // Bright Amber (ENIA)
    [1.0, 0.6, 0.1], // Orange-Amber
    [0.96, 0.35, 0.06], // Deep Orange (#ea580c)
    [1.0, 0.8, 0.4], // Golden glow
    [1.0, 1.0, 1.0], // White hot center
    [0.3, 0.3, 0.3], // Gray smoke
    [0.1, 0.1, 0.1], // Dark ash
]

export const Explosion = ({ active, isBig = false }: { active: boolean; isBig?: boolean }) => {
    const meshRef = useRef<THREE.Points>(null!)
    const timeRef = useRef(0)
    const [phase, setPhase] = useState<0 | 1 | 2>(0) // 0=idle,1=bang,2=fade

    // Create a soft, fluffy circular texture for particles instead of square pixels
    const particleTexture = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        if (ctx) {
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
            gradient.addColorStop(0.2, 'rgba(139, 92, 246, 0.9)') // Purple glow
            gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)') // Green fringe
            gradient.addColorStop(0.8, 'rgba(20, 20, 30, 0.1)')
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 64, 64)
        }
        return new THREE.CanvasTexture(canvas)
    }, [])

    // Allocate typed arrays once
    const [positions, velocities, colors, sizes] = useMemo(() => {
        return [
            new Float32Array(PARTICLE_COUNT * 3),
            new Float32Array(PARTICLE_COUNT * 3),
            new Float32Array(PARTICLE_COUNT * 3),
            new Float32Array(PARTICLE_COUNT),
        ]
    }, [])

    const resetParticles = useCallback(() => {
        timeRef.current = 0

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // --- Ring / shell distribution for more dramatic shape ---
            const layer = Math.random()

            let r: number
            if (layer < 0.2) {
                // Dense core burst
                r = 0.01 + Math.random() * 0.05
            } else if (layer < 0.6) {
                // Mid shell
                r = 0.05 + Math.random() * 0.15
            } else {
                // Outer wisps
                r = 0.1 + Math.random() * 0.45
            }

            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const sx = Math.sin(phi) * Math.cos(theta)
            const sy = Math.sin(phi) * Math.sin(theta)
            const sz = Math.cos(phi)

            positions[i * 3] = sx * r
            positions[i * 3 + 1] = sy * r
            positions[i * 3 + 2] = sz * r

            // Speed proportional to layer — core is FAST
            // If isBig, core is EXPLOSIVE
            const speedScale = isBig 
                ? (layer < 0.2 ? 8.0 : layer < 0.6 ? 4.0 : 2.0)
                : (layer < 0.2 ? 3.5 : layer < 0.6 ? 1.8 : 0.8)
            const speed = (0.1 + Math.random() * 0.4) * speedScale

            velocities[i * 3] = sx * speed
            velocities[i * 3 + 1] = sy * speed + 0.02 // slight upward bias
            velocities[i * 3 + 2] = sz * speed

            // Color — hotter near core
            if (isBig) {
                // Vibrant ENIA neon colors instead of total random
                // Enia theme is orange: Hue around 0.05 to 0.15
                const h = 0.05 + Math.random() * 0.1
                const s = 0.9 + Math.random() * 0.1
                const l = 0.5 + Math.random() * 0.3
                const c = new THREE.Color().setHSL(h, s, l)
                colors[i * 3] = c.r
                colors[i * 3 + 1] = c.g
                colors[i * 3 + 2] = c.b
            } else {
                const c = PALETTE[Math.floor(Math.random() * (layer < 0.2 ? 2 : PALETTE.length))]
                colors[i * 3] = c[0]
                colors[i * 3 + 1] = c[1]
                colors[i * 3 + 2] = c[2]
            }

            // Varied particle sizes
            sizes[i] = (isBig ? 1.5 : 1.0) * (0.04 + Math.random() * 0.15)
        }

        if (meshRef.current) {
            const geom = meshRef.current.geometry
            geom.attributes.position.needsUpdate = true
            geom.attributes.color.needsUpdate = true
                ; (meshRef.current.material as THREE.PointsMaterial).opacity = 1
        }
    }, [positions, velocities, colors, sizes, isBig])

    useEffect(() => {
        if (active) {
            resetParticles()
            setPhase(1)
            const timer = setTimeout(() => setPhase(2), 3000)
            return () => clearTimeout(timer)
        } else {
            setPhase(0)
        }
    }, [active, resetParticles])

    useFrame((_, delta) => {
        if (phase === 0 || !meshRef.current) return
        timeRef.current += delta

        const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute
        const mat = meshRef.current.material as THREE.PointsMaterial
        const t = timeRef.current

        for (let i = 0; i < PARTICLE_COUNT; i++) {

            // Drag increases over time — fast initial bang, long slow trail
            const drag = Math.max(0.93, 0.985 - t * 0.003)

            velocities[i * 3] *= drag
            velocities[i * 3 + 1] *= drag
            velocities[i * 3 + 2] *= drag

            // Weak gravity pull
            velocities[i * 3 + 1] -= 0.0004

            posAttr.array[i * 3] += velocities[i * 3]
            posAttr.array[i * 3 + 1] += velocities[i * 3 + 1]
            posAttr.array[i * 3 + 2] += velocities[i * 3 + 2]
        }
        posAttr.needsUpdate = true

        if (phase === 2) {
            mat.opacity = Math.max(0, mat.opacity - delta * 0.35)
        }
    })

    if (phase === 0) return null

    return (
        <group position={[0, -0.5, 0]}>
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={PARTICLE_COUNT}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={PARTICLE_COUNT}
                        array={colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.4}
                    vertexColors
                    transparent
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                    sizeAttenuation
                    depthWrite={false}
                    map={particleTexture}
                />
            </points>
        </group>
    )
}
