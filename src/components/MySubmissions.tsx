import { useState, useEffect, useCallback } from 'react';
import { MapPin, Camera, Leaf, Dog, Trash2, ImageIcon } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
// import { useUserStore } from '../store/userStore';
import { GlassmorphismModal, GlassCard } from './ui/glassmorphism-modal';
import type { MarkerData, PlantMarker, AnimalMarker, LitterMarker, CommunityEventMarker } from '../utils/MarkerManager';

interface MySubmissionsProps {
    open: boolean;
    onClose: () => void;
}

interface SubmissionStats {
    total: number;
    plants: number;
    animals: number;
    litter: number;
    communityEvents: number;
}const MySubmissions: React.FC<MySubmissionsProps> = ({ open, onClose }) => {
    const [submissions, setSubmissions] = useState<MarkerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<SubmissionStats>({ total: 0, plants: 0, animals: 0, litter: 0, communityEvents: 0 });

    // Get current user ID from store
    // const { userData } = useUserStore();
    const userId = "7e2d0bab-59c3-4748-bcec-1ee2658f0b91";

    const fetchMySubmissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!userId) {
                setError('User not authenticated');
                return;
            }

            const response = await apiClient.markers.getAll();
            const { plants, animals, litters, communityEvents } = response.data as {
                plants: PlantMarker[];
                animals: AnimalMarker[];
                litters: LitterMarker[];
                communityEvents: CommunityEventMarker[];
            };            // Filter markers by user ID and convert to MarkerData format
            const userPlants: MarkerData[] = plants
                .filter(plant => plant.createdById === userId)
                .map(plant => ({
                    id: `plant-${plant.id}`,
                    name: plant.plantName,
                    image: plant.imageUrl,
                    position: [plant.longitude, plant.latitude] as [number, number],
                    type: "plant" as const,
                    createdById: plant.createdById,
                    originalData: plant,
                }));

            const userAnimals: MarkerData[] = animals
                .filter(animal => animal.createdById === userId)
                .map(animal => ({
                    id: `animal-${animal.id}`,
                    name: animal.name,
                    image: animal.imageUrl,
                    position: [animal.longitude, animal.latitude] as [number, number],
                    type: "animal" as const,
                    createdById: animal.createdById,
                    originalData: animal,
                }));

            const userLitter: MarkerData[] = litters
                .filter(litter => litter.createdById === userId)
                .map(litter => ({
                    id: `litter-${litter.id}`,
                    name: "Litter Cleanup",
                    image: litter.afterImg,
                    position: [litter.longitude, litter.latitude] as [number, number],
                    type: "litter" as const,
                    createdById: litter.createdById,
                    originalData: litter,
                }));

            const userCommunityEvents: MarkerData[] = (communityEvents || [])
                .filter(event => event.createdById === userId)
                .map(event => ({
                    id: `community-event-${event.id}`,
                    name: event.eventName,
                    image: event.imageUrl,
                    position: [event.longitude, event.latitude] as [number, number],
                    type: "community-event" as const,
                    createdById: event.createdById,
                    originalData: event,
                }));

            // Combine and sort by most recent (assuming ID order represents creation order)
            const allUserSubmissions = [...userPlants, ...userAnimals, ...userLitter, ...userCommunityEvents]; setSubmissions(allUserSubmissions);

            // Calculate stats
            setStats({
                total: allUserSubmissions.length,
                plants: userPlants.length,
                animals: userAnimals.length,
                litter: userLitter.length,
                communityEvents: userCommunityEvents.length,
            });
        } catch (err) {
            console.error('Error fetching user submissions:', err);
            setError('Failed to load your submissions');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (open && userId) {
            fetchMySubmissions();
        }
    }, [open, userId, fetchMySubmissions]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'plant':
                return <Leaf className="h-4 w-4 text-green-400" />;
            case 'animal':
                return <Dog className="h-4 w-4 text-blue-400" />;
            case 'litter':
                return <Trash2 className="h-4 w-4 text-orange-400" />;
            case 'community-event':
                return <span className="text-orange-400">🎪</span>;
            default:
                return <MapPin className="h-4 w-4 text-gray-400" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'plant':
                return 'text-green-400 bg-green-500/20 border-green-400/30';
            case 'animal':
                return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
            case 'litter':
                return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
            case 'community-event':
                return 'text-amber-400 bg-amber-500/20 border-amber-400/30';
            default:
                return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
        }
    };

    const formatCoordinates = (position: [number, number]) => {
        return `${position[1].toFixed(6)}, ${position[0].toFixed(6)}`;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-40">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-400 border-t-transparent"></div>
                        <p className="text-white/80 font-medium">Loading your submissions...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-white">
                    <div className="mb-4">
                        <ImageIcon className="h-12 w-12 mx-auto text-red-400" />
                    </div>
                    <p className="font-semibold mb-2">Oops! Something went wrong</p>
                    <p className="text-sm mb-4 text-white/70">{error}</p>
                    <button
                        onClick={fetchMySubmissions}
                        className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors duration-200 font-medium backdrop-blur-sm"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return (
            <>
                {/* Stats Overview */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                    <GlassCard variant="default" className="p-3 text-center">
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="text-xs text-white/60">Total</div>
                    </GlassCard>
                    <GlassCard variant="default" className="p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.plants}</div>
                        <div className="text-xs text-white/60">Plants</div>
                    </GlassCard>
                    <GlassCard variant="default" className="p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.animals}</div>
                        <div className="text-xs text-white/60">Animals</div>
                    </GlassCard>
                    <GlassCard variant="default" className="p-3 text-center">
                        <div className="text-2xl font-bold text-orange-400">{stats.litter}</div>
                        <div className="text-xs text-white/60">Cleanups</div>
                    </GlassCard>
                    <GlassCard variant="default" className="p-3 text-center">
                        <div className="text-2xl font-bold text-amber-400">{stats.communityEvents}</div>
                        <div className="text-xs text-white/60">Events</div>
                    </GlassCard>
                </div>

                {/* Submissions List */}
                <div className="space-y-3 mb-6">
                    {submissions.map((submission) => (
                        <GlassCard
                            key={submission.id}
                            variant="interactive"
                            className="p-4"
                        >
                            <div className="flex items-center gap-4">
                                {/* Submission Image */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={submission.image}
                                        alt={submission.name}
                                        className="w-16 h-16 rounded-lg object-cover border-2 border-white/20"
                                        onError={(e) => {
                                            e.currentTarget.src = `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=64&h=64&fit=crop&crop=center`;
                                        }}
                                    />
                                    <div className="absolute -top-2 -right-2 p-1 bg-white/20 rounded-full backdrop-blur-sm">
                                        {getTypeIcon(submission.type)}
                                    </div>
                                </div>

                                {/* Submission Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white truncate">{submission.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(submission.type)}`}>
                                            {submission.type}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-white/60">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="font-mono text-xs">
                                                {formatCoordinates(submission.position)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Camera className="h-3 w-3" />
                                            <span>Photo</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Indicator */}
                                <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {submissions.length === 0 && (
                    <div className="text-center py-12">
                        <div className="mb-4">
                            <Camera className="h-16 w-16 mx-auto text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No submissions yet!</h3>
                        <p className="text-white/60">Start exploring and capturing nature to see your contributions here</p>
                    </div>
                )}
            </>
        );
    };

    return (
        <GlassmorphismModal
            open={open}
            setOpen={() => onClose()}
            onClose={onClose}
            title="📸 My Submissions"
            subtitle="Your environmental contributions"
            size="lg"
            className="z-50"
        >
            {renderContent()}
        </GlassmorphismModal>
    );
};

export default MySubmissions;