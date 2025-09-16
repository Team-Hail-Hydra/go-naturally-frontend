import React from "react";
import { Download, Smartphone, Monitor, Apple } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { GlassmorphismModal, GlassCard, GlassButton } from "@/components/ui/glassmorphism-modal";

interface PWAInstallModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ open, setOpen }) => {
    const { promptInstall, isIOS, canInstall } = usePWAInstall();

    const handleInstall = async () => {
        if (isIOS) {
            // For iOS, we can't programmatically install, so we show instructions
            return;
        }

        try {
            await promptInstall();
            setOpen(false);
        } catch (error) {
            console.error('Failed to install PWA:', error);
        }
    };

    const IOSInstructions = () => (
        <GlassCard className="p-4" variant="solid">
            <div className="flex items-center gap-3">
                <Apple className="h-6 w-6 text-white/80 flex-shrink-0" />
                <div className="text-sm text-white/90">
                    <p className="font-medium mb-1">Install on iOS Safari:</p>
                    <ol className="list-decimal list-inside space-y-1 text-white/70">
                        <li>Tap the Share button <span className="inline-block w-4 h-4 bg-blue-500 rounded-sm mx-1"></span></li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to install the app</li>
                    </ol>
                </div>
            </div>
        </GlassCard>
    );

    const AndroidInstructions = () => (
        <GlassCard className="p-4" variant="solid">
            <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-white/80 flex-shrink-0" />
                <div className="text-sm text-white/90">
                    <p className="font-medium mb-1">Install on Android Chrome:</p>
                    <p className="text-white/70">Tap the install button below or use the browser's menu → "Add to Home screen"</p>
                </div>
            </div>
        </GlassCard>
    );

    const DesktopInstructions = () => (
        <GlassCard className="p-4" variant="solid">
            <div className="flex items-center gap-3">
                <Monitor className="h-6 w-6 text-white/80 flex-shrink-0" />
                <div className="text-sm text-white/90">
                    <p className="font-medium mb-1">Install on Desktop:</p>
                    <p className="text-white/70">Click the install button below or look for the install icon in your browser's address bar</p>
                </div>
            </div>
        </GlassCard>
    );

    return (
        <GlassmorphismModal
            open={open}
            setOpen={setOpen}
            title="Install Go Naturally"
            subtitle="Get the full app experience! Install Go Naturally on your device for faster access, offline features, and a native app feel."
            size="md"
        >
            {/* App Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400/80 to-emerald-600/80 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center">
                    <Download className="h-8 w-8 text-white" />
                </div>
            </div>

            {/* Benefits */}
            <GlassCard className="p-4 mb-6" variant="default">
                <h3 className="text-lg font-semibold text-white/90 mb-3">Why install?</h3>
                <ul className="space-y-3 text-sm text-white/80">
                    <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Access even when offline</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Faster loading and smoother experience</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Native app-like interface</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Push notifications for updates</span>
                    </li>
                </ul>
            </GlassCard>

            {/* Platform-specific instructions */}
            <div className="mb-6">
                {isIOS ? <IOSInstructions /> :
                    /Android/.test(navigator.userAgent) ? <AndroidInstructions /> :
                        <DesktopInstructions />}
            </div>

            {/* Install Button */}
            {canInstall && !isIOS && (
                <GlassButton
                    onClick={handleInstall}
                    variant="primary"
                    size="lg"
                    className="w-full mb-4"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Install App
                </GlassButton>
            )}

            {/* Maybe Later Button */}
            <GlassButton
                onClick={() => setOpen(false)}
                variant="ghost"
                size="md"
                className="w-full"
            >
                Maybe later
            </GlassButton>
        </GlassmorphismModal>
    );
};

