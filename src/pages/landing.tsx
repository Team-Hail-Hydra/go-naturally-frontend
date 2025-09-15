import { motion, useScroll, useTransform, useMotionTemplate, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import GoNaturallyLogo from "../assets/Go_Naturally_SingleLine.svg";
import { useScrollDirection } from "../hooks/useScrollDirection";
import { parseSRT, getCurrentSubtitle, type Subtitle } from "../utils/srtParser";
import { SRT_CONTENT } from "../constants/landing_page_video_subtitles";
import AppScreenShot1 from "../assets/ss1.png";
import { type TeamMember, teamMembers } from "@/constants/team";

// Video Control Bar Component
const VideoControlBar = ({ videoRef, isVisible }: { videoRef: React.RefObject<HTMLVideoElement>; isVisible: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [progress, setProgress] = useState(0);
    const [hasEnded, setHasEnded] = useState(false);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (hasEnded) {
                // Replay the video
                videoRef.current.currentTime = 0;
                videoRef.current.play();
                setHasEnded(false);
                setIsPlaying(true);
            } else if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    // Parse SRT content on component mount
    useEffect(() => {
        const parsedSubtitles = parseSRT(SRT_CONTENT);
        setSubtitles(parsedSubtitles);
    }, []);

    // Sync play state with video and update captions
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        const handleTimeUpdate = () => {
            const currentTime = video.currentTime;
            const duration = video.duration;

            // Update subtitle
            const subtitle = getCurrentSubtitle(subtitles, currentTime);
            setCurrentSubtitle(subtitle);

            // Update progress (0 to 100)
            if (duration && duration > 0 && !isNaN(duration)) {
                const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
                setProgress(progressPercent);
            }
        };

        const handleLoadedData = () => {
            // Reset progress when video metadata is loaded
            setProgress(0);
        };

        const handleEnded = () => {
            setProgress(100);
            setIsPlaying(false);
            setHasEnded(true);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('ended', handleEnded); return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('ended', handleEnded);
        };
    }, [videoRef, subtitles]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100vw-2rem)] min-w-[320px] max-w-4xl bg-black/80 backdrop-blur-md border border-white/20 rounded-full px-3 md:px-6 py-2 md:py-3 flex items-center gap-2 md:gap-4 "
        >
            {/* Animated Progress Background */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-400/25 to-gray-300/20 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ transformOrigin: "left center" }}
            />

            <button
                onClick={togglePlayPause}
                className="relative z-10 text-white hover:text-blue-400 transition-colors p-1.5 md:p-2 hover:bg-white/10 rounded-full flex-shrink-0"
                aria-label={hasEnded ? "Replay video" : isPlaying ? "Pause video" : "Play video"}
            >
                {hasEnded ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                ) : isPlaying ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            <div className="relative z-10 flex-1 text-center px-2 md:px-4 min-w-0">
                <div className="overflow-hidden">
                    <span className="text-white/90 text-sm md:text-xl font-medium block leading-relaxed tracking-wide line-clamp-2 md:line-clamp-1">
                        {currentSubtitle ? currentSubtitle.text : ""}
                    </span>
                </div>
            </div>
            <button
                onClick={toggleMute}
                className={`relative z-10 text-white hover:text-green-400 transition-colors p-1.5 md:p-2 hover:bg-white/10 rounded-full flex-shrink-0 ${isMuted ? 'pulse-unmute' : ''}`}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
                {isMuted ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                )}
            </button>
        </motion.div>
    );
};

// Animated Counter Component
interface CounterProps {
    value: number;
    suffix?: string;
    label: string;
    duration?: number;
}

const AnimatedCounter = ({ value, suffix = "", label, duration = 2 }: CounterProps) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    useEffect(() => {
        if (!isInView) return;

        let startTime: number;
        let animationId: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentCount = easeOutCubic * value;

            setCount(currentCount);

            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        // Add a small delay to ensure proper triggering
        setTimeout(() => {
            animationId = requestAnimationFrame(animate);
        }, 100);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isInView, value, duration]);

    // Format the display value based on whether it's a decimal
    const displayValue = value % 1 === 0 ? Math.floor(count).toLocaleString() : count.toFixed(1);

    return (
        <motion.div
            ref={ref}
            className="flex w-full md:w-72 flex-col items-center py-6 md:py-8 sm:py-0"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <p className="mb-2 text-center text-4xl md:text-6xl lg:text-5xl font-bold">
                <span className="text-nature-green-400">{displayValue}</span><span className="text-2xl md:text-4xl lg:text-3xl">{suffix}</span>
            </p>
            <p className="max-w-64 md:max-w-56 text-center text-white/70 text-sm md:text-base leading-relaxed px-2">
                {label}
            </p>
        </motion.div>
    );
};

