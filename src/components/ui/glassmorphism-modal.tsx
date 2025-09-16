import React from "react";
import useMeasure from "react-use-measure";
import {
    useDragControls,
    useMotionValue,
    useAnimate,
    motion,
} from "framer-motion";
import { X } from "lucide-react";

interface GlassmorphismModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    isDraggable?: boolean;
    showCloseButton?: boolean;
    showDragHandle?: boolean;
    className?: string;
    onClose?: () => void;
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full"
};

export const GlassmorphismModal: React.FC<GlassmorphismModalProps> = ({
    open,
    setOpen,
    children,
    title,
    subtitle,
    size = "md",
    isDraggable = true,
    showCloseButton = true,
    showDragHandle = true,
    className = "",
    onClose
}) => {
    const [scope, animate] = useAnimate();
    const [drawerRef, { height }] = useMeasure();
    const y = useMotionValue(0);
    const controls = useDragControls();

    const handleClose = async () => {
        if (onClose) {
            onClose();
        }

        animate(scope.current, {
            opacity: [1, 0],
        });

        const yStart = typeof y.get() === "number" ? y.get() : 0;

        await animate("#glassmorphism-drawer", {
            y: [yStart, height],
        });

        setOpen(false);
    };

    return (
        <>
            {open && (
                <motion.div
                    ref={scope}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleClose}
                    className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md"
                >
                    <motion.div
                        id="glassmorphism-drawer"
                        ref={drawerRef}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        transition={{
                            ease: "easeInOut",
                            duration: 0.3
                        }}
                        className={`absolute bottom-0 h-[85vh] w-full overflow-hidden rounded-t-3xl 
                            bg-black/40 backdrop-blur-xl border border-black/30 border-t-white/10
                            shadow-2xl shadow-black/70 ${className}`}
                        style={{ y }}
                        drag={isDraggable ? "y" : false}
                        dragControls={controls}
                        onDragEnd={() => {
                            if (y.get() >= 100) {
                                handleClose();
                            }
                        }}
                        dragListener={false}
                        dragConstraints={{
                            top: 0,
                            bottom: 0,
                        }}
                        dragElastic={{
                            top: 0,
                            bottom: 0.5,
                        }}
                    >
                        {/* Drag Handle */}
                        {showDragHandle && isDraggable && (
                            <div className="absolute left-0 right-0 top-0 z-10 flex justify-center bg-gradient-to-b from-black/20 to-transparent p-4 rounded-t-3xl">
                                <button
                                    onPointerDown={(e) => {
                                        controls.start(e);
                                    }}
                                    className="h-1.5 w-12 cursor-grab touch-none rounded-full bg-white/40 active:cursor-grabbing hover:bg-white/50 transition-colors"
                                ></button>
                            </div>
                        )}

                        {/* Close Button */}
                        {showCloseButton && (
                            <button
                                onClick={handleClose}
                                className="absolute right-4 top-4 z-10 flex items-center justify-center w-9 h-9 rounded-full 
                                    bg-black/30 hover:bg-black/40 backdrop-blur-sm border border-white/20 
                                    transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <X className="h-4 w-4 text-white/80" />
                            </button>
                        )}

                        {/* Content */}
                        <div className={`relative z-0 h-full overflow-y-auto p-6 ${showDragHandle ? 'pt-16' : 'pt-6'}`}>
                            <div className={`mx-auto ${sizeClasses[size]} space-y-6`}>
                                {/* Header */}
                                {(title || subtitle) && (
                                    <div className="text-center space-y-3">
                                        {title && (
                                            <h2 className="text-2xl font-bold text-white/90">
                                                {title}
                                            </h2>
                                        )}
                                        {subtitle && (
                                            <p className="text-white/60 text-sm leading-relaxed">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Children Content */}
                                {children}
                            </div>
                        </div>

                        {/* Glass overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none rounded-t-3xl" />
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

// Glass Card Component for consistent styling
export const GlassCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "interactive" | "solid";
}> = ({ children, className = "", variant = "default" }) => {
    const variantClasses = {
        default: "bg-black/20 backdrop-blur-sm border border-white/10",
        interactive: "bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 hover:border-white/20 transition-all duration-200",
        solid: "bg-black/30 backdrop-blur-md border border-white/20"
    };

    return (
        <div className={`${variantClasses[variant]} rounded-xl ${className}`}>
            {children}
        </div>
    );
};

// Glass Button Component
export const GlassButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}> = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    type = "button"
}) => {
        const variantClasses = {
            primary: "bg-gradient-to-r from-blue-500/80 to-emerald-500/80 hover:from-blue-500/90 hover:to-emerald-500/90 text-white border border-white/20",
            secondary: "bg-black/20 hover:bg-black/30 text-white/90 border border-white/20",
            ghost: "bg-transparent hover:bg-black/20 text-white/80 hover:text-white border border-transparent hover:border-white/20"
        };

        const sizeClasses = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-lg"
        };

        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled}
                className={`
                ${variantClasses[variant]} ${sizeClasses[size]}
                backdrop-blur-sm rounded-lg font-medium
                transition-all duration-200 hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${className}
            `}
            >
                {children}
            </button>
        );
    };