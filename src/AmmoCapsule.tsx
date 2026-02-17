import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'
import { playWeaponSound } from './WeaponSystem'

const CAPSURE_COLORS = ['#00ffff', '#ff00ff', '#ffff00']

export default function AmmoCapsule({
    position,
    onCollect
}: {
    position: [number, number, number],
    onCollect: (id: number) => void
}) {
    const group = useRef<THREE.Group>(null!)
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(true)

    // Random ID for this capsule to determine its "Data Fragment" type
    const id = useMemo(() => Math.floor(Math.random() * 3), [])
    const color = CAPSURE_COLORS[id]

    useFrame((_, delta) => {
        if (!active || !group.current) return

        // Rotate
        group.current.rotation.y += delta * 1.5
        group.current.rotation.z += delta * 0.5
    })

    const handleHit = (e: any) => {
        e.stopPropagation()
        if (!active) return

        setActive(false)
        playWeaponSound('pistol', 'reload') // Use reload sound as feedback
        onCollect(id)

        // Spawn explosion particles (handled by parent logic or global event)
        window.dispatchEvent(new CustomEvent('bullet-impact', {
            detail: {
                point: e.point,
                normal: e.face.normal,
                color: color,
                shardCount: 15,
                shardSpeed: 0.5,
                shardSize: 2,
            }
        }))
    }

    if (!active) return null

    return (
        <Float speed={2} rotationIntensity={2} floatIntensity={1}>
            <group
                ref={group}
                position={position}
                onClick={handleHit}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                {/* Capsule Body */}
                <mesh>
                    <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={hovered ? 2 : 0.5}
                        roughness={0.2}
                        metalness={0.8}
                        wireframe={true}
                    />
                </mesh>

                {/* Inner Core */}
                <mesh scale={[0.8, 0.8, 0.8]}>
                    <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
                </mesh>

                {/* holographic rings */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.5, 0.02, 16, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                </mesh>

                {/* Label */}
                <Text
                    position={[0, 0.8, 0]}
                    fontSize={0.2}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    DATA
                </Text>
            </group>
        </Float>
    )
}
