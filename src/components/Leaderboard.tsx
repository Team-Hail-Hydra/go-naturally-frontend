import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Trophy, Medal, Award, Crown, User, Star, Zap } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

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

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

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
        return <Crown className="h-6 w-6 text-white" />;
      case 1:
        return <Trophy className="h-6 w-6 text-white" />;
      case 2:
        return <Medal className="h-6 w-6 text-white" />;
      default:
        return <Award className="h-5 w-5 text-white" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
            <p className="text-green-700 font-medium">Loading champions...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-xl">
        <div className="text-center text-red-600">
          <div className="mb-4">
            <Zap className="h-12 w-12 mx-auto text-red-500" />
          </div>
          <p className="font-semibold mb-2">Oops! Something went wrong</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
            EcoPoints Leaderboard
          </h2>
          <p className="text-sm text-green-600 font-medium">Top Environmental Champions</p>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
              index < 3
                ? 'bg-gradient-to-r from-white via-green-50 to-emerald-50 border-green-200 shadow-md'
                : 'bg-white/80 border-gray-200 hover:bg-white'
            }`}
          >
            {/* Rank Badge */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-lg ${
              index < 3
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
            }`}>
              {index < 3 ? getRankIcon(index) : `#${index + 1}`}
            </div>

            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.fullName}
                  className={`w-12 h-12 rounded-full object-cover border-2 ${
                    index < 3
                      ? 'border-yellow-400 ring-2 ring-yellow-200'
                      : 'border-gray-200'
                  }`}
                />
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 ${
                  index < 3 ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
                }`}>
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              )}
              {index === 0 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                  <Star className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-gray-800 truncate">{user.fullName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="capitalize px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {user.role.toLowerCase()}
                </span>
                {user.school && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 font-medium truncate">{user.school.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* EcoPoints */}
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-bold ${
                index < 3 ? 'text-green-600' : 'text-gray-700'
              }`}>
                {user.ecoPoints}
              </div>
              <div className="text-xs text-gray-500 font-medium">EcoPoints</div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <Trophy className="h-16 w-16 mx-auto text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No champions yet!</h3>
          <p className="text-gray-500">Be the first to earn EcoPoints and top the leaderboard</p>
        </div>
      )}
    </Card>
  );
};

export default Leaderboard;