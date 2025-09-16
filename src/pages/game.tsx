import { useState } from 'react'
import Map from '../components/Map'
import FloatingAddButton from '../components/FloatingAddButton'

const Game = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    return (
        <div className="relative min-h-screen">
            <Map onUserLocationChange={setUserLocation} />
            <FloatingAddButton userLocation={userLocation} />
        </div>
    )
}

export default Game
