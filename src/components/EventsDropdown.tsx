import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/utils/supabase';
import { getCurrentLocation, type GeolocationError } from '@/utils/geolocation';
import LitterUpload from './LitterUpload';

type UserRole = 'STUDENT' | 'TEACHER' | 'NGO';
type TeacherTab = 'school-events' | 'ngo-events' | 'litter-reports';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  latitude?: number;
  longitude?: number;
  ngoId?: string;
  schoolId?: string;
}

interface LitterReport {
  id: string;
  beforeImg: string;
  afterImg: string;
  latitude: number;
  longitude: number;
  createdById: string;
  createdBy: {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    role: string;
    profilePic?: string;
    ecoPoints: number;
    schoolId?: string;
    ngoId?: string;
  };
}

interface UserData {
  id: string;
  role: UserRole;
  schoolId?: string;
  ngoId?: string;
  name?: string;
}

interface EventsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventsDropdown({ isOpen, onClose }: EventsDropdownProps) {
  // State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentView, setCurrentView] = useState<'events' | 'create'>('events');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('school-events');
  const [events, setEvents] = useState<Event[]>([]);
  const [litterReports, setLitterReports] = useState<LitterReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Simplified form state
  const [createEventForm, setCreateEventForm] = useState({
    title: '',
    description: '',
    date: '',
    latitude: '',
    longitude: ''
  });

  // Location fetching state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false);

  // Litter upload modal state
  const [isLitterUploadOpen, setIsLitterUploadOpen] = useState(false);

