import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { authService } from "../utils/oauth";
import { useToast } from "@/hooks/use-toast";
import { PWAInstallModal } from "@/components/PWAInstallModal";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import GoogleLogo from "../assets/google.svg";
import GoNaturallyLogo from "../assets/Go_Naturally_SingleLine.svg";

export default function AuthPage() {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const { toast } = useToast();

  // PWA Install functionality
  const { canInstall, isInstalled, isPWA } = usePWAInstall();

  // Auto-show PWA install prompt when page loads
  useEffect(() => {
    console.log("PWA Install Check:", { canInstall, isInstalled, isPWA });

    // Don't show if already installed or running as PWA
    if (isInstalled || isPWA) {
      console.log("PWA already installed or running as PWA");
      return;
    }

    // Don't show if user has already been prompted recently
    const lastPrompted = localStorage.getItem("pwa-install-last-prompted");
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

    if (lastPrompted && now - parseInt(lastPrompted) < oneWeek) {
      console.log("User was prompted recently, skipping");
      return;
    }

    // Clear old prompt data for testing
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem("pwa-install-last-prompted");
    }

    // Show prompt after a delay if installable
    if (canInstall) {
      console.log("Setting timer to show PWA prompt");
      const timer = setTimeout(() => {
        console.log("Showing PWA install prompt");
        setShowPWAPrompt(true);
        localStorage.setItem("pwa-install-last-prompted", now.toString());
      }, 1000); // Show after 1 second on auth page for faster testing

      return () => clearTimeout(timer);
    } else {
      console.log("PWA not installable, canInstall:", canInstall);
    }
  }, [canInstall, isInstalled, isPWA]);

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);

    try {
      await authService.signInWithGoogle(`${window.location.origin}/welcome`);

      toast({
        title: "Redirecting...",
        description: "Taking you to Google for authentication."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: errorMessage
      });
      setOauthLoading(false);
    }
  };

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

      {/* Back Button */}
      <Link
        to="/"
        className="z-0 flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-3 py-1.5 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 absolute left-4 top-6 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </Link>

      <div className="relative z-10 mx-auto w-full max-w-xl p-4">
        <div>
          {/* Logo */}
          <img src={GoNaturallyLogo} alt="Go Naturally Logo" className="h-10 mb-6" />

          {/* Authentication */}
          <div>
            <div className="mb-9 mt-6 space-y-1.5">
              <h1 className="text-2xl font-semibold">Welcome to Go Naturally</h1>
              <p className="text-zinc-400">
                Sign in to start your environmental journey
              </p>
            </div>

            <div>
              <button
                onClick={handleGoogleSignIn}
                disabled={oauthLoading}
                className="relative z-0 items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 px-3 text-zinc-50 transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:translate-y-[200%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-500 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-y-[0%] active:scale-100 flex w-full justify-center py-3"
              >
                <img src={GoogleLogo} alt="Google Logo" className="h-5 w-5" />
                {oauthLoading ? 'Redirecting to Google...' : 'Continue with Google'}
              </button>
            </div>

            <p className="mt-9 text-xs text-zinc-400">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-400 hover:underline">Terms & Conditions</a>{" "}
              and{" "}
              <a href="#" className="text-blue-400 hover:underline">Privacy Policy.</a>
            </p>
          </div>
        </div>
      </div>

      {/* PWA Install Modal */}
      <PWAInstallModal open={showPWAPrompt} setOpen={setShowPWAPrompt} />
    </div>
  );
}