// Environmental Stats Counter Component
const EnvironmentalStatsCounter = () => {
    return (
        <motion.div
            className="flex flex-col items-center justify-center md:flex-row mt-16 md:mt-24 mb-6 md:mb-8 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 2.2 }}
        >
            <AnimatedCounter
                value={38.2}
                suffix=" Billion Tons"
                label="CO₂ emissions from fossil fuels and industry in 2024 globally"
                duration={3}
            />
            <div className="h-[1px] w-16 bg-gradient-to-r from-red-400/50 to-orange-400/50 md:h-12 md:w-[1px] my-4 md:my-0"></div>
            <AnimatedCounter
                value={1.7}
                suffix=" Million Hectares"
                label="Amazon rainforest lost to deforestation in 2024 alone"
                duration={2.5}
            />
            <div className="h-[1px] w-16 bg-gradient-to-r from-orange-400/50 to-blue-400/50 md:h-12 md:w-[1px] my-4 md:my-0"></div>
            <AnimatedCounter
                value={220}
                suffix=" Million Tons"
                label="Plastic waste generated globally in 2024, harming ecosystems"
                duration={3.2}
            />
        </motion.div>
    );
};

// Environmental Impact Scroll Section Component
const EnvironmentalScrollSection = ({ videoRef, setShowControls }: VideoControlsProps) => {
    return (
        <div className="relative w-full bg-black/30 backdrop-blur-[4px] z-10 environmental-scroll-section">
            <CenterVideo videoRef={videoRef} setShowControls={setShowControls} />
            <ParallaxImages />
        </div>
    );
};

// Video control state management
interface VideoControlsProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    setShowControls: (show: boolean) => void;
}

// Center growing video component
const CenterVideo = ({ videoRef, setShowControls }: VideoControlsProps) => {
    const { scrollY } = useScroll();

    const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
    const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);

    const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

    const backgroundSize = useTransform(
        scrollY,
        [0, 1500],
        [1.2, 1.0] // Changed from ["170%", "100%"] to [1.2, 1.0] to limit scaling
    );

    // Check if hero section is out of view (assuming hero is ~70vh)
    const heroHeight = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 0;
    const isVideoVisible = useTransform(scrollY, (value) => value > heroHeight);

    // Handle video play/pause based on scroll position
    useEffect(() => {
        const unsubscribe = isVideoVisible.on("change", (visible) => {
            if (videoRef.current) {
                if (visible) {
                    videoRef.current.play();
                    setShowControls(true);
                } else {
                    videoRef.current.pause();
                    setShowControls(false);
                }
            }
        });

        return unsubscribe;
    }, [isVideoVisible, videoRef, setShowControls]);

    return (
        <motion.div
            className="sticky top-0 h-screen w-full overflow-hidden"
            style={{
                clipPath,
            }}
        >
            <motion.video
                ref={videoRef}
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                style={{
                    scale: backgroundSize,
                }}
            >
                <source src="/go_naturally_landing_video_v2.webm" type="video/webm" />
            </motion.video>
        </motion.div>
    );
};

