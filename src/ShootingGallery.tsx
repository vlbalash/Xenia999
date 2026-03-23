import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Plate {
    id: number
    position: THREE.Vector3
    velocity: THREE.Vector3   // horizontal flight velocity
    scale: number
    color: string
    hp: number
    age: number               // time alive in seconds
}


// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ShootingGallery() {
    const [renderPlates, setRenderPlates] = useState<Plate[]>([])
    const [, setScoreTick] = useState(0) // used for discount unlock threshold sync
    const [ammo, setAmmo] = useState(6)
    const [isReloading, setIsReloading] = useState(false)

    // Plate data lives in a mutable ref — never stale in useFrame
    const platesRef = useRef<Plate[]>([])
    const meshMap = useRef<Map<number, THREE.Mesh>>(new Map())

    const ammoRef = useRef(6)
    const scoreRef = useRef(0)
    const isReloadingRef = useRef(false)
    const discountFiredRef = useRef(false)

    const chargeStartRef = useRef<number | null>(null)
    const isChargingRef = useRef(false)
    const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const scroll = useScroll()
    const { camera } = useThree()
    const lastSpawnRef = useRef(0)
    const lastRenderSyncRef = useRef(0)
    const lastHUDRef = useRef(0)

    useEffect(() => { ammoRef.current = ammo }, [ammo])
    useEffect(() => { isReloadingRef.current = isReloading }, [isReloading])

    // -----------------------------------------------------------------------
    // Game loop
    // -----------------------------------------------------------------------
    useFrame((state, delta) => {
        const now = state.clock.elapsedTime
        const offset = scroll.offset  // 0..1

        // ── SPAWN: only in explosion zone (bottom scroll ~0.78–1.0) ─────────
        const inFireworkZone = offset > 0.78
        const CAP = 5 // Fewer plates for horizontal flight
        const spawnInterval = Math.max(0.8, 2.0 - scoreRef.current / 2000)

        if (inFireworkZone && now - lastSpawnRef.current > spawnInterval && platesRef.current.length < CAP) {
            // Spawn on either far left or far right
            const isLeft = Math.random() > 0.5
            const startX = isLeft ? -15.0 : 15.0 // Way off screen
            const startY = (Math.random() - 0.5) * 8.0 // Spread vertically
            const startZ = -4.0 - Math.random() * 4.0 // Varying depth behind asteroid

            // Fly horizontally across the screen
            const vx = isLeft ? (3.0 + Math.random() * 4.0) : -(3.0 + Math.random() * 4.0)
            const vy = 0 // Base Y velocity is 0, we'll add sine wave in move loop
            const vz = 0

            const colors = ['#ffffff', '#e0e0ff', '#ffe0f0', '#c0e8ff', '#fff0c0', '#ffeb3b', '#4caf50', '#f44336']
            const color = colors[Math.floor(Math.random() * colors.length)]

            platesRef.current.push({
                id: Date.now() + Math.random(),
                position: new THREE.Vector3(startX, startY, startZ),
                velocity: new THREE.Vector3(vx, vy, vz),
                scale: 0.3 + Math.random() * 0.5, // Slightly larger
                color,
                hp: 1,
                age: 0,
            })
            window.dispatchEvent(new Event('play-launch-sound'))
            lastSpawnRef.current = now
        }

        // ── MOVE with horizontal flight and sine bobbing ────────────────────

        platesRef.current = platesRef.current.filter(p => {
            p.age += delta
            
            p.position.x += p.velocity.x * delta
            // Sine wave bobbing instead of gravity
            p.position.y += Math.sin(p.age * 3.0 + p.id) * 2.0 * delta
            
            p.position.z += p.velocity.z * delta

            const mesh = meshMap.current.get(p.id)
            if (mesh) {
                mesh.position.copy(p.position)
            }

            // Kill when they fly far off screen horizontally or exist too long
            return Math.abs(p.position.x) < 25.0 && p.age < 15
        })

        // ── Sync to React (20fps) ────────────────────────────────────────────
        if (now - lastRenderSyncRef.current > 0.05) {
            lastRenderSyncRef.current = now
            setRenderPlates(platesRef.current.map(p => ({ ...p, position: p.position.clone(), velocity: p.velocity.clone() })))
        }

        // ── HUD dispatch (15fps) ─────────────────────────────────────────────
        if (now - lastHUDRef.current > 0.066) {
            lastHUDRef.current = now
            window.dispatchEvent(new CustomEvent('gallery-update', {
                detail: { score: scoreRef.current, ammo: ammoRef.current, isReloading: isReloadingRef.current }
            }))
        }
    })

    // -----------------------------------------------------------------------
    // Shooting helpers
    // -----------------------------------------------------------------------
    const getCharge = useCallback(() => {
        if (!chargeStartRef.current) return 0
        return Math.min(1, (Date.now() - chargeStartRef.current) / 1500)
    }, [])

    const handleReload = useCallback(() => {
        if (isReloadingRef.current) return
        isReloadingRef.current = true
        setIsReloading(true)
        window.dispatchEvent(new Event('play-reload'))
        setTimeout(() => {
            ammoRef.current = 6
            setAmmo(6)
            isReloadingRef.current = false
            setIsReloading(false)
        }, 2000)
    }, [])

    // Convert 3D plate position to screen coords for DOM burst
    const plateToScreen = useCallback((plate: Plate) => {
        const v = plate.position.clone().project(camera)
        const x = (v.x * 0.5 + 0.5) * window.innerWidth
        const y = (-v.y * 0.5 + 0.5) * window.innerHeight
        return { x, y }
    }, [camera])

    const applyHit = useCallback((hitId: number, charge: number) => {
        const idx = platesRef.current.findIndex(p => p.id === hitId)
        if (idx === -1) return

        const plate = platesRef.current[idx]
        const screenPos = plateToScreen(plate)

        // Kill the plate
        platesRef.current.splice(idx, 1)
        meshMap.current.delete(hitId)

        window.dispatchEvent(new CustomEvent('play-plasma-break', { detail: { armored: false } }))
        const bonus = Math.round(100 + charge * 200)
        scoreRef.current += bonus
        const currentScore = scoreRef.current
        setScoreTick(s => s + 1) // Force re-render if needed or just sync HUD
        
        if (currentScore >= 999 && !discountFiredRef.current) {
            discountFiredRef.current = true
            window.dispatchEvent(new Event('discount-unlocked'))
        }

        // Dispatch DOM burst event — handled by BurstOverlay outside Canvas
        window.dispatchEvent(new CustomEvent('burst-particle', {
            detail: { id: Date.now(), x: screenPos.x, y: screenPos.y }
        }))

        // Siphon data for journal reward
        window.dispatchEvent(new CustomEvent('siphon-data', {
            detail: { 
                id: hitId, 
                message: `TARGET_0X${hitId.toString(16).toUpperCase()}_SIPHONED`,
                color: plate.color
            }
        }))
    }, [plateToScreen])

    const fireShot = useCallback((hitId?: number) => {
        if (ammoRef.current <= 0 || isReloadingRef.current) {
            window.dispatchEvent(new Event('play-dry-fire'))
            return
        }
        const charge = getCharge()
        chargeStartRef.current = null
        isChargingRef.current = false
        if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current)

        window.dispatchEvent(new Event('play-charge-stop'))
        window.dispatchEvent(new CustomEvent('laser-beam', { detail: { charge } }))
        window.dispatchEvent(new CustomEvent('play-plasma-shot', { detail: { charge } }))
        window.dispatchEvent(new Event('gallery-shot-flash'))

        if (hitId !== undefined) applyHit(hitId, charge)

        ammoRef.current -= 1
        setAmmo(prev => {
            const next = prev - 1
            if (next <= 0) handleReload()
            return Math.max(0, next)
        })
    }, [getCharge, handleReload, applyHit])

    const startCharge = useCallback((plateId?: number) => {
        if (ammoRef.current <= 0 || isReloadingRef.current) {
            window.dispatchEvent(new Event('play-dry-fire'))
            return
        }
        chargeStartRef.current = Date.now()
        isChargingRef.current = true
        if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current)
        chargeTimerRef.current = setTimeout(() => {
            if (isChargingRef.current) fireShot(plateId)
        }, 1600)
    }, [fireShot])

    return (
        <group
            onPointerDown={(e) => { e.stopPropagation(); startCharge(undefined) }}
            onPointerUp={(e) => { e.stopPropagation(); if (isChargingRef.current) fireShot(undefined) }}
            onPointerMissed={() => { if (isChargingRef.current) fireShot(undefined) }}
        >
            {/* Invisible catch plane at back */}
            <mesh position={[0, 0, -5]} visible={false}>
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {renderPlates.map(plate => (
                <PlateDisc
                    key={plate.id}
                    plate={plate}
                    onMeshReady={(mesh) => meshMap.current.set(plate.id, mesh)}
                    onPointerDown={() => startCharge(plate.id)}
                    onPointerUp={() => { if (isChargingRef.current) fireShot(plate.id) }}
                />
            ))}
        </group>
    )
}

