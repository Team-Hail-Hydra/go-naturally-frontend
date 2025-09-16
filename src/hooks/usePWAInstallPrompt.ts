import { useState, useEffect } from "react";
import { usePWAInstall } from "./usePWAInstall";

// Hook to automatically show PWA install prompt
export const usePWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { canInstall, isInstalled, isPWA } = usePWAInstall();

  useEffect(() => {
    // Don't show if already installed or running as PWA
    if (isInstalled || isPWA) {
      return;
    }

    // Don't show if user has already been prompted recently
    const lastPrompted = localStorage.getItem("pwa-install-last-prompted");
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

    if (lastPrompted && now - parseInt(lastPrompted) < oneWeek) {
      return;
    }

    // Show prompt after a delay if installable
    if (canInstall) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem("pwa-install-last-prompted", now.toString());
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, isPWA]);

  return {
    showPrompt,
    setShowPrompt,
    canInstall,
    isInstalled,
    isPWA,
  };
};