// Parallax images for environmental degradation
const ParallaxImages = () => {
    return (
        <div className="absolute mx-auto min-w-[100%] max-w-[900px] px-4 pt-[200px]">
            <ParallaxImg
                src="https://terrapass.com/wp-content/uploads/2025/02/AdobeStock_345374024-1-scaled-1.jpeg"
                alt="Industrial pollution and smokestacks"
                start={-200}
                end={200}
                className="w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Industrial Pollution"
                description="Factory emissions contribute to air pollution and climate change, affecting ecosystems worldwide."
            />
            <ParallaxImg
                src="https://www.reusethisbag.com/wp-content/uploads/2021/08/ocean-pollution-plastics.jpg.webp"
                alt="Plastic waste in ocean"
                start={700}
                end={-50}
                className="ml-auto w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Ocean Plastic Crisis"
                description="Millions of tons of plastic waste pollute our oceans, harming marine life and ecosystems."
            />
            <ParallaxImg
                src="https://sentientmedia.org/wp-content/uploads/2022/07/Story-Images-41.jpg"
                alt="Deforestation and tree cutting"
                start={700}
                end={400}
                className="ml-auto lg:ml-[65%] w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Deforestation Crisis"
                description="Rapid deforestation destroys habitats and reduces our planet's capacity to absorb CO2."
            />
            <ParallaxImg
                src="https://miro.medium.com/1*Gd66fnHEHeBsNkhfPQQMVA.jpeg"
                alt="Landfill waste and environmental damage"
                start={400}
                end={-200}
                className="ml-0 sm:ml-12 md:ml-24 w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Waste Accumulation"
                description="Overflowing landfills and improper waste management threaten soil and water quality."
            />
            {/* New, non-repeating cards */}
            <ParallaxImg
                src="https://static.scientificamerican.com/sciam/cache/file/8A0A57E0-4FA4-42DC-A44267E8D5D8C94C_source.png"
                alt="Melting glaciers due to climate change"
                start={800}
                end={400}
                className="ml-0 sm:ml-12 md:ml-24 w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Melting Glaciers"
                description="Rising global temperatures are accelerating glacier melt, threatening freshwater supplies and sea levels."
            />
            <ParallaxImg
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoIRUNABFITWkEhQ_YFUq1-0vpxu97U_OjwQ&s"
                alt="Overfishing of oceans"
                start={1200}
                end={600}
                className="ml-auto lg:ml-[60%] w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Overfishing"
                description="Unsustainable fishing practices deplete fish populations and damage marine ecosystems."
            />
            <ParallaxImg
                src="https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2010/04/20/Indian-farmer-drought.jpg?width=465&dpr=1&s=none&crop=none"
                alt="Drought and desertification"
                start={1400}
                end={700}
                className="ml-0 sm:ml-12 md:ml-24 w-full sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3"
                title="Drought & Desertification"
                description="Changing climate and deforestation are causing severe droughts and expanding deserts worldwide."
            />
        </div>
    );
};

// Individual parallax image component
interface ParallaxImgProps {
    className: string;
    alt: string;
    src: string;
    start: number;
    end: number;
    title: string;
    description: string;
}

const ParallaxImg = ({ className, alt, src, start, end, title, description }: ParallaxImgProps) => {
    const ref = useRef(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`${start}px end`, `end ${end * -1}px`],
    });

    const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
    const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);

    const y = useTransform(scrollYProgress, [0, 1], [start, end]);
    const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

    return (
        <motion.div
            ref={ref}
            className={`${className} mb-8 md:mb-12 relative group`}
            style={{ transform, opacity }}
        >
            <img
                src={src}
                alt={alt}
                className="w-full h-auto rounded-lg shadow-2xl object-cover min-h-[200px] md:min-h-[250px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg transition-opacity duration-300">
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4 text-white">
                    <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2 text-red-400">{title}</h3>
                    <p className="text-xs md:text-sm text-white/90 leading-relaxed">{description}</p>
                </div>
            </div>
        </motion.div>
    );
};

// 3D Phone Components
const FloatingPhone = () => {
    return (
        <div
            style={{
                transformStyle: "preserve-3d",
                transform: "rotateY(-30deg) rotateX(15deg)",
            }}
            className="rounded-[24px] bg-green-500"
        >
            <motion.div
                initial={{
                    transform: "translateZ(8px) translateY(-2px)",
                }}
                animate={{
                    transform: "translateZ(32px) translateY(-8px)",
                }}
                transition={{
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: 2,
                    ease: "easeInOut",
                }}
                className="relative h-[470px] w-[250px] rounded-[24px] border-2 border-b-4 border-r-4 border-white border-l-neutral-200 border-t-neutral-200 bg-neutral-900 p-1 pl-[3px] pt-[3px]"
            >
                <HeaderBar />
                <Screen />
            </motion.div>
        </div>
    );
};

const HeaderBar = () => {
    return (
        <>
            <div className="absolute left-[50%] top-2.5 z-10 h-2 w-16 -translate-x-[50%] rounded-md bg-neutral-900"></div>
            <div className="absolute right-3 top-2 z-10 flex gap-2">
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-2.87m-4-1a9 9 0 010-12M9 12l2 2 4-4" />
                </svg>
            </div>
        </>
    );
};

