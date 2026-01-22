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
        if (!meshRef.current || !materialRef.current) return

        const offset = scroll.offset // 0 to 1

        // Mouse Interaction
        const targetX = state.pointer.y * 0.5
        const targetY = state.pointer.x * 0.5

        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetX + delta * 0.2, 4, delta)
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetY + delta * 0.3 + (offset * 2), 4, delta)

        // Continuous Transitions
        if (offset < 0.5) {
            // Hero -> Growth
            const t = offset * 2
            materialRef.current.color.lerpColors(color1, color2, t)
            materialRef.current.distort = THREE.MathUtils.lerp(0.4, 0.6, t)
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.5, 1.0, t)
            meshRef.current.scale.setScalar(1)
        } else if (offset < 0.8) {
            // Growth -> Global
            const t = (offset - 0.5) / 0.3
            materialRef.current.color.lerpColors(color2, color3, t)
            materialRef.current.distort = THREE.MathUtils.lerp(0.6, 1.0, t)
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(1.0, 2.0, t)
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 1.5, t))
        } else {
            // Singularity (Implosion)
            const t = (offset - 0.8) / 0.2
            materialRef.current.color.lerpColors(color3, new THREE.Color('white'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(1.0, 0.1, t)
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(2.0, 50.0, t)
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(1.5, 0.05, t))
        }

        // Hover effect overlay
        if (hovered) {
            materialRef.current.speed = 5
            materialRef.current.distort = 0.8 // Set instead of += to avoid accumulation

            // Subtle glitchy jitter
            meshRef.current.position.x = (Math.random() - 0.5) * 0.05
            meshRef.current.position.y = (Math.random() - 0.5) * 0.05
        } else {
            materialRef.current.speed = 2
            meshRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.1)
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
