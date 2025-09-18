/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { apiClient, supabase } from "../lib/apiClient"
import { useNavigate } from 'react-router-dom'
import { useUserStore, type UserRole } from '../store/userStore'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GraduationCap, Users, Heart, ArrowLeft, ChevronRight, Copy, Share2, Check } from "lucide-react"
import GoNaturallyLogo from "../assets/Go_Naturally_SingleLine.svg"
import AvatarCreator from "../components/AvatarCreator"

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
  const { user, accessToken, setUser, setAccessToken, loading, setLoading, setAvatarUrl } = useUserStore();

  // Local state
  const [step, setStep] = useState<'role' | 'action' | 'details' | 'joincode' | 'avatar'>('role')
  const [showAvatarCreator, setShowAvatarCreator] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT')
  const [selectedAction, setSelectedAction] = useState<ActionType>('join')
  const [joinCode, setJoinCode] = useState<string>('')
  const [joinCodeCopied, setJoinCodeCopied] = useState(false)
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
          const userdata = await apiClient.user.getById(session.user.id);
          console.log("Fetched user data:", userdata.data);

          // If user has either schoolId or ngoId, redirect to dashboard
          const userData = userdata.data as { schoolId?: string, ngoId?: string };
          if (userData.schoolId || userData.ngoId) {
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
      const response = await apiClient.user.create(userData);
      console.log('✅ User created successfully:', response.data);
    } catch (error) {
      console.error('❌ Error creating user:', error);
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
      const response: any = selectedRole === 'TEACHER'
        ? await apiClient.organization.createSchool(orgData)
        : await apiClient.organization.createNGO(orgData);

      console.log(`✅ ${orgType} created successfully:`, response.data);

      // Extract joinCode from response
      if (response.data && response.data.org.joinCode) {
        setJoinCode(response.data.org.joinCode);
        return true; // Indicate success
      }
    } catch (error) {
      console.error(`❌ Error creating ${orgType}:`, error);
    }
    return false; // Indicate failure
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
      const response = orgType === 'School'
        ? await apiClient.organization.joinSchool(joinRequestData)
        : await apiClient.organization.joinNGO(joinRequestData);

      console.log('✅ Successfully joined organization:', response.data);
    } catch (error) {
      console.error('❌ Error joining organization:', error);
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
      // For individual users, go directly to avatar step and show creator
      setStep('avatar');
      setShowAvatarCreator(true);
    }
  };

  const handleDetailsSubmit = async () => {
    setLoading(true);

    if (selectedAction === 'create') {
      const success = await createOrganization();
      if (success) {
        // Show join code step for organization creators
        setStep('joincode');
      }
    } else if (selectedAction === 'join') {
      await joinOrganization();
      // After joining organization, go directly to avatar step
      setStep('avatar');
      setShowAvatarCreator(true);
    }

    setLoading(false);
  };

  // Handle avatar creation - automatically navigate to game after creation
  const handleAvatarCreated = async (avatarUrl: string) => {
    console.log('Avatar created:', avatarUrl);
    setAvatarUrl(avatarUrl);
    setShowAvatarCreator(false);

    // Automatically navigate to game after avatar creation
    const userdata = await apiClient.user.getById(user?.id || '');
    console.log("Fetched user data before game navigation:", userdata.data);
    localStorage.setItem('userData', JSON.stringify(userdata.data));
    navigate('/game');
  };

  const handleCloseAvatarCreator = () => {
    setShowAvatarCreator(false);
  };

  // Handle proceeding from join code step
  const handleJoinCodeContinue = () => {
    setStep('avatar');
    setShowAvatarCreator(true);
  };

  // Copy join code to clipboard
  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setJoinCodeCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setJoinCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy join code:', err);
    }
  };



  // Go back function
  const goBack = () => {
    console.log('🔙 Going back from step:', step);

    if (step === 'action') {
      setStep('role');
    } else if (step === 'details') {
      setStep('action');
    } else if (step === 'joincode') {
      setStep('details');
    } else if (step === 'avatar') {
      // Close avatar creator if open and go back to previous step
      setShowAvatarCreator(false);
      if (selectedAction === 'individual') {
        setStep('action');
      } else if (selectedAction === 'create') {
        setStep('joincode');
      } else {
        setStep('details');
      }
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
              className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-zinc-50 transition-colors mb-6 text-sm"
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

          {/* Join Code Display Step */}
          {step === 'joincode' && (
            <div>
              <div className="mb-9 mt-6 space-y-1.5">
                <h2 className="text-2xl font-semibold text-center">
                  {selectedRole === 'TEACHER' ? 'School' : 'NGO'} Created Successfully!
                </h2>
                <p className="text-zinc-400 text-center">
                  Share this code with others to join your {selectedRole === 'TEACHER' ? 'school' : 'NGO'}
                </p>
              </div>

              <div className="space-y-6 mb-6">
                {/* Join Code Display */}
                <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                  <div className="text-center space-y-4">
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
                      {selectedRole === 'TEACHER' ? 'School' : 'NGO'} Join Code
                    </div>
                    <div className="text-3xl font-bold text-zinc-200 bg-zinc-900 rounded-lg p-4 border border-zinc-600 font-mono tracking-wider">
                      {joinCode}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Students and teachers can use this code to join your {selectedRole === 'TEACHER' ? 'school' : 'NGO'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyJoinCode}
                    className="relative z-0 flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100"
                  >
                    {joinCodeCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Join my ${selectedRole === 'TEACHER' ? 'School' : 'NGO'}`,
                          text: `Use this code to join: ${joinCode}`,
                        });
                      }
                    }}
                    className="relative z-0 flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Code
                  </button>
                </div>
              </div>

              <button
                onClick={handleJoinCodeContinue}
                className="rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 w-full"
              >
                Continue to Avatar Creation
              </button>
            </div>
          )}

          {/* Avatar Creation Step */}
          {step === 'avatar' && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-zinc-200">Create Your Avatar</h2>
                <p className="text-zinc-400">
                  Customize your 3D avatar for an immersive experience in the virtual world.
                </p>
              </div>

              <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                <div className="flex items-center justify-center space-x-2 text-zinc-300">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-600 border-t-zinc-300"></div>
                  <span>Opening Avatar Creator...</span>
                </div>
              </div>

              <p className="text-xs text-zinc-500">
                Create your personalized avatar to continue to the game.
              </p>
            </div>
          )}


        </div>
      </div>

      {/* Avatar Creator Modal */}
      {showAvatarCreator && (
        <AvatarCreator
          onAvatarCreated={handleAvatarCreated}
          onClose={handleCloseAvatarCreator}
        />
      )}
    </div>
  );
}