const Screen = () => {
    return (
        <div className="relative z-0 grid h-full w-full place-content-center overflow-hidden rounded-[20px">
            <img
                src={AppScreenShot1}
                alt="App Screenshot"
                className="absolute h-full w-full object-cover"
            ></img>

            <button className="absolute bottom-4 left-4 right-4 z-10 rounded-lg border-[1px] bg-white py-2 text-sm font-medium text-green-500 backdrop-blur border-green-500 hover:bg-green-50 transition-colors">
                Download Now
            </button>

            <div className="absolute -bottom-72 left-[50%] h-96 w-96 -translate-x-[50%] rounded-full bg-green-700" />
        </div>
    );
};

const TeamSection = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const x = useTransform(scrollYProgress, [0, 1], ["1%", "-80%"]);

    return (
        <section id="team-section" ref={targetRef} className="relative h-[200vh] md:h-[300vh] bg-black/30 backdrop-blur-[4px] z-10">
            <div className="sticky top-16 flex h-screen items-center overflow-hidden">
                <div className="w-full absolute top-16 md:top-20 left-1/2 transform -translate-x-1/2 z-20 px-4">
                    <motion.h2
                        className="text-4xl md:text-6xl font-bold text-white text-center mb-2 md:mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        Meet Our Team
                    </motion.h2>
                    <motion.p
                        className="text-white/80 text-lg md:text-xl text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    >
                        Passionate individuals working to make a difference
                    </motion.p>
                </div>
                <motion.div style={{ x }} className="flex gap-4 md:gap-6 pl-[5%]">
                    {teamMembers.map((member) => {
                        return <TeamCard member={member} key={member.id} />;
                    })}
                </motion.div>
            </div>
        </section>
    );
};

