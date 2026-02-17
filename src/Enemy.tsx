import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EnemyProps {
    position: [number, number, number]
    onHitCore: () => void
    onDestroy: () => void
}

export default function Enemy({ position, onHitCore, onDestroy }: EnemyProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [dead, setDead] = useState(false)
    const speed = useRef(0.5 + Math.random() * 0.5) // Random speed

    useFrame((_state, delta) => {
        if (dead || !meshRef.current) return

        // Move towards 0,0,0
        const items = meshRef.current.position
        const target = new THREE.Vector3(0, 0, 0)
        const direction = target.sub(items).normalize()

        meshRef.current.position.add(direction.multiplyScalar(speed.current * delta))

        // Rotate randomly
        meshRef.current.rotation.x += delta
        meshRef.current.rotation.y += delta

        // Check distance to core (assuming core radius is ~1.5)
        if (meshRef.current.position.length() < 1.5) {
            onHitCore()
            setDead(true)
            onDestroy()
        }
    })

    const handlePointerOver = () => {
        document.body.style.cursor = 'crosshair'
        window.dispatchEvent(new Event('crosshair-target-in'))
    }

    const handlePointerOut = () => {
        document.body.style.cursor = 'none'
        window.dispatchEvent(new Event('crosshair-target-out'))
    }

    const handleClick = (e: any) => {
        e.stopPropagation()
        // Simple 1-hit kill for now
        setDead(true)
        window.dispatchEvent(new CustomEvent('play-weapon-sound', { detail: { type: 'enemy-death' } })) // Placeholder
        onDestroy()

        // Visual flair on death (particle explosion)
        window.dispatchEvent(new CustomEvent('enemy-death', {
            detail: { position: meshRef.current.position.clone() }
        }))
    }

    if (dead) return null

    return (
        <mesh
            ref={meshRef}
            position={position}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            userData={{ type: 'enemy' }} // For raycasting if needed
        >
            <icosahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial
                color="#ff0040"
                emissive="#ff0040"
                emissiveIntensity={2}
                roughness={0.2}
                metalness={0.8}
            />
        </mesh>
    )
}