// ---------------------------------------------------------------------------
// Round plate disc (thin cylinder = disc)
// ---------------------------------------------------------------------------
function PlateDisc({
    plate,
    onMeshReady,
    onPointerDown,
    onPointerUp,
}: {
    plate: Plate
    onMeshReady: (mesh: THREE.Mesh) => void
    onPointerDown: () => void
    onPointerUp: () => void
}) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useEffect(() => {
        if (meshRef.current) onMeshReady(meshRef.current)
    }, [onMeshReady])

    useFrame((_, delta) => {
        if (!meshRef.current) return
        // Spin on z-axis like a real flying disc
        meshRef.current.rotation.z += delta * 4
        meshRef.current.rotation.x += delta * 1.5
    })

    return (
        <group
            position={[plate.position.x, plate.position.y, plate.position.z]}
            scale={plate.scale}
        >
            <mesh ref={meshRef}>
                {/* Thin cylinder = round disc/plate */}
                <cylinderGeometry args={[1, 1, 0.08, 40]} />
                <meshStandardMaterial
                    color={plate.color}
                    emissive={plate.color}
                    emissiveIntensity={0.6}
                    metalness={0.9}
                    roughness={0.08}
                    transparent
                    opacity={0.95}
                />
            </mesh>
            
            {/* Invisible Hitbox (much larger, spherical, forgiving) */}
            <mesh
                visible={false}
                onPointerDown={(e) => { e.stopPropagation(); onPointerDown() }}
                onPointerUp={(e) => { e.stopPropagation(); onPointerUp() }}
            >
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    )
}