const TeamCard = ({ member }: { member: TeamMember }) => {
    return (
        <div className="group relative h-[350px] w-[280px] md:h-[500px] md:w-[350px] overflow-hidden bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl flex-shrink-0">
            <div
                className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-110 bg-cover bg-center"
                style={{ backgroundImage: `url(${member.image})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-nature-green-400">{member.name}</h3>
                    <p className="text-sm md:text-lg font-semibold mb-2 md:mb-3 text-blue-400">{member.role}</p>
                    <p className="text-white/90 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">{member.description}</p>
                    <div className="flex gap-2 md:gap-3">
                        <motion.a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 md:p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </motion.a>
                        <motion.a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 md:p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Mobile Navigation Components
const VARIANTS = {
    top: {
        open: {
            rotate: ["0deg", "0deg", "45deg"],
            top: ["35%", "50%", "50%"],
        },
        closed: {
            rotate: ["45deg", "0deg", "0deg"],
            top: ["50%", "50%", "35%"],
        },
    },
    middle: {
        open: {
            rotate: ["0deg", "0deg", "-45deg"],
        },
        closed: {
            rotate: ["-45deg", "0deg", "0deg"],
        },
    },
    bottom: {
        open: {
            rotate: ["0deg", "0deg", "45deg"],
            bottom: ["35%", "50%", "50%"],
            left: "50%",
        },
        closed: {
            rotate: ["45deg", "0deg", "0deg"],
            bottom: ["50%", "50%", "35%"],
            left: "calc(50% + 10px)",
        },
    },
};

const AnimatedHamburgerButton = ({ active, setActive }: { active: boolean; setActive: (active: boolean) => void }) => {
    return (
        <motion.button
            initial={false}
            animate={active ? "open" : "closed"}
            onClick={() => setActive(!active)}
            className="relative h-12 w-12 rounded-full bg-white/0 transition-colors hover:bg-white/20 md:hidden"
            transition={{
                duration: 0.5,
                ease: "easeInOut",
            }}
        >
            <motion.span
                variants={VARIANTS.top}
                className="absolute h-0.5 w-6 bg-white"
                style={{ y: "-50%", left: "50%", x: "-50%", top: "35%" }}
            />
            <motion.span
                variants={VARIANTS.middle}
                className="absolute h-0.5 w-6 bg-white"
                style={{ left: "50%", x: "-50%", top: "50%", y: "-50%" }}
            />
            <motion.span
                variants={VARIANTS.bottom}
                className="absolute h-0.5 w-4 bg-white"
                style={{
                    x: "-50%",
                    y: "50%",
                    bottom: "35%",
                    left: "calc(50% + 5px)",
                }}
            />
        </motion.button>
    );
};

const MobileSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const sidebarVariants = {
        open: { x: 0 },
        closed: { x: "-100%" }
    };

    const overlayVariants = {
        open: { opacity: 1 },
        closed: { opacity: 0 }
    };

    const navItems = [
        { name: "The Problem", id: "#environmental-section", color: "text-nature-green-400" },
        { name: "Our Solution", id: "#solution-section", color: "text-blue-400" },
        { name: "Team", id: "#team-section", color: "text-emerald-400" },
        { name: "Download", id: "#download-section", color: "text-yellow-400" },
    ];

    const handleNavClick = (id: string) => {
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                onClick={onClose}
            />

            {/* Sidebar */}
            <motion.div
                className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-md border-r border-white/20 z-50 md:hidden"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <img
                            src={GoNaturallyLogo}
                            alt="Go Naturally Logo"
                            className="h-10"
                        />
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-6 py-8">
                        <div className="space-y-6">
                            {navItems.map((item, index) => (
                                <motion.button
                                    key={item.name}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`block w-full text-left text-xl font-semibold hover:${item.color} transition-colors duration-300 text-white`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ x: 10 }}
                                >
                                    {item.name}
                                </motion.button>
                            ))}
                        </div>
                    </nav>

                    {/* Play Now Button */}
                    <div className="p-6 border-t border-white/20">
                        <motion.div
                            className="group relative w-full transition-transform duration-300 active:scale-95"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <button className="relative z-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 p-0.5 duration-300 w-full">
                                <span className="block rounded-md bg-slate-950 px-6 py-3 font-semibold text-slate-100 duration-300 group-hover:bg-slate-950/50 group-hover:text-slate-50 group-active:bg-slate-950/80 text-base w-full">
                                    Play Now
                                </span>
                            </button>
                            <span className="pointer-events-none absolute -inset-2 z-0 transform-gpu rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 opacity-30 blur-xl transition-all duration-300 group-hover:opacity-90 group-active:opacity-50"></span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// Header Play Button Component (shows after scrolling past hero)
const HeaderPlayButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const heroHeight = window.innerHeight;
            const scrollY = window.scrollY;
            setIsVisible(scrollY > heroHeight * 0.8); // Show after 80% of hero section
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <motion.div
            className="group relative w-fit transition-transform duration-300 active:scale-95 hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <button className="relative z-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 p-0.5 duration-300 group-hover:scale-110">
                <span className="block rounded-md bg-slate-950 px-6 py-3 font-semibold text-slate-100 duration-300 group-hover:bg-slate-950/50 group-hover:text-slate-50 group-active:bg-slate-950/80 text-base">
                    Play Now
                </span>
            </button>
            <span className="pointer-events-none absolute -inset-4 z-0 transform-gpu rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 opacity-30 blur-xl transition-all duration-300 group-hover:opacity-90 group-active:opacity-50"></span>
        </motion.div>
    );
};

// Loading Screen Component
const LoadingScreen = ({ isLoading }: { isLoading: boolean }) => {
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
                    <p className="text-white/70 text-base md:text-lg">Loading best experience for you...</p>
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
                    Preparing assets...
                </motion.p>
            </div>
        </motion.div>
    );
};

const Landing = () => {
    const { show } = useScrollDirection();
    const [showControls, setShowControls] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [videosLoaded, setVideosLoaded] = useState({ background: false, parallax: false });
    const [isPageLoaded, setIsPageLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null!);
    const backgroundVideoRef = useRef<HTMLVideoElement>(null);

    // Scroll to top immediately on component mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Preload videos on component mount
    useEffect(() => {
        const preloadVideos = async () => {
            const backgroundVideo = backgroundVideoRef.current;
            const parallaxVideo = videoRef.current;

            // Enhanced preloading with better buffering
            const setupVideoPreload = (video: HTMLVideoElement, videoType: 'background' | 'parallax') => {
                const handleCanPlayThrough = () => {
                    setVideosLoaded(prev => ({ ...prev, [videoType]: true }));
                };

                const handleError = () => {
                    console.warn(`${videoType} video failed to preload`);
                    setVideosLoaded(prev => ({ ...prev, [videoType]: true })); // Continue anyway
                };

                const handleLoadedData = () => {
                    // Ensure video has enough buffered data
                    if (video.buffered.length > 0 && video.buffered.end(0) > 5) {
                        setVideosLoaded(prev => ({ ...prev, [videoType]: true }));
                    }
                };

                video.addEventListener('canplaythrough', handleCanPlayThrough);
                video.addEventListener('loadeddata', handleLoadedData);
                video.addEventListener('error', handleError);

                // Force load the video
                video.load();

                // Cleanup function
                return () => {
                    video.removeEventListener('canplaythrough', handleCanPlayThrough);
                    video.removeEventListener('loadeddata', handleLoadedData);
                    video.removeEventListener('error', handleError);
                };
            };

            // Setup preloading for both videos
            const cleanupFunctions: (() => void)[] = [];

            if (backgroundVideo) {
                cleanupFunctions.push(setupVideoPreload(backgroundVideo, 'background'));
            }

            if (parallaxVideo) {
                cleanupFunctions.push(setupVideoPreload(parallaxVideo, 'parallax'));
            }

            // Cleanup on unmount
            return () => {
                cleanupFunctions.forEach(cleanup => cleanup());
            };
        };

        preloadVideos();
    }, []);

    // Set page as loaded when both videos are ready
    useEffect(() => {
        if (videosLoaded.background && videosLoaded.parallax) {
            // Add a small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setIsPageLoaded(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [videosLoaded]);

    // Scroll to top when page loads
    useEffect(() => {
        // Immediate scroll to top
        window.scrollTo(0, 0);

        // Also ensure scroll position is maintained after loading completes
        if (isPageLoaded) {
            window.scrollTo(0, 0);
        }
    }, [isPageLoaded]);

    // Close mobile menu when window resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Animation variants
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.2
            }
        }
    };

    const staggerItem = {
        hidden: {
            opacity: 0,
            y: 50
        },
        visible: {
            opacity: 1,
            y: 0
        }
    };

    return (
        <>
            {/* Loading Screen */}
            <LoadingScreen isLoading={!isPageLoaded} />

            <div className="relative flex flex-col w-full min-h-[100dvh] font-archive bg-black">
                {/* Fixed Background Video */}
                <div className="fixed inset-0 w-full h-[100dvh] z-0">
                    <video
                        ref={backgroundVideoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                    >
                        <source src="/earth_background.webm" type="video/webm" />
                    </video>
                </div>

                {/* Top Navigation */}
                <motion.header
                    className="fixed w-full bg-black/20 backdrop-blur-md border-b border-white/10 text-white z-50"
                    initial={{ y: 0 }}
                    animate={{ y: show ? 0 : -100 }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                    }}
                >
                    <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                        <div className="text-xl font-bold">
                            <img
                                src={GoNaturallyLogo}
                                alt="Go Naturally Logo"
                                className="h-10 md:h-14"
                            >
                            </img>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex gap-8 font-archive text-lg">
                            <motion.button
                                onClick={() => document.querySelector('#environmental-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-nature-green-400 transition-colors duration-300 relative group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                The Problem
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nature-green-400 transition-all duration-300 group-hover:w-full"></span>
                            </motion.button>
                            <motion.button
                                onClick={() => document.querySelector('#solution-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-blue-400 transition-colors duration-300 relative group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Our Solution
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                            </motion.button>
                            <motion.button
                                onClick={() => document.querySelector('#team-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-emerald-400 transition-colors duration-300 relative group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Team
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                            </motion.button>
                            <motion.button
                                onClick={() => document.querySelector('#download-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-yellow-400 transition-colors duration-300 relative group"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Download
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                            </motion.button>
                        </nav>

                        {/* Desktop Play Button */}
                        <HeaderPlayButton />

                        {/* Mobile Hamburger Menu */}
                        <AnimatedHamburgerButton
                            active={mobileMenuOpen}
                            setActive={setMobileMenuOpen}
                        />
                    </div>
                </motion.header>

                {/* Mobile Sidebar */}
                <MobileSidebar
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />

                {/* Hero Section */}
                <section className="relative w-full min-h-[100dvh] flex items-center justify-center text-center z-10">
                    <div className="min-h-[100dvh] w-full p-4 md:p-8 pt-32 md:pt-48 bg-black/30 backdrop-blur-[4px]">
                        <motion.div
                            className="text-gray-200"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        >
                            <div className="flex flex-col lg:flex-row justify-center gap-2 md:gap-5 w-full mx-auto text-center text-3xl sm:text-4xl md:text-6xl leading-snug text-shine font-bold mb-8 md:mb-12">
                                <h1 className="shrink-0">Experience the Life{" "}</h1>
                                <span className="relative inline-block">
                                    <h1 className="text-shine relative">Naturally
                                        <svg
                                            viewBox="0 0 286 73"
                                            fill="none"
                                            className="absolute left-1/2 -translate-x-1/2 -top-3 sm:-top-3 md:-top-4 lg:-top-6 xl:-top-7 w-[calc(40%+20px)] sm:w-[calc(50%+20px)] lg:w-[calc(100%+20px)] min-w-[200px] h-auto"
                                        >
                                            <motion.path
                                                initial={{ pathLength: 0 }}
                                                whileInView={{ pathLength: 1 }}
                                                transition={{
                                                    duration: 1.25,
                                                    ease: "easeInOut",
                                                    delay: 3
                                                }}
                                                d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                                                stroke="#FACC15"
                                                strokeWidth="3"
                                            />
                                        </svg>
                                    </h1>

                                </span>
                            </div>
                            <motion.div
                                className="group relative w-fit mx-auto transition-transform duration-300 active:scale-95"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 1.5 }}
                            >
                                <button className="relative z-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 p-0.5 duration-300 group-hover:scale-110">
                                    <span className="block rounded-md bg-slate-950 px-6 md:px-8 py-3 md:py-4 font-semibold text-slate-100 duration-300 group-hover:bg-slate-950/50 group-hover:text-slate-50 group-active:bg-slate-950/80 text-base md:text-lg">
                                        Play Now
                                    </span>
                                </button>
                                <span className="pointer-events-none absolute -inset-4 z-0 transform-gpu rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 opacity-30 blur-xl transition-all duration-300 group-hover:opacity-90 group-active:opacity-50"></span>
                            </motion.div>

                            {/* Environmental Stats Counter */}
                            <EnvironmentalStatsCounter />
                        </motion.div>
                    </div>
                </section>

                {/* Environmental Impact Scroll Section */}
                <div id="environmental-section">
                    <EnvironmentalScrollSection videoRef={videoRef} setShowControls={setShowControls} />
                </div>

                {/* Our Solution*/}
                <section id="solution-section" className="relative w-full min-h-[100dvh] flex items-center justify-center z-10">
                    <div className="min-h-[100dvh] w-full p-4 md:p-8 md:px-28 pt-20 md:pt-44 bg-black/30 backdrop-blur-[4px]">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                className="text-4xl md:text-6xl font-bold text-center mb-8 md:mb-12 text-white"
                                variants={staggerItem}
                            >
                                Our Solution
                            </motion.h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                                {/* Left Side - News Grid */}
                                <motion.div
                                    className="space-y-4 md:space-y-6"
                                    variants={staggerContainer}
                                >
                                    {/* First Row - 2 Columns */}
                                    <motion.div
                                        className="grid grid-cols-2 gap-3 md:gap-4"
                                        variants={staggerContainer}
                                    >
                                        <motion.div
                                            className="h-32 md:h-48 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white p-2 md:p-4"
                                            variants={staggerItem}
                                        >
                                            <div className="text-center">
                                                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Climate Action</h3>
                                                <p className="text-xs md:text-sm text-white/80">Latest environmental initiatives</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            className="h-32 md:h-48 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white p-2 md:p-4"
                                            variants={staggerItem}
                                        >
                                            <div className="text-center">
                                                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Green Tech</h3>
                                                <p className="text-xs md:text-sm text-white/80">Sustainable technology news</p>
                                            </div>
                                        </motion.div>
                                    </motion.div>

                                    {/* Second Row - 3 Columns */}
                                    <motion.div
                                        className="grid grid-cols-3 gap-2 md:gap-3"
                                        variants={staggerContainer}
                                    >
                                        <motion.div
                                            className="h-24 md:h-36 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white p-2 md:p-3"
                                            variants={staggerItem}
                                        >
                                            <div className="text-center">
                                                <h4 className="text-xs md:text-sm font-semibold mb-1">Conservation</h4>
                                                <p className="text-xs text-white/70 hidden md:block">Wildlife updates</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            className="h-24 md:h-36 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white p-2 md:p-3"
                                            variants={staggerItem}
                                        >
                                            <div className="text-center">
                                                <h4 className="text-xs md:text-sm font-semibold mb-1">Renewable</h4>
                                                <p className="text-xs text-white/70 hidden md:block">Energy progress</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            className="h-24 md:h-36 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white p-2 md:p-3"
                                            variants={staggerItem}
                                        >
                                            <div className="text-center">
                                                <h4 className="text-xs md:text-sm font-semibold mb-1">Eco Living</h4>
                                                <p className="text-xs text-white/70 hidden md:block">Lifestyle tips</p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </motion.div>

                                {/* Right Side - 3D Phone */}
                                <motion.div
                                    className="flex items-center justify-center mt-8 lg:mt-0"
                                    variants={staggerItem}
                                >
                                    <div className="transform scale-75 md:scale-100">
                                        <FloatingPhone />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Team Section */}
                <TeamSection />

                {/* Download Section */}
                <section id="download-section" className="relative w-full min-h-[50vh] flex items-center justify-center z-10 ">
                    <div className="flex justify-center items-center min-h-[50vh] w-full p-4 md:p-8 bg-black/30 backdrop-blur-[4px] text-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-white px-4"
                                variants={staggerItem}
                            >
                                Get Up and GO! Download Today
                            </motion.h2>
                            <motion.p
                                className="text-white/80 text-base md:text-lg mb-6 md:mb-8 px-4"
                                variants={staggerItem}
                            >
                                Get GoNaturally on Home Screen Just a Tap Away Anytime
                            </motion.p>
                            <motion.div
                                className="flex justify-center"
                                variants={staggerContainer}
                            >
                                <motion.div
                                    className="group relative w-fit mx-auto transition-transform duration-300 active:scale-95"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: 1.5 }}
                                >
                                    <button className="relative z-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 p-0.5 duration-300 group-hover:scale-110">
                                        <span className="block rounded-md bg-slate-950 px-6 py-3 md:px-8 md:py-4 font-semibold text-slate-100 duration-300 group-hover:bg-slate-950/50 group-hover:text-slate-50 group-active:bg-slate-950/80 text-base md:text-lg">
                                            Download Now
                                        </span>
                                    </button>
                                    <span className="pointer-events-none absolute -inset-4 z-0 transform-gpu rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 opacity-30 blur-xl transition-all duration-300 group-hover:opacity-90 group-active:opacity-50"></span>
                                </motion.div>
                            </motion.div>
                            <motion.p
                                className="text-white/60 text-xs md:text-sm mt-8 md:mt-16 px-4"
                                variants={staggerItem}
                            >
                                Works on all devices • No app store required • Always up to date
                            </motion.p>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative w-full min-h-[40vh] flex items-center justify-center z-10">
                    <div className="min-h-[40vh] w-full p-4 md:p-8 pt-12 md:pt-20 bg-black/30 backdrop-blur-[4px] text-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={staggerContainer}
                        >
                            <motion.div
                                className="mb-6 md:mb-8"
                                variants={staggerContainer}
                            >
                                <motion.img
                                    src={GoNaturallyLogo}
                                    alt="Go Naturally Logo"
                                    className="h-12 md:h-16 mx-auto mb-4 md:mb-6"
                                    variants={staggerItem}
                                />
                                {/* <motion.h3
                                className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-4"
                                variants={staggerItem}
                            >
                                Go Naturally
                            </motion.h3> */}
                                <motion.p
                                    className="text-white/80 text-base md:text-lg"
                                    variants={staggerItem}
                                >
                                    Experience nature like never before
                                </motion.p>
                            </motion.div>
                            {/* <motion.div
                            className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-4 md:gap-6"
                            variants={staggerContainer}
                        >
                            <motion.a
                                href="#"
                                className="text-white/80 hover:text-white transition-colors text-base md:text-lg"
                                variants={staggerItem}
                            >
                                Terms of Service
                            </motion.a>
                            <motion.a
                                href="#"
                                className="text-white/80 hover:text-white transition-colors text-base md:text-lg"
                                variants={staggerItem}
                            >
                                Privacy Policy
                            </motion.a>
                            <motion.a
                                href="#"
                                className="text-white/80 hover:text-white transition-colors text-base md:text-lg"
                                variants={staggerItem}
                            >
                                Copyright Policy
                            </motion.a>
                        </motion.div> */}
                            <motion.div
                                className="mt-6 md:mt-8"
                                variants={staggerItem}
                            >
                                <p className="text-white/60 text-sm md:text-base">© 2025 TEAM HAIL HYDRA. All rights reserved.</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </footer>

                <VideoControlBar videoRef={videoRef} isVisible={showControls} />
            </div>
        </>
    );
};

export default Landing;
