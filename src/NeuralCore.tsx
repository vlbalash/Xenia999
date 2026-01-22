import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'

export default function NeuralCore() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const materialRef = useRef<any>(null!)
    const scroll = useScroll()

    // Colors
    const color1 = new THREE.Color('#00ffff') // Cyan
    const color2 = new THREE.Color('#8a2be2') // Purple
    const color3 = new THREE.Color('#ff00ff') // Magenta/Pink for end

    useFrame((_state, delta) => {
        const offset = scroll.offset // 0 to 1

        // Rotation logic
        meshRef.current.rotation.x += delta * 0.2
        meshRef.current.rotation.y += delta * 0.3 + (offset * 2) // Spin faster as we scroll

        // 1. Color Transition (Hero -> Growth)
        // 0 to 0.5
        if (offset < 0.5) {
            materialRef.current.color.lerpColors(color1, color2, offset * 2)
            materialRef.current.distort = 0.4 + offset * 0.5
            materialRef.current.emissiveIntensity = 0.5
            meshRef.current.scale.setScalar(1) // Reset scale for this phase
        }

        // 2. Global Reach (Particle Cloud feeling)
        // We simulate this by increasing distortion and reducing scale or opacity
        // 0.5 to 0.75
        if (offset >= 0.5 && offset < 0.75) {
            const t = (offset - 0.5) * 4
            materialRef.current.color.lerp(color3, t)
            materialRef.current.distort = 0.6 + t * 0.4 // heavy distortion
            meshRef.current.scale.setScalar(1 + t * 0.5)
            materialRef.current.emissiveIntensity = 0.5
        }

        // 3. Implosion (Singularity)
        // 0.75 to 1.0
        if (offset >= 0.75) {
            const t = (offset - 0.75) * 4 // 0 to 1
            meshRef.current.scale.setScalar(1.5 * (1 - t) + 0.1) // Shrink to 0.1
            materialRef.current.emissiveIntensity = t * 20 // Glow bright
            materialRef.current.color.set('white')
        }
    })

    return (
        <group position={[0, 0, 0]}>
            {/* Inner Core */}
            <Sphere args={[1, 64, 64]} ref={meshRef}>
                <MeshDistortMaterial
                    ref={materialRef}
                    color="#00ffff"
                    distort={0.4}
                    speed={2}
                    emissive="#000000"
                />
            </Sphere>

            {/* Outer Wireframe / Particles could go here */}
        </group>
    )
}
