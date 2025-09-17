import { useUserStore } from '@/store/userStore'
import { motion } from 'framer-motion'
import { Leaf, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

const EcoPointsCounter = () => {
    const { ecoPoints } = useUserStore()
    const [displayPoints, setDisplayPoints] = useState(ecoPoints)
    const [showIncrement, setShowIncrement] = useState(false)
    const [lastPoints, setLastPoints] = useState(ecoPoints)

    useEffect(() => {
        if (ecoPoints !== lastPoints) {
            const difference = ecoPoints - lastPoints
            if (difference > 0) {
                setShowIncrement(true)
                setTimeout(() => setShowIncrement(false), 2000)
            }

            // Animate the counter
            const animationDuration = 800
            const steps = 20
            const increment = (ecoPoints - displayPoints) / steps
            let currentStep = 0

            const timer = setInterval(() => {
                currentStep++
                if (currentStep >= steps) {
                    setDisplayPoints(ecoPoints)
                    clearInterval(timer)
                } else {
                    setDisplayPoints(Math.round(displayPoints + increment * currentStep))
                }
            }, animationDuration / steps)

            setLastPoints(ecoPoints)
            return () => clearInterval(timer)
        }
    }, [ecoPoints, displayPoints, lastPoints])

    return (
        <motion.div
            className="fixed top-6 left-6 z-50"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="relative">
                {/* Main counter */}
                <motion.div
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl bg-black/20 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Eco leaf icon */}
                    <motion.div
                        className="relative"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Leaf className="h-8 w-8 text-green-400 drop-shadow-lg" />
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 h-8 w-8 bg-green-400/20 rounded-full blur-lg -z-10" />
                    </motion.div>

                    {/* Points display */}
                    <div className="flex flex-col">
                        <motion.div
                            className="text-2xl font-bold text-white drop-shadow-lg"
                            key={displayPoints}
                            initial={{ scale: 1.2, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {displayPoints.toLocaleString()}
                        </motion.div>
                        <div className="text-xs text-white/60 uppercase tracking-wider font-medium">
                            Eco Points
                        </div>
                    </div>
                </motion.div>

                {/* Increment indicator */}
                {showIncrement && ecoPoints > lastPoints && (
                    <motion.div
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -10, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-sm font-bold shadow-lg">
                            <Plus className="h-3 w-3" />
                            +{(ecoPoints - lastPoints).toLocaleString()}
                        </div>
                    </motion.div>
                )}

                {/* Background particles effect */}
                <div className="absolute inset-0 -z-10">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-green-400/30 rounded-full"
                            style={{
                                left: `${20 + i * 30}%`,
                                top: `${30 + i * 20}%`,
                            }}
                            animate={{
                                y: [-10, 10, -10],
                                opacity: [0.3, 0.7, 0.3],
                                scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default EcoPointsCounter