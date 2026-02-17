import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ──────── Orbital particle around the NeuralCore ──────── */
interface OrbitParticle {
    angle: number          // current angle (radians)
    speed: number          // angular speed
    radius: number         // orbit radius
    tilt: number           // orbit plane tilt (radians)
    phase: number          // phase offset
    size: number
    y: number              // vertical offset oscillation phase
    scattered: number      // 0 = orbiting, 1 = scattered
}

const COUNT = 60

export default function OrbitalParticles() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const dummy = useRef(new THREE.Object3D())
    const colorRef = useRef(new THREE.Color())
    const particlesRef = useRef<OrbitParticle[]>([])
    const scatterRef = useRef(0) // 0 = calm, 1 = scattered
    const hueRef = useRef(0)

    // Initialize particles
    useEffect(() => {
        const particles: OrbitParticle[] = []
        for (let i = 0; i < COUNT; i++) {
            particles.push({
                angle: (Math.PI * 2 * i) / COUNT + Math.random() * 0.5,
                speed: 0.3 + Math.random() * 0.6,
                radius: 1.4 + Math.random() * 0.8,
                tilt: Math.random() * Math.PI,
                phase: Math.random() * Math.PI * 2,
                size: 0.008 + Math.random() * 0.015,
                y: Math.random() * Math.PI * 2,
                scattered: 0,
            })
        }
        particlesRef.current = particles

        // Initialize instanceColor
        if (meshRef.current && !meshRef.current.instanceColor) {
            const colors = new Float32Array(COUNT * 3)
            meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
        }
    }, [])

    // Listen for impacts to scatter
    useEffect(() => {
        const handler = () => {
            scatterRef.current = 1.0
        }
        window.addEventListener('bullet-impact', handler)
        return () => window.removeEventListener('bullet-impact', handler)
    }, [])

    // Track hue from NeuralCore
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (detail?.hue !== undefined) {
                hueRef.current = detail.hue
            }
        }
        window.addEventListener('start-dripping', handler)
        return () => window.removeEventListener('start-dripping', handler)
    }, [])

    useFrame((state, delta) => {
        if (!meshRef.current) return

        const time = state.clock.elapsedTime

        // Decay scatter
        scatterRef.current *= 0.96

        particlesRef.current.forEach((p, i) => {
            // Angular movement
            p.angle += p.speed * delta * (1 + scatterRef.current * 3)

            // Scatter: temporarily increase radius
            const scatterRadius = scatterRef.current * (1.5 + Math.random() * 0.5)
            const r = p.radius + scatterRadius

            // Elliptical orbit with tilt
            const x = Math.cos(p.angle) * r
            const z = Math.sin(p.angle) * r * 0.7  // elliptical
            const baseY = Math.sin(p.angle * 0.5 + p.y) * 0.4

            // Apply tilt rotation
            const cosT = Math.cos(p.tilt)
            const sinT = Math.sin(p.tilt)
            const finalX = x * cosT - baseY * sinT
            const finalY = x * sinT + baseY * cosT
            const finalZ = z

            dummy.current.position.set(finalX, finalY, finalZ)

            // Twinkle: oscillating scale
            const twinkle = 0.7 + Math.sin(time * 4 + p.phase) * 0.3
            const scatterScale = 1 + scatterRef.current * 2
            dummy.current.scale.setScalar(p.size * twinkle * scatterScale)

            dummy.current.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.current.matrix)

            // Color: base cyan with hue shift matching NeuralCore
            const hue = ((hueRef.current + i * 3) % 360) / 360
            const saturation = 0.8 + Math.sin(time * 2 + p.phase) * 0.2
            colorRef.current.setHSL(hue || (0.5 + i * 0.005), saturation, 0.65)
            meshRef.current.setColorAt(i, colorRef.current)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.9}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    )
}
