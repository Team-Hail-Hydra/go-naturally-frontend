import { useState } from 'react'
import Map from '../components/Map'
import FloatingAddButton from '../components/FloatingAddButton'
import Leaderboard from '@/components/Leaderboard'

const Game = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    return (
        <div className="relative min-h-screen">
            <Map onUserLocationChange={setUserLocation} />
            <FloatingAddButton userLocation={userLocation} />
            <div className="absolute top-4 right-4 w-80">
                <Leaderboard />
            </div>
        </div>
    )
}

export default Game
