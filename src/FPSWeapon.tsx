import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCurrentWeapon, onWeaponChange, type WeaponDef } from './WeaponSystem'

/* ──────── Procedural Weapon Models ──────── */

const PistolModel = ({ color }: { color: string }) => (
    <group>
        {/* Body */}
        <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.1, 0.15, 0.4]} />
            <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Grip */}
        <mesh position={[0, -0.1, 0.3]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.09, 0.2, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0.05, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
            <meshStandardMaterial color="#333" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* Glow strip */}
        <mesh position={[0, 0.08, 0.2]}>
            <boxGeometry args={[0.02, 0.01, 0.3]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
    </group>
)

const ShotgunModel = ({ color }: { color: string }) => (
    <group>
        {/* Body */}
        <mesh position={[0, 0, 0.3]}>
            <boxGeometry args={[0.18, 0.12, 0.5]} />
            <meshStandardMaterial color="#333" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Barrels */}
        <mesh position={[-0.04, 0.02, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.6, 16]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.04, 0.02, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.6, 16]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Pump */}
        <mesh position={[0, -0.04, -0.1]}>
            <boxGeometry args={[0.12, 0.06, 0.3]} />
            <meshStandardMaterial color="#0f0f0f" roughness={0.9} />
        </mesh>
        {/* Holographic Sight */}
        <mesh position={[0, 0.07, 0.3]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
    </group>
)

const LaserModel = ({ color }: { color: string }) => (
    <group>
        {/* Main Body */}
        <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.08, 0.1, 0.6]} />
            <meshStandardMaterial color="#fff" roughness={0.1} metalness={0.1} />
        </mesh>
        {/* Emitter Prisms */}
        <mesh position={[0, 0, -0.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.06, 0.06, 0.4]} />
            <meshStandardMaterial color="#eee" roughness={0.2} />
        </mesh>
        {/* Core */}
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {/* Fins */}
        <mesh position={[0.05, 0, 0.3]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.02, 0.15, 0.4]} />
            <meshStandardMaterial color="#ccc" />
        </mesh>
        <mesh position={[-0.05, 0, 0.3]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.02, 0.15, 0.4]} />
            <meshStandardMaterial color="#ccc" />
        </mesh>
    </group>
)

const RailgunModel = ({ color }: { color: string }) => (
    <group>
        {/* Stock */}
        <mesh position={[0, -0.1, 0.5]}>
            <boxGeometry args={[0.15, 0.2, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        {/* Rails */}
        <mesh position={[0.08, 0, -0.2]}>
            <boxGeometry args={[0.04, 0.1, 1.2]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[-0.08, 0, -0.2]}>
            <boxGeometry args={[0.04, 0.1, 1.2]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Energy Field (Oscillating scale via animation) */}
        <mesh position={[0, 0, -0.2]} scale={[1, 0.1, 1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.8} />
        </mesh>
        {/* Coils */}
        <group position={[0, 0, -0.6]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.12, 0.01, 8, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
        <group position={[0, 0, -0.3]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.12, 0.01, 8, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    </group>
)

/* ──────── Main FPS Weapon Component ──────── */

export default function FPSWeapon() {
    const groupRef = useRef<THREE.Group>(null!)
    const muzzleRef = useRef<THREE.PointLight>(null!)
    const [weapon, setWeapon] = useState<WeaponDef>(getCurrentWeapon())

    // Animation state
    const recoil = useRef({ x: 0, z: 0 })
    const sway = useRef({ x: 0, y: 0 })
    const muzzleFlash = useRef(0)

    useEffect(() => {
        const unsub = onWeaponChange(setWeapon)

        const onShoot = () => {
            // Recoil kick
            recoil.current.z += 0.4
            recoil.current.x += 0.2
            // Muzzle flash
            muzzleFlash.current = 1.0
        }

        window.addEventListener('bullet-impact', onShoot)
        return () => {
            unsub()
            window.removeEventListener('bullet-impact', onShoot)
        }
    }, [])

    useFrame((state, delta) => {
        if (!groupRef.current) return

        // 1. Mouse Sway (lag behind pointer)
        const targetSwayX = -state.pointer.x * 0.2
        const targetSwayY = -state.pointer.y * 0.2
        sway.current.x = THREE.MathUtils.lerp(sway.current.x, targetSwayX, delta * 4)
        sway.current.y = THREE.MathUtils.lerp(sway.current.y, targetSwayY, delta * 4)

        // 2. Recoil Recovery
        recoil.current.z = THREE.MathUtils.lerp(recoil.current.z, 0, delta * 10)
        recoil.current.x = THREE.MathUtils.lerp(recoil.current.x, 0, delta * 12) // recover pitch faster

        // 3. Apply Transforms
        // Base position (bottom right)
        groupRef.current.position.set(
            0.4 + sway.current.x * 0.5,
            -0.3 + sway.current.y * 0.5,
            -0.8 + recoil.current.z * 0.5 // kickback
        )

        // Base rotation
        groupRef.current.rotation.set(
            sway.current.y * 0.5 + recoil.current.x, // pitch up on recoil
            sway.current.x * 0.8,
            sway.current.x * 0.2 // slight banking
        )

        // 4. Muzzle Flash Decay
        if (muzzleRef.current) {
            muzzleFlash.current = THREE.MathUtils.lerp(muzzleFlash.current, 0, delta * 20)
            muzzleRef.current.intensity = muzzleFlash.current * 2 + (Math.random() * 0.5 * muzzleFlash.current)
            muzzleRef.current.visible = muzzleFlash.current > 0.05
        }
    })

    const Model = useMemo(() => {
        switch (weapon.id) {
            case 'pistol': return PistolModel
            case 'shotgun': return ShotgunModel
            case 'laser': return LaserModel
            case 'railgun': return RailgunModel
            default: return PistolModel
        }
    }, [weapon.id])

    return (
        <group ref={groupRef}>
            <Model color={weapon.color} />

            {/* Muzzle Flash Light */}
            <pointLight
                ref={muzzleRef}
                position={[0, 0.1, -0.6]}
                color={weapon.color}
                distance={3}
                decay={2}
            />
        </group>
    )
}
