import { useEffect, useRef, useState } from 'react'

/**
 * Custom crosshair cursor with hit marker feedback.
 * Circle + center dot, color changes on hover.
 * On hit: expands, flashes red, shows ✕ marker.
 */
export default function Crosshair() {
    const cursorRef = useRef<HTMLDivElement>(null)
    const [isTarget, setIsTarget] = useState(false)
    const [isHit, setIsHit] = useState(false)
    const pos = useRef({ x: 0, y: 0 })
    const rendered = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            pos.current = { x: e.clientX, y: e.clientY }
        }

        const onHoverIn = () => setIsTarget(true)
        const onHoverOut = () => setIsTarget(false)

        const onHit = () => {
            setIsHit(true)
            setTimeout(() => setIsHit(false), 150)
        }

        // Global hover detection for UI elements
        const onGlobalHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // Check if hovering interactive elements
            const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.closest('button') || // Handle nested elements
                target.closest('a') ||
                target.role === 'button'

            if (isInteractive) {
                setIsTarget(true)
            } else {
                setIsTarget(false)
            }
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseover', onGlobalHover) // Capture bubbling? No, mouseover bubbles.
        // Actually, for global detection, checking target on mousemove might be expensive but effective enough for this scale.
        // Better: use mouseover/mouseout on document body?
        // Let's stick to mousemove checking for simplicity or add specific listeners if needed. 
        // Re-implementing with mouseover/mouseout delegation:

        const onDocHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const isInteractive =
                target.matches('button, a, input, textarea, [role="button"]') ||
                target.closest('button, a, [role="button"]')

            if (isInteractive) setIsTarget(true)
        }

        const onDocOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const isInteractive =
                target.matches('button, a, input, textarea, [role="button"]') ||
                target.closest('button, a, [role="button"]')

            if (isInteractive) setIsTarget(false)
        }

        document.addEventListener('mouseover', onDocHover)
        document.addEventListener('mouseout', onDocOut)

        window.addEventListener('crosshair-target-in', onHoverIn)
        window.addEventListener('crosshair-target-out', onHoverOut)
        window.addEventListener('crosshair-hit', onHit)

        let raf: number
        const animate = () => {
            rendered.current.x += (pos.current.x - rendered.current.x) * 0.15
            rendered.current.y += (pos.current.y - rendered.current.y) * 0.15
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${rendered.current.x}px, ${rendered.current.y}px)`
            }
            raf = requestAnimationFrame(animate)
        }
        raf = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseover', onDocHover)
            document.removeEventListener('mouseout', onDocOut)
            window.removeEventListener('crosshair-target-in', onHoverIn)
            window.removeEventListener('crosshair-target-out', onHoverOut)
            window.removeEventListener('crosshair-hit', onHit)
            cancelAnimationFrame(raf)
        }
    }, [])

    const ringColor = isHit ? '#ff0040' : isTarget ? '#ff00ff' : '#00ffff'
    const dotColor = isHit ? '#ff0040' : isTarget ? '#ff4444' : '#00ffff'
    const ringSize = isHit ? 44 : isTarget ? 36 : 28
    const dotSize = isHit ? 0 : isTarget ? 5 : 3
    const borderWidth = isHit ? 2.5 : 1.5

    return (
        <div
            ref={cursorRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 99999,
                mixBlendMode: 'screen',
                willChange: 'transform',
            }}
        >
            {/* Outer ring */}
            <div
                style={{
                    width: ringSize,
                    height: ringSize,
                    marginLeft: -ringSize / 2,
                    marginTop: -ringSize / 2,
                    borderRadius: '50%',
                    border: `${borderWidth}px solid ${ringColor}`,
                    boxShadow: `0 0 ${isHit ? 20 : 8}px ${ringColor}60, inset 0 0 ${isHit ? 12 : 8}px ${ringColor}20`,
                    transition: 'all 0.1s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Center dot (hidden on hit) */}
                <div
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        boxShadow: `0 0 6px ${dotColor}`,
                        transition: 'all 0.1s',
                    }}
                />

                {/* Hit marker ✕ */}
                {isHit && (
                    <>
                        {/* Top-left to bottom-right line */}
                        <div style={{
                            position: 'absolute',
                            width: ringSize * 0.55,
                            height: 2.5,
                            background: '#ff0040',
                            boxShadow: '0 0 8px #ff0040',
                            transform: 'rotate(45deg)',
                        }} />
                        {/* Top-right to bottom-left line */}
                        <div style={{
                            position: 'absolute',
                            width: ringSize * 0.55,
                            height: 2.5,
                            background: '#ff0040',
                            boxShadow: '0 0 8px #ff0040',
                            transform: 'rotate(-45deg)',
                        }} />
                    </>
                )}
            </div>

            {/* Tick marks (crosshair lines) */}
            {!isHit && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: -ringSize / 2 - 6,
                        left: -1,
                        width: 2,
                        height: 5,
                        background: ringColor,
                        opacity: 0.6,
                        boxShadow: `0 0 4px ${ringColor}`,
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -ringSize / 2 + ringSize - 6,
                        left: -1,
                        width: 2,
                        height: 5,
                        background: ringColor,
                        opacity: 0.6,
                        boxShadow: `0 0 4px ${ringColor}`,
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: -1,
                        left: -ringSize / 2 - 6,
                        width: 5,
                        height: 2,
                        background: ringColor,
                        opacity: 0.6,
                        boxShadow: `0 0 4px ${ringColor}`,
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: -1,
                        right: -ringSize / 2 + ringSize - 6,
                        width: 5,
                        height: 2,
                        background: ringColor,
                        opacity: 0.6,
                        boxShadow: `0 0 4px ${ringColor}`,
                    }} />
                </>
            )}
        </div>
    )
}
