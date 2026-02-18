import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export const Crosshair = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [isClicked, setIsClicked] = useState(false)
    const [isTouch, setIsTouch] = useState(false)
    const hasMoved = useRef(false)

    useEffect(() => {
        // Detect touch device
        const handleTouchStart = () => {
            setIsTouch(true)
        }

        const handleMouseMove = (e: MouseEvent) => {
            hasMoved.current = true
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        const handleMouseDown = () => setIsClicked(true)
        const handleMouseUp = () => setIsClicked(false)

        window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true })
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // Hide on touch devices or before first mouse move
    if (isTouch || !hasMoved.current) return null

    return (
        <div
            className="fixed top-0 left-0 pointer-events-none z-[200]"
            style={{
                transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
                left: -20,
                top: -20
            }}
        >
            <motion.div
                className="relative w-10 h-10 flex items-center justify-center"
                animate={{
                    scale: isClicked ? 0.8 : 1,
                    rotate: isClicked ? 45 : 0
                }}
            >
                {/* Center dot */}
                <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" />

                {/* Horizontal lines */}
                <div className="absolute w-6 h-[1px] bg-cyan-400/50" />

                {/* Vertical lines */}
                <div className="absolute h-6 w-[1px] bg-cyan-400/50" />

                {/* Rotating outer ring */}
                <motion.div
                    className="absolute w-8 h-8 border border-cyan-400/20 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />

                {/* Corner bents */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                </div>
            </motion.div>
        </div>
    )
}
