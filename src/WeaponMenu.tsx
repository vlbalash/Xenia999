import { useEffect, useState } from 'react'
import { WEAPONS, setWeapon, getCurrentWeapon, onWeaponChange, onAmmoChange, onReloadChange, type WeaponDef, getAllAmmo } from './WeaponSystem'

/**
 * Weapon HUD with Ammo & Mobile Optimizations
 */
export default function WeaponMenu() {
    const [active, setActive] = useState<WeaponDef>(getCurrentWeapon())
    const [ammo, setAmmo] = useState<number[]>(getAllAmmo())
    const [reloading, setReloading] = useState(false)
    const [justSwitched, setJustSwitched] = useState(false)

    useEffect(() => {
        const unsubWeapon = onWeaponChange((w) => {
            setActive(w)
            setJustSwitched(true)
            setTimeout(() => setJustSwitched(false), 300)
        })
        const unsubAmmo = onAmmoChange((a) => setAmmo([...a]))
        const unsubReload = onReloadChange(setReloading)

        const onKey = (e: KeyboardEvent) => {
            const idx = parseInt(e.key) - 1
            if (idx >= 0 && idx < WEAPONS.length) {
                setWeapon(idx)
            }
            if (e.key.toLowerCase() === 'r') {
                // Manual reload logic could go here if exposed, but auto-reload handles it
            }
        }

        window.addEventListener('keydown', onKey)
        return () => {
            unsubWeapon()
            unsubAmmo()
            unsubReload()
            window.removeEventListener('keydown', onKey)
        }
    }, [])

    return (
        <>
            {/* Mobile: Tappable areas are larger. Desktop: Clickable. */}
            <div style={{
                position: 'fixed',
                bottom: 24, // Moved up slightly
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8,
                zIndex: 99998,
                pointerEvents: 'auto',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                touchAction: 'none', // Prevent scroll/zoom on menu
            }}>
                {WEAPONS.map((w, i) => {
                    const isActive = w.id === active.id
                    const current = ammo[i] ?? w.maxAmmo
                    const pct = (current / w.maxAmmo) * 100
                    const isReloadingThis = isActive && reloading

                    return (
                        <div
                            key={w.id}
                            onClick={() => setWeapon(i)}
                            className="weapon-card"
                            style={{
                                width: isActive ? 84 : 60,
                                height: isActive ? 90 : 70, // Taller for ammo bar
                                padding: '6px 4px',
                                borderRadius: 12,
                                cursor: 'pointer',
                                background: isActive
                                    ? `linear-gradient(135deg, ${w.color}20, ${w.color}08)`
                                    : 'rgba(20, 20, 20, 0.6)',
                                border: `1.5px solid ${isActive ? w.color : 'rgba(255,255,255,0.1)'}`,
                                boxShadow: isActive
                                    ? `0 0 16px ${w.color}30, inset 0 0 12px ${w.color}10`
                                    : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isActive && justSwitched ? 'scale(1.05) translateY(-4px)' : isActive ? 'translateY(-6px)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                opacity: isReloadingThis ? 0.8 : 1,
                            }}
                        >
                            {/* Icon */}
                            <span style={{
                                fontSize: isActive ? 24 : 18,
                                filter: isActive ? `drop-shadow(0 0 8px ${w.color})` : 'grayscale(1)',
                                transition: 'all 0.2s',
                                marginTop: 4,
                            }}>
                                {w.icon}
                            </span>

                            {/* Ammo Bar */}
                            <div style={{ width: '80%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    background: isReloadingThis ? '#fff' : w.color,
                                    transition: 'width 0.2s, background 0.2s',
                                    animation: isReloadingThis ? 'pulse 0.5s infinite' : 'none',
                                }} />
                            </div>

                            {/* Ammo Count */}
                            <span style={{
                                fontSize: 9,
                                fontWeight: 'bold',
                                color: isReloadingThis ? '#fff' : isActive ? w.color : '#666',
                                letterSpacing: '0.05em',
                            }}>
                                {isReloadingThis ? 'RELOAD' : `${current}/${w.maxAmmo}`}
                            </span>

                            {/* Key Hint */}
                            <div style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: '#333',
                                border: `1px solid ${isActive ? w.color : '#555'}`,
                                color: isActive ? w.color : '#888',
                                fontSize: 9,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                            }}>
                                {w.key}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Reload Warning */}
            {reloading && (
                <div style={{
                    position: 'fixed',
                    bottom: 140,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#ff3333',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 'bold',
                    fontSize: 12,
                    letterSpacing: '0.2em',
                    textShadow: '0 0 10px #ff0000',
                    animation: 'blink 0.2s infinite',
                    pointerEvents: 'none',
                }}>
                    RELOADING...
                </div>
            )}

            <style>{`
                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
            `}</style>
        </>
    )
}
