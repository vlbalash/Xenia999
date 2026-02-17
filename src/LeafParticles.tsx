import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LeafParticles = ({ active }: { active: boolean }) => {
    const particles = useRef<{ position: THREE.Vector3, velocity: THREE.Vector3, rotation: number }[]>([])
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const dummy = useRef(new THREE.Object3D())

    useEffect(() => {
        if (active && particles.current.length === 0) {
            // Spawn 420 leaves
            for (let i = 0; i < 420; i++) {
                particles.current.push({
                    position: new THREE.Vector3(
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 4
                    ),
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 0.5,
                        0.5 + Math.random() * 1.5, // float up
                        (Math.random() - 0.5) * 0.5
                    ),
                    rotation: Math.random() * Math.PI * 2
                })
            }
        }
    }, [active])

    useFrame((_state, delta) => {
        if (!meshRef.current || particles.current.length === 0) return

        particles.current.forEach((p, i) => {
            p.position.add(p.velocity.clone().multiplyScalar(delta))
            p.rotation += delta * 2

            // Reset if too high
            if (p.position.y > 5) {
                p.position.y = -5
                p.position.x = (Math.random() - 0.5) * 4
                p.position.z = (Math.random() - 0.5) * 4
            }

            dummy.current.position.copy(p.position)
            dummy.current.rotation.z = p.rotation
            dummy.current.rotation.y = p.rotation * 0.5
            dummy.current.scale.setScalar(0.2) // Leaf size
            dummy.current.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.current.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    if (!active) return null

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 420]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial transparent opacity={0.8} color="#42f569" side={THREE.DoubleSide} />
            {/* Ideally we'd map a texture here, but distinct green squares/leaves work for abstract style. 
                Optimally, we'd use 'Text' from drei for emojis but InstancedMesh + Text is tricky. 
                Simple geometry for particles is better for performance. */}
        </instancedMesh>
    )
}

export default LeafParticles
