import { useEffect, useState } from "react"
import axios from 'axios'
import { supabase } from "../utils/supabase"
import { useNavigate } from 'react-router-dom'
import { useUserStore, type UserRole } from '../store/userStore'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GraduationCap, Users, Heart, ArrowLeft, ChevronRight } from "lucide-react"
import GoNaturallyLogo from "../assets/Go_Naturally_SingleLine.svg"

type ActionType = 'create' | 'join' | 'individual';

const roleConfig = {
  STUDENT: {
    icon: GraduationCap,
    label: "Student",
    description: "Join schools and access learning resources"
  },
  TEACHER: {
    icon: Users,
    label: "Teacher",
    description: "Create or join schools and manage classes"
  },
  NGO: {
    icon: Heart,
    label: "NGO",
    description: "Create or join NGOs and manage programs"
  }
};

interface CreateOrganizationData {
  name: string;
  email: string;
  phoneNo: string;
}

interface JoinOrganizationData {
  organizationCode: string;
}

export default function Welcome() {
  const navigate = useNavigate();

  // Zustand store
  const { user, accessToken, setUser, setAccessToken, loading, setLoading } = useUserStore();

  // Local state
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
            navigate('/game');
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
      (_event, session) => {
        if (session) {
          setUser(session.user)
          setAccessToken(session.access_token)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [navigate, setUser, setAccessToken, setLoading])

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

  if (loading) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center">
        <div className="text-zinc-200">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center">
        <div className="text-zinc-200">Please log in to continue</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 py-20 text-zinc-200 selection:bg-zinc-600 min-h-screen relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute right-0 top-0 z-0 size-[50vw]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")"
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(100% 100% at 100% 0%, rgba(9,9,11,0), rgba(9,9,11,1))"
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl p-4">
        <div>
          {/* Logo */}
          <img src={GoNaturallyLogo} alt="Go Naturally Logo" className="h-10 mb-6" />

          {/* User Welcome */}
          <div className="text-center mb-8">
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-zinc-700"
            />
            <h1 className="text-xl font-semibold">
              Welcome {user.user_metadata.full_name || user.email}!
            </h1>
          </div>

          {/* Go Back Button */}
          {step !== 'role' && (
            <button
              onClick={goBack}
              className="z-0 flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-3 py-1.5 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          )}

          {/* Role Selection Step */}
          {step === 'role' && (
            <div>
              <div className="mb-9 mt-6 space-y-1.5">
                <h2 className="text-2xl font-semibold text-center">Choose your role</h2>
                <p className="text-zinc-400 text-center">Tell us about yourself to get started</p>
              </div>

              <div className="space-y-3 mb-6">
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                  className="grid gap-3"
                >
                  {Object.entries(roleConfig).map(([role, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={role} className="relative">
                        <RadioGroupItem
                          value={role}
                          id={role}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={role}
                          className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/20"
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-left">{config.label}</div>
                            <div className="text-xs text-zinc-400 text-left">{config.description}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <button
                onClick={handleRoleSubmit}
                disabled={loading}
                className="rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 w-full disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Action Selection Step */}
          {step === 'action' && (
            <div>
              <div className="mb-9 mt-6 space-y-1.5">
                <h2 className="text-2xl font-semibold text-center">What would you like to do?</h2>
                <p className="text-zinc-400 text-center">Choose your next step</p>
              </div>

              <div className="space-y-3 mb-6">
                {selectedRole === 'STUDENT' && (
                  <>
                    <label className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="join"
                        checked={selectedAction === 'join'}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border-2 transition-colors ${selectedAction === 'join' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`}>
                        {selectedAction === 'join' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-[1px]" />}
                      </div>
                      <span className="font-medium">Join a School</span>
                    </label>
                    <label className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="individual"
                        checked={selectedAction === 'individual'}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border-2 transition-colors ${selectedAction === 'individual' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`}>
                        {selectedAction === 'individual' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-[1px]" />}
                      </div>
                      <span className="font-medium">Continue as Individual</span>
                    </label>
                  </>
                )}

                {selectedRole === 'TEACHER' && (
                  <>
                    <label className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="create"
                        checked={selectedAction === 'create'}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border-2 transition-colors ${selectedAction === 'create' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`}>
                        {selectedAction === 'create' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-[1px]" />}
                      </div>
                      <span className="font-medium">Create a School</span>
                    </label>
                    <label className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="join"
                        checked={selectedAction === 'join'}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border-2 transition-colors ${selectedAction === 'join' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`}>
                        {selectedAction === 'join' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-[1px]" />}
                      </div>
                      <span className="font-medium">Join a School</span>
                    </label>
                  </>
                )}

                {selectedRole === 'NGO' && (
                  <>
                    <label className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="create"
                        checked={selectedAction === 'create'}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border-2 transition-colors ${selectedAction === 'create' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`}>
                        {selectedAction === 'create' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-[1px]" />}
                      </div>
                      <span className="font-medium">Create an NGO</span>
                    </label>
                    <label className="relative z-0 flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="join"
                        checked={selectedAction === 'join'}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border-2 transition-colors ${selectedAction === 'join' ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`}>
                        {selectedAction === 'join' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-[1px]" />}
                      </div>
                      <span className="font-medium">Join an NGO</span>
                    </label>
                  </>
                )}
              </div>

              <button
                onClick={handleActionSubmit}
                className="rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 w-full"
              >
                Continue
              </button>
            </div>
          )}

          {/* Details Form Step - Create Organization */}
          {step === 'details' && selectedAction === 'create' && (
            <div>
              <div className="mb-9 mt-6 space-y-1.5">
                <h2 className="text-2xl font-semibold text-center">
                  {selectedRole === 'TEACHER' ? 'Create School' : 'Create NGO'}
                </h2>
                <p className="text-zinc-400 text-center">Fill in the organization details</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-zinc-400 font-medium mb-2">
                    {selectedRole === 'TEACHER' ? 'School Name' : 'NGO Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`Enter ${selectedRole === 'TEACHER' ? 'school' : 'NGO'} name`}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700 text-zinc-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={`Enter ${selectedRole === 'TEACHER' ? 'school' : 'NGO'} email`}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700 text-zinc-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNo: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700 text-zinc-200"
                    required
                  />
                </div>
              </div>

              <button
                onClick={handleDetailsSubmit}
                disabled={loading || !formData.name || !formData.email || !formData.phoneNo}
                className="rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 w-full disabled:opacity-50"
              >
                {loading ? 'Creating...' : `Create ${selectedRole === 'TEACHER' ? 'School' : 'NGO'}`}
              </button>
            </div>
          )}

          {/* Details Form Step - Join Organization - Simplified */}
          {step === 'details' && selectedAction === 'join' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center text-zinc-200">
                Join {selectedRole === 'STUDENT' || selectedRole === 'TEACHER' ? 'School' : 'NGO'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 font-medium mb-2">
                    {selectedRole === 'STUDENT' || selectedRole === 'TEACHER' ? 'School Code' : 'NGO Code'}
                  </label>
                  <input
                    type="text"
                    value={joinData.organizationCode}
                    onChange={(e) => setJoinData(prev => ({ ...prev, organizationCode: e.target.value }))}
                    placeholder="Enter organization code"
                    className="w-full border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700 text-zinc-200 rounded-md"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Ask your organization administrator for the invite code
                  </p>
                </div>
              </div>

              <button
                onClick={handleDetailsSubmit}
                disabled={loading || !joinData.organizationCode}
                className="rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 w-full disabled:opacity-50"
              >
                {loading ? 'Verifying Code...' : 'Join Organization'}
              </button>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="text-green-500 text-6xl mb-6">✓</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Setup Complete!</h2>
                <p className="text-zinc-400">
                  {selectedAction === 'create'
                    ? `Your ${selectedRole === 'TEACHER' ? 'school' : 'NGO'} has been created successfully.`
                    : selectedAction === 'join'
                      ? `Successfully joined organization!`
                      : 'You can now continue as an individual student.'
                  }
                </p>
              </div>
              <button
                onClick={handleContinueToDashboard}
                className="rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 w-full"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
