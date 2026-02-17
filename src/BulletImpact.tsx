import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ──────── Shard Particle (Moorhuhn-style explosion) ──────── */
interface Shard {
    position: THREE.Vector3
    velocity: THREE.Vector3
    rotation: THREE.Euler
    rotationSpeed: THREE.Vector3
    life: number
    maxLife: number
    size: number
    color: THREE.Color
}



const MAX_SHARDS = 300

export default function BulletImpact() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const shardsRef = useRef<Shard[]>([])
    const dummy = useRef(new THREE.Object3D())
    const colorRef = useRef(new THREE.Color())

    useEffect(() => {
        if (meshRef.current && !meshRef.current.instanceColor) {
            const colors = new Float32Array(MAX_SHARDS * 3)
            meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
        }
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            spawnShards(
                detail.point,
                detail.normal,
                detail.shardCount || 20,
                detail.shardSpeed || 1,
                detail.shardSize || 1,
                detail.color || '#00ffff'
            )
        }
        window.addEventListener('bullet-impact', handler)
        return () => window.removeEventListener('bullet-impact', handler)
    }, [])

    const spawnShards = (
        point: THREE.Vector3,
        normal: THREE.Vector3,
        count: number,
        speedMul: number,
        sizeMul: number,
        weaponColor: string
    ) => {

        for (let i = 0; i < count; i++) {
            const side = i < count * 0.6 ? 1 : -1
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
            ).normalize()

            const speed = (2.0 + Math.random() * 4.0) * speedMul
            const velocity = normal.clone()
                .multiplyScalar(side * speed)
                .add(spread.multiplyScalar((1.0 + Math.random() * 2.0) * speedMul))

            // Color: weapon color mixed with white sparks
            const color = new THREE.Color()
            if (Math.random() > 0.3) {
                // Slight hue variation around weapon color
                const c = new THREE.Color(weaponColor)
                const hsl = { h: 0, s: 0, l: 0 }
                c.getHSL(hsl)
                color.setHSL(hsl.h + (Math.random() - 0.5) * 0.1, 0.9, 0.6)
            } else {
                color.setHSL(0, 0, 0.9 + Math.random() * 0.1) // white sparks
            }

            shardsRef.current.push({
                position: point.clone().add(normal.clone().multiplyScalar(side * 0.05)),
                velocity,
                rotation: new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                ),
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15
                ),
                life: 0,
                maxLife: 0.4 + Math.random() * 0.6,
                size: (0.01 + Math.random() * 0.03) * sizeMul,
                color,
            })
        }

        if (shardsRef.current.length > MAX_SHARDS) {
            shardsRef.current = shardsRef.current.slice(-MAX_SHARDS)
        }
    }

    useFrame((_, delta) => {
        if (!meshRef.current) return

        const alive: Shard[] = []

        shardsRef.current.forEach((s) => {
            s.life += delta
            if (s.life >= s.maxLife) return

            // Physics: fast initial velocity, heavy drag, gravity
            s.velocity.y -= 3.0 * delta
            s.velocity.multiplyScalar(0.95)
            s.position.add(s.velocity.clone().multiplyScalar(delta))

            // Spinning shards
            s.rotation.x += s.rotationSpeed.x * delta
            s.rotation.y += s.rotationSpeed.y * delta
            s.rotation.z += s.rotationSpeed.z * delta

            const t = s.life / s.maxLife
            // Quick pop-in then shrink fast
            const popIn = Math.min(1, s.life * 20)
            const shrink = Math.pow(1 - t, 2)
            const scale = s.size * popIn * shrink

            dummy.current.position.copy(s.position)
            dummy.current.rotation.copy(s.rotation)
            // Elongated shard shape
            dummy.current.scale.set(scale * 0.4, scale * 1.5, scale * 0.4)
            dummy.current.updateMatrix()

            const i = alive.length
            meshRef.current.setMatrixAt(i, dummy.current.matrix)

            // Flash: whiter at start, colored as it fades
            colorRef.current.copy(s.color)
            if (t < 0.15) {
                colorRef.current.lerp(new THREE.Color('#ffffff'), 1 - t / 0.15)
            }
            meshRef.current.setColorAt(i, colorRef.current)

            alive.push(s)
        })

        // Hide unused
        for (let i = alive.length; i < MAX_SHARDS; i++) {
            dummy.current.position.set(0, -100, 0)
            dummy.current.scale.setScalar(0)
            dummy.current.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.current.matrix)
        }

        shardsRef.current = alive
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_SHARDS]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.95}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    )
}
