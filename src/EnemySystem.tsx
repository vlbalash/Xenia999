import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Enemy from './Enemy'

export default function EnemySystem({ active }: { active: boolean }) {
    const [enemies, setEnemies] = useState<{ id: number, position: [number, number, number] }[]>([])
    const nextSpawnTime = useRef(0)

    useEffect(() => {
        if (!active) {
            setEnemies([])
            return
        }
    }, [active])

    useFrame((state) => {
        if (!active) return

        const time = state.clock.elapsedTime
        if (time > nextSpawnTime.current) {
            // Spawn enemy
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = 15 // Spawn radius

            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)

            setEnemies(prev => [...prev, { id: Date.now(), position: [x, y, z] }])

            // Decrease spawn interval over time? For now fixed
            nextSpawnTime.current = time + 2.0 // Every 2 seconds
        }
    })

    const handleDestroy = (id: number) => {
        setEnemies(prev => prev.filter(e => e.id !== id))
    }

    const handleCoreHit = () => {
        // Flash core red? Deduct points?
        // Dispatch event for NeuralCore to handle
        window.dispatchEvent(new Event('core-damage'))
    }

    if (!active) return null

    return (
        <group>
            {enemies.map(e => (
                <Enemy
                    key={e.id}
                    position={e.position}
                    onHitCore={handleCoreHit}
                    onDestroy={() => handleDestroy(e.id)}
                />
            ))}
        </group>
    )
}
