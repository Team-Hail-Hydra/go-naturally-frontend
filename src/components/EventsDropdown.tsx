import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

type UserRole = 'STUDENT' | 'TEACHER' | 'NGO';
type TeacherTab = 'school-events' | 'ngo-events';

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

  const initializeUser = async () => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) return;

      const parsedUserData: UserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      setUserRole(parsedUserData.role);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const loadEvents = async () => {
    if (!userRole || !userData) return;

    setLoading(true);
    setError(null);

    try {
      let params = `?page=${currentPage}&limit=10`; // Show 10 events per page
      let response;

      switch (userRole) {
        case 'STUDENT':
          params += `&schoolId=${userData.schoolId}`;
          response = await apiClient.events.getSchoolEvents(params);
          break;
        case 'TEACHER':
          if (teacherTab === 'school-events') {
            params += `&schoolId=${userData.schoolId}`;
            response = await apiClient.events.getSchoolEvents(params);
          } else {
            response = await apiClient.events.getNGOEvents(params);
          }
          break;
        case 'NGO':
          params += `&ngoId=${userData.ngoId}`;
          response = await apiClient.events.getNGOEvents(params);
          break;
      }

      if (response?.data) {
        const eventData = response.data as { events: Event[], totalPages: number };
        setEvents(eventData.events); // Show all events from response
        setTotalPages(eventData.totalPages || 1); // Set total pages
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events');
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
      const eventData = {
        ...createEventForm,
        latitude: parseFloat(createEventForm.latitude),
        longitude: parseFloat(createEventForm.longitude),
        schoolId: userData.schoolId
      };

      if (userRole === 'NGO') {
        await apiClient.events.createNGOEvent(eventData);
      } else {
        await apiClient.events.createSchoolEvent(eventData);
      }

      // Reset form and switch back to events
      setCreateEventForm({ title: '', description: '', date: '', latitude: '', longitude: '' });
      setCurrentView('events');
      setCurrentPage(1); // Reset to first page
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
      const applicationData = { userId: userData.id, eventId };

      if (userRole === 'NGO') {
        await apiClient.events.applyToNGOEvent(applicationData);
      } else {
        await apiClient.events.applyToSchoolEvent(applicationData);
      }

      alert('Applied successfully!');
    } catch (error) {
      console.error('Error applying:', error);
    }
  };

  const handleQuickRepost = async (event: Event) => {
    if (userRole !== 'TEACHER' || !userData) return;

    try {
      const eventData = {
        title: event.title,
        description: event.description,
        date: event.date,
        latitude: event.latitude,
        longitude: event.longitude,
        schoolId: userData.schoolId
      };

      await apiClient.events.createSchoolEvent(eventData);

      alert('Event reposted successfully!');
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const handleTeacherTabChange = (tab: TeacherTab) => {
    setTeacherTab(tab);
    setCurrentPage(1); // Reset to first page when switching tabs
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
                onClick={() => setCurrentView(currentView === 'events' ? 'create' : 'events')}
                className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {currentView === 'events' ? '+ Create Event' : 'View Events'}
              </button>
            </div>
          )}

          {/* Teacher Tabs */}
          {userRole === 'TEACHER' && currentView === 'events' && (
            <div className="flex mt-3 bg-gray-100 rounded p-1">
              <button
                onClick={() => handleTeacherTabChange('school-events')}
                className={`flex-1 px-3 py-1 text-sm rounded ${teacherTab === 'school-events'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                School
              </button>
              <button
                onClick={() => handleTeacherTabChange('ngo-events')}
                className={`flex-1 px-3 py-1 text-sm rounded ${teacherTab === 'ngo-events'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                NGO
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
                  type="datetime-local"
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
          {currentView === 'events' && (
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
    </>
  );
}