  // Eco points modal state
  const [isEcoPointsModalOpen, setIsEcoPointsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{userId: string, name: string} | null>(null);
  const [ecoPointsToAdd, setEcoPointsToAdd] = useState<number>(10);
  const [addingPoints, setAddingPoints] = useState(false);

  // Initialize user
  useEffect(() => {
    if (isOpen) {
      initializeUser();
    }
  }, [isOpen]);

  // Load events when dependencies change
  useEffect(() => {
    if (isOpen && userRole) {
      loadEvents();
    }
  }, [isOpen, userRole, teacherTab, currentPage]);

  // Auto-fetch location when switching to create view
  useEffect(() => {
    if (currentView === 'create' && !isLocationFetched && createEventForm.latitude === '' && createEventForm.longitude === '') {
      fetchCurrentLocation();
    }
  }, [currentView, isLocationFetched, createEventForm.latitude, createEventForm.longitude]);

  const fetchCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      });

      setCreateEventForm(prev => ({
        ...prev,
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6)
      }));
      setIsLocationFetched(true);
    } catch (error) {
      const geoError = error as GeolocationError;
      let userFriendlyMessage = geoError.message;
      
      // Provide more helpful error messages
      switch (geoError.code) {
        case 1:
          userFriendlyMessage = 'Please enable location access to auto-fill coordinates';
          break;
        case 2:
          userFriendlyMessage = 'Location unavailable. Please enter coordinates manually';
          break;
        case 3:
          userFriendlyMessage = 'Location request timed out. Please try again or enter manually';
          break;
        default:
          userFriendlyMessage = 'Could not get location. Please enter coordinates manually';
      }
      
      setLocationError(userFriendlyMessage);
      console.error('Error fetching location:', geoError);
    } finally {
      setLocationLoading(false);
    }
  };

  const initializeUser = async () => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) return;

      const parsedUserData: UserData = JSON.parse(storedUserData);
      console.log('Parsed user data:', parsedUserData);

      setUserData(parsedUserData);
      setUserRole(parsedUserData.role);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const loadEvents = async () => {
    if (!userRole || !userData) return;

    console.log('User role:', userRole);
    console.log('User data:', userData);

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      console.log('Token:', token);

      let endpoint = '';
      let params = `?page=${currentPage}&limit=10`; // Show 10 items per page

      switch (userRole) {
        case 'STUDENT':
          endpoint = 'http://localhost:3000/api/v1/school/events';
          params += `&schoolId=${userData.schoolId}`;
          break;
        case 'TEACHER':
          if (teacherTab === 'school-events') {
            endpoint = 'http://localhost:3000/api/v1/school/events';
            params += `&schoolId=${userData.schoolId}`;
          } else if (teacherTab === 'ngo-events') {
            endpoint = 'http://localhost:3000/api/v1/ngo/events';
          } else if (teacherTab === 'litter-reports') {
            endpoint = `http://localhost:3000/api/v1/litters/school/${userData.schoolId}`;
            params = `?page=${currentPage}`;
          }
          break;
        case 'NGO':
          endpoint = 'http://localhost:3000/api/v1/ngo/events';
          params += `&ngoId=${userData.ngoId}`;
          break;
      }

      const response = await axios.get(`${endpoint}${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response?.data) {
        if (teacherTab === 'litter-reports') {
          setLitterReports(response.data.litters || []);
        } else {
          setEvents(response.data.events || []);
        }
        setTotalPages(response.data.totalPages || 1); // Set total pages
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(teacherTab === 'litter-reports' ? 'Failed to load litter reports' : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRole || !userData) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const eventData = {
        ...createEventForm,
        latitude: parseFloat(createEventForm.latitude),
        longitude: parseFloat(createEventForm.longitude),
        ngoId: userRole === 'NGO' ? userData.ngoId : undefined,
        schoolId: userRole === 'TEACHER' ? userData.schoolId : undefined
      };

      const endpoint = userRole === 'NGO'
        ? 'http://localhost:3000/api/v1/ngo/event'
        : 'http://localhost:3000/api/v1/school/event';

      await axios.post(endpoint, eventData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Reset form and switch back to events
      setCreateEventForm({ title: '', description: '', date: '', latitude: '', longitude: '' });
      setCurrentView('events');
      setCurrentPage(1); // Reset to first page
      setIsLocationFetched(false); // Reset location flag
      setLocationError(null);
      loadEvents();
      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApply = async (eventId: string) => {
    if (!userRole || !userData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const endpoint = userRole === 'NGO'
        ? 'http://localhost:3000/api/v1/ngo/event/apply'
        : 'http://localhost:3000/api/v1/school/event/apply';

      await axios.post(endpoint, { userId: userData.id, eventId }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      alert('Applied successfully!');
    } catch (error) {
      console.error('Error applying:', error);
    }
  };

  const handleQuickRepost = async (event: Event) => {
    if (userRole !== 'TEACHER' || !userData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await axios.post('http://localhost:3000/api/v1/school/event', {
        title: event.title,
        description: event.description,
        date: event.date,
        latitude: event.latitude,
        longitude: event.longitude,
        schoolId: userData.schoolId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      alert('Event reposted successfully!');
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const handleTeacherTabChange = (tab: TeacherTab) => {
    setTeacherTab(tab);
    setCurrentPage(1); // Reset to first page when switching tabs
  };

  const handleViewChange = (view: 'events' | 'create') => {
    setCurrentView(view);
    
    // Reset location state when switching away from create view
    if (view === 'events') {
      setIsLocationFetched(false);
      setLocationError(null);
    }
  };

  const handleAddEcoPoints = async () => {
    if (!selectedStudent || !userRole || userRole !== 'TEACHER') return;

    setAddingPoints(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      await axios.post(
        'http://localhost:3000/api/v1/eco-points/add',
        {
          userId: selectedStudent.userId,
          points: ecoPointsToAdd
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Close modal and reset state
      setIsEcoPointsModalOpen(false);
      setSelectedStudent(null);
      setEcoPointsToAdd(10);
      
      // Refresh litter reports to show updated eco points
      loadEvents();
      
      alert(`Successfully awarded ${ecoPointsToAdd} eco points to ${selectedStudent.name}!`);
    } catch (error) {
      console.error('Error adding eco points:', error);
      setError('Failed to add eco points. Please try again.');
    } finally {
      setAddingPoints(false);
    }
  };

  const openEcoPointsModal = (userId: string, name: string) => {
    setSelectedStudent({ userId, name });
    setIsEcoPointsModalOpen(true);
    setEcoPointsToAdd(10); // Default points
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute left-0 top-12 w-96 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userRole} Events
              </h3>
              <p className="text-sm text-gray-600">
                {userData?.name || 'User'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Action Button - Only Create/View toggle */}
          {(userRole === 'NGO' || userRole === 'TEACHER') && (
            <div className="mt-3">
              <button
                onClick={() => handleViewChange(currentView === 'events' ? 'create' : 'events')}
                className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {currentView === 'events' ? '+ Create Event' : 'View Events'}
              </button>
            </div>
          )}

          {/* Litter Upload Button - Only for Students */}
          {userRole === 'STUDENT' && (
            <div className="mt-3">
              <button
                onClick={() => setIsLitterUploadOpen(true)}
                className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                🗑️ Report Litter Cleanup
              </button>
            </div>
          )}

          {/* Teacher Tabs */}
          {userRole === 'TEACHER' && currentView === 'events' && (
            <div className="grid grid-cols-3 mt-3 bg-gray-100 rounded p-1 gap-1">
              <button
                onClick={() => handleTeacherTabChange('school-events')}
                className={`px-2 py-1 text-xs rounded ${teacherTab === 'school-events'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                Events
              </button>
              <button
                onClick={() => handleTeacherTabChange('ngo-events')}
                className={`px-2 py-1 text-xs rounded ${teacherTab === 'ngo-events'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                NGO
              </button>
              <button
                onClick={() => handleTeacherTabChange('litter-reports')}
                className={`px-2 py-1 text-xs rounded ${teacherTab === 'litter-reports'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                🗑️ Litter
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {error && (
            <div className="p-3 mx-4 mt-4 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {/* Create Event Form */}
          {currentView === 'create' && (userRole === 'NGO' || userRole === 'TEACHER') && (
            <div className="p-4">
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <input
                  type="text"
                  placeholder="Event Title"
                  value={createEventForm.title}
                  onChange={(e) => setCreateEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={createEventForm.description}
                  onChange={(e) => setCreateEventForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={2}
                  required
                />
                <input
                  type="date"
                  value={createEventForm.date}
                  onChange={(e) => setCreateEventForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={createEventForm.latitude}
                    onChange={(e) => setCreateEventForm(prev => ({ ...prev, latitude: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={createEventForm.longitude}
                    onChange={(e) => setCreateEventForm(prev => ({ ...prev, longitude: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Location status and controls */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {locationLoading && (
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Getting your location...
                      </div>
                    )}
                    {locationError && (
                      <div className="text-xs text-red-600 leading-tight">
                        {locationError}
                      </div>
                    )}
                    {isLocationFetched && !locationError && !locationLoading && createEventForm.latitude && createEventForm.longitude && (
                      <div className="text-xs text-green-600">
                        ✓ Current location auto-filled
                      </div>
                    )}
                    {!isLocationFetched && !locationLoading && !locationError && (
                      <div className="text-xs text-gray-500">
                        Click to get current location or enter manually
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchCurrentLocation}
                    disabled={locationLoading}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={locationLoading ? 'Getting location...' : 'Get current location'}
                  >
                    {locationLoading ? '⏳' : '📍'} {locationLoading ? 'Getting...' : 'Get Location'}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            </div>
          )}

          {/* Events List */}
          {currentView === 'events' && teacherTab !== 'litter-reports' && (
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-sm text-gray-600">Loading...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No events found</div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white/80 rounded-lg border border-gray-200 p-3">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-2">{event.description}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(event.date).toLocaleDateString()}
                      </p>

                      <div className="flex gap-2">
                        {/* Apply button for students */}
                        {userRole === 'STUDENT' && (
                          <button
                            onClick={() => handleQuickApply(event.id)}
                            className="flex-1 bg-green-600 text-white py-1 px-2 text-xs rounded hover:bg-green-700"
                          >
                            Apply
                          </button>
                        )}

                        {/* Repost button for teachers viewing NGO events */}
                        {userRole === 'TEACHER' && teacherTab === 'ngo-events' && (
                          <button
                            onClick={() => handleQuickRepost(event)}
                            className="flex-1 bg-blue-600 text-white py-1 px-2 text-xs rounded hover:bg-blue-700"
                          >
                            Repost
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Litter Reports List - Only for Teachers */}
          {currentView === 'events' && teacherTab === 'litter-reports' && userRole === 'TEACHER' && (
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-sm text-gray-600">Loading...</div>
              ) : litterReports.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">No litter reports found</div>
              ) : (
                <div className="space-y-3">
                  {litterReports.map((report) => (
                    <div key={report.id} className="bg-white/80 rounded-lg border border-gray-200 p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {report.createdBy.fullName}
                          </h4>
                          <p className="text-xs text-gray-500">{report.createdBy.email}</p>
                          <p className="text-xs text-gray-500">
                            📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          🏆 {report.createdBy.ecoPoints} pts
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-1">Before</p>
                          <div className="aspect-square rounded border border-gray-200 overflow-hidden">
                            <img 
                              src={report.beforeImg} 
                              alt="Before cleanup"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-1">After</p>
                          <div className="aspect-square rounded border border-gray-200 overflow-hidden">
                            <img 
                              src={report.afterImg} 
                              alt="After cleanup"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Cleanup Completed
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.open(`https://maps.google.com/?q=${report.latitude},${report.longitude}`, '_blank')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            📍 View Location
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEcoPointsModal(report.createdBy.userId, report.createdBy.fullName);
                            }}
                            className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300"
                          >
                            🏆 Award Points
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {currentView === 'events' && totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Eco Points Modal - Only for Teachers */}
      {userRole === 'TEACHER' && isEcoPointsModalOpen && selectedStudent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
            onClick={(e) => {
              e.stopPropagation();
              setIsEcoPointsModalOpen(false);
              setSelectedStudent(null);
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Award Eco Points
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEcoPointsModalOpen(false);
                      setSelectedStudent(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Award eco points to:
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent.name}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points to Award *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={ecoPointsToAdd}
                    onChange={(e) => setEcoPointsToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: 5-20 points for cleanup activities
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEcoPointsModalOpen(false);
                      setSelectedStudent(null);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    disabled={addingPoints}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEcoPoints}
                    disabled={addingPoints}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingPoints ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Adding...
                      </div>
                    ) : (
                      `Award ${ecoPointsToAdd} Points`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Litter Upload Modal - Only for Students */}
      {userRole === 'STUDENT' && (
        <LitterUpload
          isOpen={isLitterUploadOpen}
          onClose={() => setIsLitterUploadOpen(false)}
        />
      )}
    </>
  );
}
