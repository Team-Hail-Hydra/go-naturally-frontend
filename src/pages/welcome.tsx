import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import axios from 'axios'
import { supabase } from "../utils/supabase"
import { useNavigate } from 'react-router-dom' // Make sure this is imported

type UserRole = 'STUDENT' | 'TEACHER' | 'NGO';
type ActionType = 'create' | 'join' | 'individual';

interface CreateOrganizationData {
  name: string;
  email: string;
  phoneNo: string;
}

interface JoinOrganizationData {
  organizationCode: string;
}

export default function Welcome() {
  const navigate = useNavigate(); // Add this hook
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'role' | 'action' | 'details' | 'complete'>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT')
  const [selectedAction, setSelectedAction] = useState<ActionType>('join')
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    email: '',
    phoneNo: ''
  })
  const [joinData, setJoinData] = useState<JoinOrganizationData>({
    organizationCode: ''
  })
  const [accessToken, setAccessToken] = useState<string>('')

  useEffect(() => {
    // Get current session (after OAuth redirect)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setAccessToken(session.access_token)
        console.log("User:", session.user)
        console.log("Access Token:", session.access_token)

        try {
          // Check if user already belongs to a school or NGO
          const userdata = await axios.get(`http://localhost:3000/api/v1/user/${session.user.id}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          console.log("Fetched user data:", userdata.data);

          // If user has either schoolId or ngoId, redirect to dashboard
          if (userdata.data.schoolId || userdata.data.ngoId) {
            console.log("User already has organization, redirecting to dashboard");
            localStorage.setItem('userData', JSON.stringify(userdata.data));
            navigate('/dashboard');
            return;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }

        // Check if user already has a role set
        if (session.user.user_metadata?.role) {
          setSelectedRole(session.user.user_metadata.role)
          setStep('action')
          console.log("Existing role found:", session.user.user_metadata.role)
        }
      }
      setLoading(false)
    })



    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user)
          setAccessToken(session.access_token)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // API call to create user
  const createUser = async () => {
    if (!user || !accessToken) return;

    const userData = {
      fullName: user.user_metadata.full_name || user.email,
      email: user.email,
      profilePic: user.user_metadata.avatar_url,
      role: selectedRole,
      userId: user.id
    };

    console.log('📤 Creating user with data:', userData);

    try {
      const response = await axios.post('http://localhost:3000/api/v1/user', userData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('✅ User created successfully:', response.data);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
    }
  };

  // API call to create organization (school/ngo)
  const createOrganization = async () => {
    if (!user || !accessToken) return;

    const orgType = selectedRole === 'TEACHER' ? 'School' : 'NGO';
    const orgData = {
      name: formData.name,
      email: formData.email,
      phoneNo: formData.phoneNo,
    };

    console.log(`📤 Creating ${orgType} with data:`, orgData);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/org/${orgType}`, orgData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log(`✅ ${orgType} created successfully:`, response.data);
    } catch (error) {
      console.error(`❌ Error creating ${orgType}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
    }
  };

  // API call to join organization - simplified to only use organization code
  const joinOrganization = async () => {
    if (!user || !accessToken) return;

    const orgType = selectedRole === 'TEACHER' || selectedRole === 'STUDENT' ? 'School' : 'NGO';

    const joinRequestData = {
      user_id: user.id,
      user_name: user.user_metadata.full_name || user.email,
      organization_code: joinData.organizationCode
    };

    console.log('📤 Joining organization with data:', joinRequestData);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/org/join/${orgType}`, joinRequestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('✅ Successfully joined organization:', response.data);
    } catch (error) {
      console.error('❌ Error joining organization:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
    }
  };

  const handleRoleSubmit = async () => {
    setLoading(true);

    console.log('📤 Updating user metadata with role:', selectedRole);

    // Update user metadata with selected role
    await supabase.auth.updateUser({
      data: { role: selectedRole }
    });

    // Create user in backend
    await createUser();

    setStep('action');
    setLoading(false);
  };

  const handleActionSubmit = () => {
    console.log('📋 Selected action:', selectedAction);

    if (selectedAction === 'create' || selectedAction === 'join') {
      setStep('details');
    } else {
      setStep('complete');
    }
  };

  const handleDetailsSubmit = async () => {
    setLoading(true);

    if (selectedAction === 'create') {
      await createOrganization();
    } else if (selectedAction === 'join') {
      await joinOrganization();
    }

    setStep('complete');
    setLoading(false);
  };

  // Handle continue to dashboard - NEW FUNCTION
  const handleContinueToDashboard = async () => {
    // console.log('💾 Storing role in sessionStorage:', selectedRole);
    // console.log('🧭 Navigating to dashboard');

    // // Store role in sessionStorage
    // sessionStorage.setItem('userRole', selectedRole);

    // // Store additional user info in sessionStorage if needed
    // sessionStorage.setItem('userName', user?.user_metadata.full_name || user?.email || '');
    // sessionStorage.setItem('userEmail', user?.email || '');
    // sessionStorage.setItem('userId', user?.id || '');

    const userdata = await axios.get(`http://localhost:3000/api/v1/user/${user?.id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log("Fetched user data before dashboard navigation:", userdata.data);
    localStorage.setItem('userData', JSON.stringify(userdata.data));
    // Navigate to dashboard
    navigate('/dashboard');
  };

  // Go back function
  const goBack = () => {
    console.log('🔙 Going back from step:', step);

    if (step === 'action') {
      setStep('role');
    } else if (step === 'details') {
      setStep('action');
    } else if (step === 'complete') {
      setStep('details');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to continue</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <img
            src={user.user_metadata.avatar_url}
            alt="avatar"
            className="w-16 h-16 rounded-full mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">
            Welcome {user.user_metadata.full_name || user.email}!
          </h1>
        </div>

        {/* Go Back Button */}
        {step !== 'role' && (
          <button
            onClick={goBack}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>
        )}

        {/* Role Selection Step */}
        {step === 'role' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Select your role</h2>
            <div className="space-y-3">
              {(['STUDENT', 'TEACHER', 'NGO'] as UserRole[]).map((role) => (
                <label key={role} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="mr-3"
                  />
                  <span className="capitalize font-medium">{role}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleRoleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Action Selection Step */}
        {step === 'action' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              What would you like to do?
            </h2>

            <div className="space-y-3">
              {selectedRole === 'STUDENT' && (
                <>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="join"
                      checked={selectedAction === 'join'}
                      onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                      className="mr-3"
                    />
                    <span>Join a school</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="individual"
                      checked={selectedAction === 'individual'}
                      onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                      className="mr-3"
                    />
                    <span>Continue as individual</span>
                  </label>
                </>
              )}

              {selectedRole === 'TEACHER' && (
                <>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="create"
                      checked={selectedAction === 'create'}
                      onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                      className="mr-3"
                    />
                    <span>Create a school</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="join"
                      checked={selectedAction === 'join'}
                      onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                      className="mr-3"
                    />
                    <span>Join a school</span>
                  </label>
                </>
              )}

              {selectedRole === 'NGO' && (
                <>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="create"
                      checked={selectedAction === 'create'}
                      onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                      className="mr-3"
                    />
                    <span>Create an NGO</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="join"
                      checked={selectedAction === 'join'}
                      onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                      className="mr-3"
                    />
                    <span>Join an NGO</span>
                  </label>
                </>
              )}
            </div>

            <button
              onClick={handleActionSubmit}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        )}

        {/* Details Form Step - Create Organization */}
        {step === 'details' && selectedAction === 'create' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              {selectedRole === 'TEACHER' ? 'Create School' : 'Create NGO'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {selectedRole === 'TEACHER' ? 'School Name' : 'NGO Name'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter ${selectedRole === 'TEACHER' ? 'school' : 'NGO'} name`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={`Enter ${selectedRole === 'TEACHER' ? 'school' : 'NGO'} email`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNo: e.target.value }))}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              onClick={handleDetailsSubmit}
              disabled={loading || !formData.name || !formData.email || !formData.phoneNo}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : `Create ${selectedRole === 'TEACHER' ? 'School' : 'NGO'}`}
            </button>
          </div>
        )}

        {/* Details Form Step - Join Organization - Simplified */}
        {step === 'details' && selectedAction === 'join' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              Join {selectedRole === 'STUDENT' || selectedRole === 'TEACHER' ? 'School' : 'NGO'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {selectedRole === 'STUDENT' || selectedRole === 'TEACHER' ? 'School Code' : 'NGO Code'}
                </label>
                <input
                  type="text"
                  value={joinData.organizationCode}
                  onChange={(e) => setJoinData(prev => ({ ...prev, organizationCode: e.target.value }))}
                  placeholder="Enter organization code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your organization administrator for the invite code
                </p>
              </div>
            </div>

            <button
              onClick={handleDetailsSubmit}
              disabled={loading || !joinData.organizationCode}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying Code...' : 'Join Organization'}
            </button>
          </div>
        )}

        {/* Complete Step - UPDATED WITH SESSION STORAGE AND NAVIGATION */}
        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold">Setup Complete!</h2>
            <p className="text-gray-600">
              {selectedAction === 'create'
                ? `Your ${selectedRole === 'TEACHER' ? 'school' : 'NGO'} has been created successfully.`
                : selectedAction === 'join'
                  ? `Successfully joined organization!`
                  : 'You can now continue as an individual student.'
              }
            </p>
            <button
              onClick={handleContinueToDashboard}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
