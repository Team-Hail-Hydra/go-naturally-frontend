import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 1️⃣ Get current session (after OAuth redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user) // contains user info
        console.log("User:", session.user)
        console.log("Access Token:", session.access_token)
      }
    })

    // 2️⃣ Listen for auth changes (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) setUser(session.user)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!user) return <p>Loading...</p>

  return (
    <div>
      <h1>Welcome {user.user_metadata.full_name || user.email}</h1>
      <img src={user.user_metadata.avatar_url} alt="avatar" />
    </div>
  )
}