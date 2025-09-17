import { motion } from 'framer-motion';
import GoNaturallyLogo from '../assets/Go_Naturally.svg';

interface LoadingScreenProps {
    isLoading: boolean;
    title?: string;
    subtitle?: string;
}

const LoadingScreen = ({
    isLoading,
    title = "Go Naturally",
    subtitle = "Loading your natural experience..."
}: LoadingScreenProps) => {
    if (!isLoading) return null;

    return (
        <motion.div
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <div className="text-center">
                <motion.div
                    className="relative mb-8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                >
                    <img
                        src={GoNaturallyLogo}
                        alt="Go Naturally Logo"
                        className="h-16 md:h-20 mx-auto mb-4"
                    />
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-white/70 text-base md:text-lg">{subtitle}</p>
                </motion.div>

                {/* Loading Animation */}
                <motion.div
                    className="flex justify-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-3 h-3 bg-nature-green-400 rounded-full"
                            animate={{
                                y: [-8, 8, -8],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </motion.div>

                {/* Progress text */}
                <motion.p
                    className="text-white/50 text-sm mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
                >
                    Preparing your adventure...
                </motion.p>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;