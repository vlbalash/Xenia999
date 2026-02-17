import { useEffect, useRef, useState } from 'react'

/* ──────── Floating Score Popup ──────── */
interface ScorePopup {
    id: number
    x: number
    y: number
    text: string
    color: string
    created: number
}

/* ──────── Score HUD + Floating Scores ──────── */
export default function ScoreHUD() {
    const [score, setScore] = useState(0)
    const [combo, setCombo] = useState(0)
    const [popups, setPopups] = useState<ScorePopup[]>([])
    const [hitFlash, setHitFlash] = useState(false)
    const comboTimerRef = useRef<number | null>(null)
    const idRef = useRef(0)
    const bestComboRef = useRef(0)
    const [bestCombo, setBestCombo] = useState(0)

    // Easter egg triggers
    const triggered420 = useRef(false)
    const triggered999 = useRef(false)

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const mouseX = detail?.mouseX ?? window.innerWidth / 2
            const mouseY = detail?.mouseY ?? window.innerHeight / 2

            // Combo logic: if shots within 1.5s, combo increases
            setCombo(prev => {
                const newCombo = prev + 1
                if (newCombo > bestComboRef.current) {
                    bestComboRef.current = newCombo
                    setBestCombo(newCombo)
                }
                return newCombo
            })

            // Reset combo timer
            if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
            comboTimerRef.current = window.setTimeout(() => {
                setCombo(0)
            }, 1500)

            // Calculate score based on combo and weapon damage
            setCombo(prev => {
                const multiplier = Math.min(prev + 1, 5)
                const damage = (detail as any).damage || 1
                const points = 10 * damage * multiplier

                setScore(s => {
                    const newScore = s + points

                    // Trigger 420 Easter Egg
                    if (newScore >= 420 && !triggered420.current) {
                        triggered420.current = true
                        window.dispatchEvent(new CustomEvent('trigger-420'))
                    }

                    // Trigger 999 Easter Egg
                    if (newScore >= 999 && !triggered999.current) {
                        triggered999.current = true
                        window.dispatchEvent(new CustomEvent('trigger-999'))
                    }

                    return newScore
                })

                // Create popup
                const id = ++idRef.current
                const isCombo = multiplier > 1
                const text = isCombo ? `+${points} COMBO x${multiplier}!` : `+${points}`
                const color = isCombo
                    ? (multiplier >= 4 ? '#ff00ff' : multiplier >= 3 ? '#ffaa00' : '#00ffff')
                    : '#ffffff'

                setPopups(p => [...p, { id, x: mouseX, y: mouseY, text, color, created: Date.now() }])

                // Remove after animation
                setTimeout(() => {
                    setPopups(p => p.filter(popup => popup.id !== id))
                }, 1200)

                return prev
            })

            // Hit flash
            setHitFlash(true)
            setTimeout(() => setHitFlash(false), 100)
        }

        window.addEventListener('score-hit', handler)
        return () => window.removeEventListener('score-hit', handler)
    }, [])

    return (
        <>
            {/* Score HUD */}
            <div style={{
                position: 'fixed',
                top: 16,
                right: 20,
                pointerEvents: 'none',
                zIndex: 99998,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                textAlign: 'right',
            }}>
                {/* Score */}
                <div style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textShadow: '0 0 20px rgba(0,255,255,0.5)',
                    letterSpacing: '0.1em',
                    transition: 'transform 0.1s',
                    transform: hitFlash ? 'scale(1.15)' : 'scale(1)',
                }}>
                    {score.toLocaleString()}
                </div>

                {/* Combo indicator */}
                {combo > 1 && (
                    <div style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: combo >= 4 ? '#ff00ff' : combo >= 3 ? '#ffaa00' : '#00ffff',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        textShadow: `0 0 10px ${combo >= 4 ? '#ff00ff' : combo >= 3 ? '#ffaa00' : '#00ffff'}`,
                        animation: 'comboShake 0.3s ease-in-out',
                    }}>
                        🔥 COMBO x{Math.min(combo, 5)}
                    </div>
                )}

                {/* Stats */}
                <div style={{
                    fontSize: 10,
                    color: '#666',
                    marginTop: 4,
                    letterSpacing: '0.15em',
                }}>
                    BEST COMBO: x{bestCombo}
                </div>
            </div>

            {/* Floating score popups */}
            {popups.map(popup => (
                <div
                    key={popup.id}
                    style={{
                        position: 'fixed',
                        left: popup.x,
                        top: popup.y,
                        pointerEvents: 'none',
                        zIndex: 99997,
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        fontWeight: 'bold',
                        fontSize: popup.text.includes('COMBO') ? 18 : 14,
                        color: popup.color,
                        textShadow: `0 0 12px ${popup.color}, 0 0 24px ${popup.color}40`,
                        animation: 'scoreFloat 1.2s ease-out forwards',
                        transform: 'translate(-50%, -50%)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {popup.text}
                </div>
            ))}

            {/* CSS animations injected */}
            <style>{`
                @keyframes scoreFloat {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    10% {
                        opacity: 1;
                        transform: translate(-50%, -70%) scale(1.3);
                    }
                    30% {
                        opacity: 1;
                        transform: translate(-50%, -100%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -180%) scale(0.8);
                    }
                }
                @keyframes comboShake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-3px); }
                    40% { transform: translateX(3px); }
                    60% { transform: translateX(-2px); }
                    80% { transform: translateX(2px); }
                }
            `}</style>
        </>
    )
}
