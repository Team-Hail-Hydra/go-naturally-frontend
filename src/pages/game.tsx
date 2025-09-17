import { useState } from 'react'
import Map from '../components/Map'
import FloatingAddButton from '../components/FloatingAddButton'
import Leaderboard from '@/components/Leaderboard'
import MySubmissions from '@/components/MySubmissions'
import LoadingScreen from '@/components/LoadingScreen'
import EcoPointsCounter from '@/components/EcoPointsCounter'
import { Button } from '@/components/ui/button'
import { Trophy, X, Image } from 'lucide-react'
import { motion } from 'framer-motion'

const Game = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showMySubmissions, setShowMySubmissions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const toggleLeaderboard = () => {
        setShowLeaderboard(!showLeaderboard);
    };

    const toggleMySubmissions = () => {
        setShowMySubmissions(!showMySubmissions);
    };

    const handleMapReady = () => {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            {/* Loading Screen */}
            <LoadingScreen
                isLoading={isLoading}
                title="Go Naturally"
                subtitle="Preparing your adventure..."
            />

            <div className="relative min-h-screen">
                <Map
                    onUserLocationChange={setUserLocation}
                    onMapReady={handleMapReady}
                />
                <FloatingAddButton userLocation={userLocation} />

                {/* Eco Points Counter - Top Left */}
                <EcoPointsCounter />

                {/* My Submissions Toggle Button - Bottom Left */}
                <motion.div
                    className="absolute bottom-9 left-10 z-40"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={toggleMySubmissions}
                        size="lg"
                        className="h-16 w-16 rounded-full shadow-2xl bg-black/20 hover:bg-black/30 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300"
                    >
                        <motion.div
                            animate={{ rotate: showMySubmissions ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {showMySubmissions ? (
                                <X className="h-7 w-7 text-white" />
                            ) : (
                                <Image className="h-7 w-7 text-green-400" />
                            )}
                        </motion.div>
                    </Button>
                </motion.div>

                {/* Leaderboard Toggle Button - Bottom Right */}
                <motion.div
                    className="absolute bottom-9 right-10 z-40"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={toggleLeaderboard}
                        size="lg"
                        className="h-16 w-16 rounded-full shadow-2xl bg-black/20 hover:bg-black/30 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300"
                    >
                        <motion.div
                            animate={{ rotate: showLeaderboard ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {showLeaderboard ? (
                                <X className="h-7 w-7 text-white" />
                            ) : (
                                <Trophy className="h-7 w-7 text-yellow-400" />
                            )}
                        </motion.div>
                    </Button>
                </motion.div>

                {/* My Submissions Modal */}
                <MySubmissions open={showMySubmissions} onClose={() => setShowMySubmissions(false)} />

                {/* Leaderboard Modal */}
                <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
            </div>
        </>
    )
}

export default Game
