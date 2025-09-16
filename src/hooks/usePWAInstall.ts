import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<void>;
  canInstall: boolean;
  isInstalled: boolean;
}

export const usePWAInstall = (): UsePWAInstallReturn => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkIfPWA = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      const fullscreen = window.matchMedia(
        "(display-mode: fullscreen)"
      ).matches;
      const minimal = window.matchMedia("(display-mode: minimal-ui)").matches;

      return (
        standalone ||
        fullscreen ||
        minimal ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true
      );
    };

    // Check if iOS device
    const checkIfIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream
      );
    };

    setIsPWA(checkIfPWA());
    setIsIOS(checkIfIOS());
    setIsStandalone(checkIfPWA());

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event received", e);
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log("appinstalled event received");
      setDeferredPrompt(null);
      setIsInstallable(false);
      localStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the A2HS prompt");
        localStorage.setItem("pwa-install-prompted", "true");
      } else {
        console.log("User dismissed the A2HS prompt");
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Error prompting install:", error);
    }
  };

  const canInstall = isInstallable || (isIOS && !isStandalone);
  const isInstalled = isPWA || localStorage.getItem("pwa-installed") === "true";

  return {
    isInstallable,
    isPWA,
    isIOS,
    isStandalone,
    promptInstall,
    canInstall,
    isInstalled,
  };
};
