import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Star, Zap } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { GlassmorphismModal, GlassCard } from './ui/glassmorphism-modal';

interface School {
  id: string;
  name: string;
  email: string;
  phoneNo: string;
}

interface LeaderboardUser {
  id: string;
  userId: string;
  fullName: string;
  role: string;
  schoolId?: string | null;
  ngoId?: string | null;
  profilePic: string;
  email: string;
  ecoPoints: number;
  school?: School | null;
}

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ open, onClose }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.leaderboard.getAll();
      console.log(response.data);
      // Sort users by ecoPoints in descending order
      const sortedUsers = (response.data as LeaderboardUser[]).sort((a: LeaderboardUser, b: LeaderboardUser) =>
        b.ecoPoints - a.ecoPoints
      );
      setUsers(sortedUsers);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-white" />;
      case 1:
        return <Trophy className="h-5 w-5 text-white" />;
      case 2:
        return <Medal className="h-5 w-5 text-white" />;
      default:
        return <Award className="h-4 w-4 text-white" />;
    }
  };

  // Generate fallback avatar based on user name
  const generateFallbackAvatar = (name: string, index: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
    ];

    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const colorClass = colors[index % colors.length];

    return (
      <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm border-2 ${index < 3 ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-white/20'
        }`}>
        {initials}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent"></div>
            <p className="text-white/80 font-medium">Loading champions...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-white">
          <div className="mb-4">
            <Zap className="h-12 w-12 mx-auto text-red-400" />
          </div>
          <p className="font-semibold mb-2">Oops! Something went wrong</p>
          <p className="text-sm mb-4 text-white/70">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors duration-200 font-medium backdrop-blur-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3 mb-6">
          {users.map((user, index) => (
            <GlassCard
              key={user.id}
              variant="interactive"
              className={`p-4 ${index < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/30' : ''
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-lg ${index < 3
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                  : 'bg-white/20 text-white/90'
                  }`}>
                  {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                </div>

                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  {user.profilePic && !imageErrors.has(user.id) ? (
                    <img
                      src={user.profilePic}
                      alt={user.fullName}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${index < 3
                        ? 'border-yellow-400 ring-2 ring-yellow-200'
                        : 'border-white/20'
                        }`}
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(user.id));
                      }}
                    />
                  ) : (
                    generateFallbackAvatar(user.fullName, index)
                  )}
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                      <Star className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-white truncate">{user.fullName}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="capitalize px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-400/30">
                      {user.role.toLowerCase()}
                    </span>
                    {user.school && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-white/70 font-medium truncate">{user.school.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* EcoPoints */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-bold ${index < 3 ? 'text-yellow-400' : 'text-white'
                    }`}>
                    {user.ecoPoints}
                  </div>
                  <div className="text-xs text-white/60 font-medium">EcoPoints</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Trophy className="h-16 w-16 mx-auto text-white/40" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No champions yet!</h3>
            <p className="text-white/60">Be the first to earn EcoPoints and top the leaderboard</p>
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
      title="🏆 EcoPoints Leaderboard"
      subtitle="Top Environmental Champions"
      size="lg"
      className="z-50"
    >
      {renderContent()}
    </GlassmorphismModal>
  );
};

export default Leaderboard;