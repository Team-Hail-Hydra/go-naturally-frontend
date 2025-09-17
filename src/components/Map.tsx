import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RasterDEMSourceSpecification } from "mapbox-gl";
import AvatarCreator from "./AvatarCreator";
import { AvatarLayer } from "./AvatarLayer";
import { MarkerManager, type MarkerData, type PlantMarker, type AnimalMarker, type CommunityEventMarker } from "../utils/MarkerManager";
import { LightPresetManager } from "../utils/LightPresetManager";
import { useUserStore } from '../store/userStore';
import { GlassmorphismModal, GlassCard } from './ui/glassmorphism-modal';

interface MapProps {
  onUserLocationChange?: (location: [number, number] | null) => void;
  onMapReady?: () => void;
}

function Map({ onUserLocationChange, onMapReady }: MapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapBearing, setMapBearing] = useState(0);
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);

  // Marker details modal state
  const [showMarkerDetails, setShowMarkerDetails] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  // Get avatar URL from Zustand store
  const { avatarUrl, setAvatarUrl } = useUserStore();
  const avatarLayerRef = useRef<AvatarLayer | null>(null);
  const markerManagerRef = useRef<MarkerManager | null>(null);
  const lightPresetManagerRef = useRef<LightPresetManager | null>(null);

  // Flags to prevent duplicate creation
  const isMapInitialized = useRef(false);
  const isAvatarLayerCreated = useRef(false);

  // Refs to store callbacks to prevent dependency loops
  const onUserLocationChangeRef = useRef(onUserLocationChange);
  const onMapReadyRef = useRef(onMapReady);

  // Update refs when props change
  useEffect(() => {
    onUserLocationChangeRef.current = onUserLocationChange;
    onMapReadyRef.current = onMapReady;
  });

  // Handle marker click to show details in modal
  const handleMarkerClick = useCallback((markerData: MarkerData) => {
    // Move map view to marker location
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: markerData.position,
        zoom: Math.max(mapRef.current.getZoom(), 18), // Ensure we're zoomed in enough to see details
        pitch: 78.37678796273495,
        duration: 800,
        easing: (t) => t * (2 - t), // Ease out quad for smooth animation
        essential: true,
      });
    }

    // Show marker details in modal
    setSelectedMarker(markerData);
    setShowMarkerDetails(true);
  }, []);

  const createAvatarLayer = useCallback(async () => {
    if (!avatarUrl || !userLocation || !mapRef.current || isAvatarLayerCreated.current) {
      return;
    }

    console.log('Creating avatar layer at position:', userLocation);
    isAvatarLayerCreated.current = true;

    try {
      // Remove existing avatar layer if any
      if (avatarLayerRef.current) {
        try {
          mapRef.current.removeLayer(avatarLayerRef.current.id);
        } catch (error) {
          console.warn('Error removing existing avatar layer:', error);
        }
        avatarLayerRef.current = null;
      }

      // Wait a bit for any cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new avatar layer
      const avatarLayer = new AvatarLayer({
        id: "user-avatar",
        avatarUrl,
        position: userLocation,
        scale: 5,
      });

      avatarLayerRef.current = avatarLayer;
      mapRef.current.addLayer(avatarLayer);

      console.log('Avatar layer created successfully');
    } catch (error) {
      console.error("Error creating avatar layer:", error);
      isAvatarLayerCreated.current = false;
      // Reset flag to allow retry
      setTimeout(() => {
        isAvatarLayerCreated.current = false;
      }, 5000);
    }
  }, [avatarUrl, userLocation]);

  // Map initialization effect - only runs once
  useEffect(() => {
    if (!mapContainerRef.current || isMapInitialized.current) return;

    console.log('Initializing map...');
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/kunalshah017/cmfetbutq00aq01sdfvovensl",
      antialias: true,
      center: [0, 0],
      zoom: 3,
      pitch: 60,
      bearing: -20,
      maxPitch: 85,
    });

    mapRef.current = map;
    isMapInitialized.current = true;

    // Add camera constraints to keep view above ground
    map.on("zoom", () => {
      const zoom = map.getZoom();
      if (zoom > 21.12559598757832) {
        const targetPitch = Math.min(78 + (zoom - 21.12559598757832) * 3, 78.37678796273495);
        map.setPitch(targetPitch);
      }
    });

    // Track map bearing changes for compass rotation
    const updateBearing = () => {
      setMapBearing(map.getBearing());
    };

    map.on("rotate", updateBearing);
    map.on("rotateend", updateBearing);
    map.on("moveend", updateBearing);

    map.on("load", () => {
      console.log('Map loaded, starting initialization...');

      const initializeMapComponents = () => {
        try {
          // Initialize MarkerManager with click callback and clustering enabled
          markerManagerRef.current = new MarkerManager(map, handleMarkerClick, true);

          // Initialize LightPresetManager for dynamic lighting
          lightPresetManagerRef.current = new LightPresetManager(map);

          // Initialize map bearing state
          setMapBearing(map.getBearing());

          // Add terrain
          if (!map.getSource("mapbox-dem")) {
            const demSource: RasterDEMSourceSpecification = {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v2",
              tileSize: 512,
              maxzoom: 18,
            };
            map.addSource("mapbox-dem", demSource);
            map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
          }

          // Start geolocation after initialization
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const { latitude, longitude } = pos.coords;
                const newLocation: [number, number] = [longitude, latitude];
                setUserLocation(newLocation);
                onUserLocationChangeRef.current?.(newLocation);

                const performFlyWithPreload = async () => {
                  try {
                    // Create avatar layer before animation if avatarUrl exists
                    if (avatarUrl) {
                      console.log('Creating avatar layer before fly-to animation');
                      const avatarLayer = new AvatarLayer({
                        id: "user-avatar",
                        avatarUrl,
                        position: newLocation,
                        scale: 5,
                      });
                      avatarLayerRef.current = avatarLayer;
                      map.addLayer(avatarLayer);
                      isAvatarLayerCreated.current = true;
                    }

                    // Small delay to ensure avatar is loaded
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // Remove loading screen before animation starts so user can see it
                    setIsLoading(false);
                    onMapReadyRef.current?.();

                    // Now start the fly-to animation (visible to user)
                    map.flyTo({
                      center: [longitude, latitude],
                      zoom: 21.12559598757832,
                      pitch: 78.37678796273495,
                      bearing: 0,
                      speed: 0.7,
                      curve: 1.8,
                      easing: (t) => t,
                      essential: true,
                    });

                    // Add markers AFTER the fly-to animation completes to prevent displacement
                    map.once('moveend', () => {
                      // Wait for map to be completely settled
                      setTimeout(() => {
                        if (markerManagerRef.current && map.loaded() && map.isStyleLoaded()) {
                          console.log('Adding markers after fly-to animation completed and map is settled');
                          markerManagerRef.current.addMarkers(500); // Add delay to ensure proper positioning
                        }
                      }, 1000); // Increased delay for better stability
                    });
                  } catch (error) {
                    console.error('Error in performFlyWithPreload:', error);
                    setIsLoading(false);
                    onMapReadyRef.current?.();
                  }
                };

                if (map.loaded()) {
                  performFlyWithPreload();
                } else {
                  map.once("idle", performFlyWithPreload);
                }
              },
              () => {
                // Geolocation failed, use fallback location
                const fallbackLocation: [number, number] = [72.900719, 19.072816]; // Mumbai fallback
                setUserLocation(fallbackLocation);
                onUserLocationChangeRef.current?.(fallbackLocation);

                console.log('Geolocation failed, using fallback location:', fallbackLocation);

                // Fly to fallback location
                map.flyTo({
                  center: fallbackLocation,
                  zoom: 21.12559598757832,
                  pitch: 78.37678796273495,
                  bearing: 0,
                  speed: 0.7,
                  curve: 1.8,
                  easing: (t) => t,
                  essential: true,
                });

                setIsLoading(false);
                onMapReadyRef.current?.();

                // Add markers after fly animation
                map.once('moveend', () => {
                  setTimeout(() => {
                    if (markerManagerRef.current && map.loaded() && map.isStyleLoaded()) {
                      markerManagerRef.current.addMarkers(500);
                    }
                  }, 1000);
                });
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          } else {
            // No geolocation available, use fallback location
            const fallbackLocation: [number, number] = [72.900719, 19.072816]; // Mumbai fallback
            setUserLocation(fallbackLocation);
            onUserLocationChangeRef.current?.(fallbackLocation);

            console.log('Geolocation not available, using fallback location:', fallbackLocation);

            // Fly to fallback location
            map.flyTo({
              center: fallbackLocation,
              zoom: 21.12559598757832,
              pitch: 78.37678796273495,
              bearing: 0,
              speed: 0.7,
              curve: 1.8,
              easing: (t) => t,
              essential: true,
            });

            setIsLoading(false);
            onMapReadyRef.current?.();

            // Add markers after fly animation
            map.once('moveend', () => {
              setTimeout(() => {
                if (markerManagerRef.current && map.loaded() && map.isStyleLoaded()) {
                  markerManagerRef.current.addMarkers(500);
                }
              }, 1000);
            });
          }
        } catch (error) {
          console.error('Error initializing map components:', error);
          setIsLoading(false);
        }
      };

      // Check if style is loaded, if not wait for it
      if (map.isStyleLoaded()) {
        initializeMapComponents();
      } else {
        map.once('styledata', initializeMapComponents);
      }
    });

    return () => {
      console.log('Cleaning up map...');
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
      }
      if (lightPresetManagerRef.current) {
        lightPresetManagerRef.current.destroy();
      }
      if (avatarLayerRef.current && mapRef.current) {
        try {
          mapRef.current.removeLayer(avatarLayerRef.current.id);
        } catch (error) {
          console.warn('Error removing avatar layer during cleanup:', error);
        }
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Reset refs
      mapRef.current = null;
      markerManagerRef.current = null;
      lightPresetManagerRef.current = null;
      avatarLayerRef.current = null;
      isMapInitialized.current = false;
      isAvatarLayerCreated.current = false;
    };
  }, [avatarUrl, handleMarkerClick]); // Include avatarUrl to access it in the geolocation callback  // Avatar layer creation effect - only runs when avatar changes after initial load
  useEffect(() => {
    // Only create avatar layer if it's not created during geolocation flow
    // and we have all required data and map is ready
    if (avatarUrl && userLocation && !isLoading && mapRef.current && !isAvatarLayerCreated.current) {
      // Add a delay to ensure map is fully ready
      const timer = setTimeout(() => {
        createAvatarLayer();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [avatarUrl, userLocation, isLoading, createAvatarLayer]);

  const handleAvatarCreated = (url: string) => {
    setAvatarUrl(url);
    setShowAvatarCreator(false);
    // Reset avatar layer flag to allow recreation with new avatar
    isAvatarLayerCreated.current = false;

    // If map is already loaded and we have user location, create avatar immediately
    if (userLocation && mapRef.current && !isLoading) {
      setTimeout(() => {
        createAvatarLayer();
      }, 100);
    }
  };

  const handleCloseAvatarCreator = () => {
    setShowAvatarCreator(false);
  };

  const handleCloseMarkerDetails = () => {
    setShowMarkerDetails(false);
    setSelectedMarker(null);
  };

  // Add keyboard controls for camera
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!mapRef.current) return;

      const map = mapRef.current;

      switch (e.key) {
        case 'q':
          map.setBearing(map.getBearing() - 5);
          break;
        case 'e':
          map.setBearing(map.getBearing() + 5);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative h-screen w-screen">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}

      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">

        {/* Cluster Toggle Button */}
        <button
          onClick={() => {
            if (markerManagerRef.current) {
              const isCurrentlyEnabled = markerManagerRef.current.isClusteringEnabled();
              markerManagerRef.current.setClusteringMode(!isCurrentlyEnabled);
              setIsClusteringEnabled(!isCurrentlyEnabled);
            }
          }}
          className="bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/30 hover:border-white/50 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group relative"
          title={isClusteringEnabled ? "Disable Clustering" : "Enable Clustering"}
        >
          <div className="relative">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              className="transition-all duration-300 group-hover:scale-110"
            >
              {isClusteringEnabled ? (
                // Clustered view icon
                <>
                  {/* Main cluster circle */}
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    fill="none"
                    stroke="rgba(59,130,246,0.8)"
                    strokeWidth="2"
                  />
                  {/* Cluster count */}
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {markerManagerRef.current?.getAllMarkers().length.toString() || "N"}
                  </text>
                  {/* Small surrounding dots */}
                  <circle cx="6" cy="6" r="2" fill="rgba(34,197,94,0.6)" />
                  <circle cx="18" cy="6" r="2" fill="rgba(239,68,68,0.6)" />
                  <circle cx="6" cy="18" r="2" fill="rgba(59,130,246,0.6)" />
                </>
              ) : (
                // Individual markers icon
                <>
                  <circle cx="8" cy="8" r="3" fill="rgba(34,197,94,0.8)" stroke="white" strokeWidth="1" />
                  <circle cx="16" cy="8" r="3" fill="rgba(59,130,246,0.8)" stroke="white" strokeWidth="1" />
                  <circle cx="8" cy="16" r="3" fill="rgba(239,68,68,0.8)" stroke="white" strokeWidth="1" />
                  <circle cx="16" cy="16" r="3" fill="rgba(255,193,7,0.8)" stroke="white" strokeWidth="1" />
                  {/* Icons */}
                  <text x="8" y="11" textAnchor="middle" fontSize="8">🌱</text>
                  <text x="16" y="11" textAnchor="middle" fontSize="8">🐾</text>
                  <text x="8" y="19" textAnchor="middle" fontSize="8">♻️</text>
                  <text x="16" y="19" textAnchor="middle" fontSize="8">🌿</text>
                </>
              )}
            </svg>
          </div>
        </button>

        {/* Compass Button */}
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.easeTo({
                bearing: 0,
                duration: 300,
                easing: (t) => t
              });
            }
          }}
          className="bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/30 hover:border-white/50 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group relative"
          title="Reset North"
        >
          <div className="relative">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              className="transition-all duration-300 group-hover:scale-110"
            >
              {/* Outer ring */}
              <circle
                cx="12"
                cy="12"
                r="11"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              {/* Main compass circle */}
              <circle
                cx="12"
                cy="12"
                r="9.5"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
              />
              {/* Compass needle container - this rotates */}
              <g transform={`rotate(${-mapBearing}, 12, 12)`} className="transition-transform duration-300 ease-out">
                {/* North Arrow (Red) */}
                <path
                  d="M12 3.5 L8.5 11.5 L12 10 L15.5 11.5 Z"
                  fill="#DC2626"
                  stroke="#B91C1C"
                  strokeWidth="0.5"
                />
                {/* South Arrow (White/Gray) */}
                <path
                  d="M12 20.5 L15.5 12.5 L12 14 L8.5 12.5 Z"
                  fill="rgba(255,255,255,0.8)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="0.5"
                />
                {/* Needle line */}
                <line
                  x1="12"
                  y1="4"
                  x2="12"
                  y2="20"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="0.5"
                />
              </g>
              {/* Center dot */}
              <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.7)" />
            </svg>
          </div>
        </button>

        {/* Recenter Button */}
        {userLocation && (
          <button
            onClick={() => {
              if (mapRef.current && userLocation) {
                mapRef.current.flyTo({
                  center: userLocation,
                  zoom: 21.12559598757832,
                  pitch: 78.37678796273495,
                  bearing: 0,
                  speed: 1.2,
                  curve: 1.42,
                  easing: (t) => t,
                  essential: true,
                });
              }
            }}
            className="bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/30 hover:border-white/50 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group relative"
            title="Recenter to Avatar"
          >
            <div className="relative">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                className="group-hover:scale-110 transition-all duration-200"
              >
                {/* Outer ring */}
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                />
                {/* Main crosshair circle */}
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                />
                {/* Inner target circle */}
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  fill="none"
                  stroke="rgba(59,130,246,0.8)"
                  strokeWidth="1.5"
                  className="group-hover:stroke-blue-300"
                />
                {/* Cross lines */}
                <line
                  x1="12"
                  y1="2.5"
                  x2="12"
                  y2="6.5"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                />
                <line
                  x1="12"
                  y1="17.5"
                  x2="12"
                  y2="21.5"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                />
                <line
                  x1="2.5"
                  y1="12"
                  x2="6.5"
                  y2="12"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                />
                <line
                  x1="17.5"
                  y1="12"
                  x2="21.5"
                  y2="12"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                />
                {/* Center dot with pulse effect */}
                <circle
                  cx="12"
                  cy="12"
                  r="2"
                  fill="rgba(59,130,246,0.8)"
                  className="group-hover:fill-blue-300"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="1"
                  fill="rgba(255,255,255,0.9)"
                />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Avatar Creator Modal */}
      {showAvatarCreator && (
        <AvatarCreator
          onAvatarCreated={handleAvatarCreated}
          onClose={handleCloseAvatarCreator}
        />
      )}

      {/* Marker Details Modal */}
      <GlassmorphismModal
        open={showMarkerDetails}
        setOpen={setShowMarkerDetails}
        onClose={handleCloseMarkerDetails}
        title={selectedMarker ? `${selectedMarker.name}` : "Marker Details"}
        subtitle={selectedMarker ? `${selectedMarker.type.charAt(0).toUpperCase() + selectedMarker.type.slice(1)} Information` : ""}
        size="lg"
        className="z-[9999]"
      >
        {selectedMarker && (
          <div className="space-y-6">
            {/* Marker Image */}
            <GlassCard className="p-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={selectedMarker.image}
                  alt={selectedMarker.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center";
                  }}
                />
              </div>
            </GlassCard>

            {/* Basic Information */}
            <GlassCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white/90">Basic Information</h3>
                  <div className="text-2xl">
                    {selectedMarker.type === "plant" && "🌱"}
                    {selectedMarker.type === "animal" && "🐾"}
                    {selectedMarker.type === "litter" && "♻️"}
                    {selectedMarker.type === "community-event" && "🎪"}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60 text-sm">Name:</span>
                    <span className="text-white/90 font-medium">{selectedMarker.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60 text-sm">Type:</span>
                    <span className="text-white/90 font-medium capitalize">{selectedMarker.type}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Type-specific Information */}
            <GlassCard className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90">
                  {selectedMarker.type === "plant" && "Plant Details"}
                  {selectedMarker.type === "animal" && "Animal Details"}
                  {selectedMarker.type === "litter" && "Cleanup Details"}
                  {selectedMarker.type === "community-event" && "Event Details"}
                </h3>

                {selectedMarker.type === "plant" && selectedMarker.originalData && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Species:</span>
                      <span className="text-white/90 font-medium">
                        {(selectedMarker.originalData as PlantMarker).plantName || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Category:</span>
                      <span className="text-white/90 font-medium">Plant Identification</span>
                    </div>
                  </div>
                )}

                {selectedMarker.type === "animal" && selectedMarker.originalData && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Animal:</span>
                      <span className="text-white/90 font-medium">
                        {(selectedMarker.originalData as AnimalMarker).name || "Unknown Species"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Category:</span>
                      <span className="text-white/90 font-medium">Wildlife Sighting</span>
                    </div>
                  </div>
                )}

                {selectedMarker.type === "litter" && selectedMarker.originalData && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Activity:</span>
                      <span className="text-white/90 font-medium">Litter Cleanup</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Category:</span>
                      <span className="text-white/90 font-medium">Environmental Cleanup</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Status:</span>
                      <span className="text-green-400 font-medium">✓ Completed</span>
                    </div>
                    <div className="mt-4">
                      <p className="text-white/60 text-sm mb-2">Before/After images available</p>
                      <div className="text-white/90 text-sm bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                        📸 Before and after cleanup photos are stored with this record
                      </div>
                    </div>
                  </div>
                )}

                {selectedMarker.type === "community-event" && selectedMarker.originalData && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Event Name:</span>
                      <span className="text-white/90 font-medium">
                        {(selectedMarker.originalData as CommunityEventMarker).eventName || "Unknown Event"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Location:</span>
                      <span className="text-white/90 font-medium">
                        {(selectedMarker.originalData as CommunityEventMarker).location || "Unknown Location"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Category:</span>
                      <span className="text-white/90 font-medium">Community Event</span>
                    </div>
                    <div className="mt-4">
                      <div className="text-white/90 text-sm bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
                        🎪 Join this community environmental event and make a difference together!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </GlassmorphismModal>
    </div>
  );
}

export default Map;
