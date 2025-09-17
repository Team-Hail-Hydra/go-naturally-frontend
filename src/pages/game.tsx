import { useState } from 'react'
import Map from '../components/Map'
import FloatingAddButton from '../components/FloatingAddButton'
import Leaderboard from '@/components/Leaderboard'
import { Button } from '@/components/ui/button'
import { Trophy, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Game = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const toggleLeaderboard = () => {
        setShowLeaderboard(!showLeaderboard);
    };

    return (
        <div className="relative min-h-screen">
            <Map onUserLocationChange={setUserLocation} />
            <FloatingAddButton userLocation={userLocation} />

            {/* Leaderboard Toggle Button */}
            <motion.div
                className="absolute top-4 right-4 z-40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={toggleLeaderboard}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-2 border-white/20 backdrop-blur-sm"
                >
                    <motion.div
                        animate={{ rotate: showLeaderboard ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {showLeaderboard ? (
                            <X className="h-6 w-6 text-white" />
                        ) : (
                            <Trophy className="h-6 w-6 text-white" />
                        )}
                    </motion.div>
                </Button>
            </motion.div>

            {/* Leaderboard Panel */}
            <AnimatePresence>
                {showLeaderboard && (
                    <motion.div
                        initial={{ opacity: 0, x: 400, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 400, scale: 0.8 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        className="absolute top-20 right-4 w-96 max-h-[80vh] overflow-hidden z-30"
                    >
                        <Leaderboard />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Game
