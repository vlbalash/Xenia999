import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ──────── Drip Source ──────── */
interface DripSource {
    origin: THREE.Vector3
    hue: number
    spawnTimer: number
    intensity: number
}

/* ──────── Drip Particle ──────── */
interface DripParticle {
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
    maxLife: number
    size: number
    hue: number
    wobblePhase: number
    stretch: number
}

const MAX_PARTICLES = 400

export default function DrippingFluid() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const particlesRef = useRef<DripParticle[]>([])
    const sourcesRef = useRef<DripSource[]>([])
    const dummy = useRef(new THREE.Object3D())
    const colorRef = useRef(new THREE.Color())

    // Set up instanceColor on mount
    useEffect(() => {
        if (meshRef.current && !meshRef.current.instanceColor) {
            const colors = new Float32Array(MAX_PARTICLES * 3)
            meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
        }
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail

            sourcesRef.current.push({
                origin: detail.point.clone(),
                hue: detail.hue,
                spawnTimer: 0,
                intensity: Math.max(1, detail.shotCount - 9 + 1),
            })

            if (sourcesRef.current.length > 12) {
                sourcesRef.current = sourcesRef.current.slice(-12)
            }
        }
        window.addEventListener('start-dripping', handler)
        return () => window.removeEventListener('start-dripping', handler)
    }, [])

    const spawnDrip = (source: DripSource) => {
        const count = 1 + Math.floor(Math.random() * Math.min(3, source.intensity))
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                position: source.origin.clone().add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 0.1,
                        -0.05,
                        (Math.random() - 0.5) * 0.1
                    )
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    -(0.4 + Math.random() * 0.6),
                    (Math.random() - 0.5) * 0.2,
                ),
                life: 0,
                maxLife: 2.5 + Math.random() * 2.0,
                size: 0.025 + Math.random() * 0.035,
                hue: source.hue + (Math.random() - 0.5) * 30,
                wobblePhase: Math.random() * Math.PI * 2,
                stretch: 1.0 + Math.random() * 2.0,
            })
        }

        if (particlesRef.current.length > MAX_PARTICLES) {
            particlesRef.current = particlesRef.current.slice(-MAX_PARTICLES)
        }
    }

    useFrame((_, delta) => {
        if (!meshRef.current) return

        // Spawn from active sources
        sourcesRef.current.forEach((source) => {
            source.spawnTimer += delta
            const interval = Math.max(0.04, 0.25 / source.intensity)
            if (source.spawnTimer >= interval) {
                source.spawnTimer = 0
                spawnDrip(source)
            }
        })

        // Update particles
        const alive: DripParticle[] = []

        particlesRef.current.forEach((p) => {
            p.life += delta
            if (p.life >= p.maxLife) return

            // Physics
            p.velocity.y -= 1.5 * delta
            p.velocity.x *= 0.985
            p.velocity.z *= 0.985

            // Wobble
            p.wobblePhase += delta * 3.5
            p.position.x += Math.sin(p.wobblePhase) * 0.004
            p.position.z += Math.cos(p.wobblePhase * 0.7) * 0.004

            p.position.add(p.velocity.clone().multiplyScalar(delta))

            const t = p.life / p.maxLife
            const fadeIn = Math.min(1, p.life * 8)
            const fadeOut = 1 - t * t
            const scale = p.size * fadeIn * fadeOut

            // Stretch as it falls
            const stretchY = 1 + Math.abs(p.velocity.y) * p.stretch * 0.4

            dummy.current.position.copy(p.position)
            dummy.current.scale.set(scale, scale * stretchY, scale)
            dummy.current.updateMatrix()

            const i = alive.length
            meshRef.current.setMatrixAt(i, dummy.current.matrix)

            // Set color directly on instanceColor attribute
            colorRef.current.setHSL(
                ((p.hue % 360) + 360) % 360 / 360,
                0.85,
                0.5 + fadeOut * 0.2
            )
            meshRef.current.setColorAt(i, colorRef.current)

            alive.push(p)
        })

        // Hide unused instances
        for (let i = alive.length; i < MAX_PARTICLES; i++) {
            dummy.current.position.set(0, -100, 0)
            dummy.current.scale.setScalar(0)
            dummy.current.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.current.matrix)
        }

        particlesRef.current = alive
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.9}
                toneMapped={false}
            />
        </instancedMesh>
    )
}
