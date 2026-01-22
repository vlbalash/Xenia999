import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, useScroll } from '@react-three/drei'
import * as THREE from 'three'

export default function NeuralCore() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const materialRef = useRef<any>(null!)
    const scroll = useScroll()

    // Colors
    const color1 = new THREE.Color('#00ffff') // Cyan
    const color2 = new THREE.Color('#8a2be2') // Purple
    const color3 = new THREE.Color('#ff00ff') // Magenta/Pink for end

    useFrame((state, delta) => {
        const offset = scroll.offset // 0 to 1

        // Mouse Interaction
        const targetX = state.pointer.y * 0.5
        const targetY = state.pointer.x * 0.5

        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetX + delta * 0.2, 4, delta)
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetY + delta * 0.3 + (offset * 2), 4, delta)

        // 1. Color Transition (Hero -> Growth)
        if (offset < 0.5) {
            materialRef.current.color.lerpColors(color1, color2, offset * 2)
            materialRef.current.distort = 0.4 + offset * 0.5
            materialRef.current.emissiveIntensity = 0.5
            meshRef.current.scale.setScalar(1)
        }

        // 2. Global Reach
        if (offset >= 0.5 && offset < 0.75) {
            const t = (offset - 0.5) * 4
            materialRef.current.color.lerp(color3, t)
            materialRef.current.distort = 0.6 + t * 0.4
            meshRef.current.scale.setScalar(1 + t * 0.5)
            materialRef.current.emissiveIntensity = 0.5
        }

        // 3. Implosion (Singularity)
        if (offset >= 0.75) {
            const t = (offset - 0.75) * 4
            meshRef.current.scale.setScalar(1.5 * (1 - t) + 0.1)
            materialRef.current.emissiveIntensity = t * 20
            materialRef.current.color.set('white')
        }

        // Hover effect
        if (hovered) {
            materialRef.current.speed = 5
            materialRef.current.distort = 0.8
        } else {
            materialRef.current.speed = 2
        }
    })

    const [hovered, setHover] = useState(false)

    return (
        <Sphere
            args={[1, 64, 64]}
            ref={meshRef}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <MeshDistortMaterial
                ref={materialRef}
                color="#00ffff"
                distort={0.4}
                speed={2}
                emissive="#000000"
            />
        </Sphere>
    )
}
