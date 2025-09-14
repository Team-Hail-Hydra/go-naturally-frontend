import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RasterDEMSourceSpecification } from "mapbox-gl";
import AvatarCreator from "./AvatarCreator";
import { AvatarLayer } from "./AvatarLayer";
import { MarkerManager } from "../utils/MarkerManager";
import { LightPresetManager } from "../utils/LightPresetManager";

function Map() {
  const isDevelopment = import.meta.env.VITE_MODE === 'development';
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>('https://models.readyplayer.me/68c5d6247a525019300673d2.glb');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const avatarLayerRef = useRef<AvatarLayer | null>(null);
  const markerManagerRef = useRef<MarkerManager | null>(null);
  const lightPresetManagerRef = useRef<LightPresetManager | null>(null);
  const [mapBearing, setMapBearing] = useState(0);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLDivElement,
      style: "mapbox://styles/kunalshah017/cmfetbutq00aq01sdfvovensl",
      antialias: true,
      center: [0, 0],
      zoom: 3,
      pitch: 60,
      bearing: -20,
      maxPitch: 85,
    });

    mapRef.current = map;

    // Add camera constraints to keep view above ground
    map.on("zoom", () => {
      const zoom = map.getZoom();
      // Adjust pitch based on zoom level - higher pitch when zoomed in
      if (zoom > 21.12559598757832) {
        const targetPitch = Math.min(78 + (zoom - 21.12559598757832) * 3, 78.37678796273495);
        map.setPitch(targetPitch);
      }

      // Logging disabled to prevent browser lag
      // logCurrentView(map);
    });

    // Track map bearing changes for compass rotation
    const updateBearing = () => {
      setMapBearing(map.getBearing());
    };

    map.on("rotate", updateBearing);
    map.on("rotateend", updateBearing);
    map.on("moveend", updateBearing);

    // Log view changes on move, pitch, and bearing changes - DISABLED
    // map.on("moveend", () => logCurrentView(map));
    // map.on("pitchend", () => logCurrentView(map));
    // map.on("rotateend", () => logCurrentView(map));

    map.on("load", () => {
      // Initialize MarkerManager
      markerManagerRef.current = new MarkerManager(map);

      // Initialize LightPresetManager for dynamic lighting
      lightPresetManagerRef.current = new LightPresetManager(map);

      // Initialize map bearing state
      setMapBearing(map.getBearing());

      // Hide loading when the map becomes idle after first render
      map.once("idle", () => setIsLoading(false));
      try {
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
      } catch {
        // Ignore if style doesn't support terrain/sky
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation([longitude, latitude]);

            const performFly = () => {
              // Use flyTo for smoother animation, do not call map.stop()
              map.flyTo({
                center: [longitude, latitude],
                zoom: 21.12559598757832,
                pitch: 78.37678796273495,
                bearing: 0,
                speed: 0.7, // slower, smoother
                curve: 1.8, // more natural
                easing: (t) => t,
                essential: true,
              });

              // Add markers after fly animation completes
              map.once('moveend', () => {
                // Small delay to ensure animation is fully complete
                setTimeout(() => {
                  if (markerManagerRef.current) {
                    markerManagerRef.current.addMarkers(0);
                  }
                }, 500);
              });
            };
            if (map.loaded()) {
              performFly();
            } else {
              map.once("idle", performFly);
            }
          },
          () => {
            // keep default view
            // Add markers even if geolocation fails
            setTimeout(() => {
              if (markerManagerRef.current) {
                markerManagerRef.current.addMarkers(0);
              }
            }, 2000);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    });

    return () => {
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
      }
      if (lightPresetManagerRef.current) {
        lightPresetManagerRef.current.destroy();
      }
      map.remove();
      mapRef.current = null;
      markerManagerRef.current = null;
      lightPresetManagerRef.current = null;
    };
  }, []);

  // Add avatar layer when both avatar URL and user location are available
  useEffect(() => {
    if (avatarUrl && userLocation && mapRef.current) {
      // Remove existing avatar layer if any
      if (avatarLayerRef.current) {
        try {
          mapRef.current.removeLayer(avatarLayerRef.current.id);
        } catch {
          // Layer might not exist
        }
      }

      // Create new avatar layer with much smaller scale
      const avatarLayer = new AvatarLayer({
        id: "user-avatar",
        avatarUrl,
        position: userLocation,
        scale: 5, // much smaller
      });

      console.log("Adding avatar layer at position:", userLocation);

      avatarLayerRef.current = avatarLayer;
      mapRef.current.addLayer(avatarLayer);
    }
  }, [avatarUrl, userLocation]);

  const handleAvatarCreated = (url: string) => {
    setAvatarUrl(url);
    setShowAvatarCreator(false);
  };

  const handleCloseAvatarCreator = () => {
    setShowAvatarCreator(false);
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

      {/* Avatar creator button */}
      {isDevelopment && !avatarUrl && userLocation && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowAvatarCreator(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors font-medium"
          >
            Create Avatar
          </button>
        </div>
      )}

      {/* Avatar status and controls */}
      {isDevelopment && avatarUrl && userLocation && (
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
            Avatar Active
          </div>
          <button
            onClick={() => setShowAvatarCreator(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-sm"
          >
            Change Avatar
          </button>

          {/* Animation Controls - ReadyPlayerMe Library */}
          <div className="bg-black/20 backdrop-blur-md border border-white/30 rounded-lg shadow-lg p-3 space-y-2">
            <div className="text-white text-xs font-medium mb-2">Animations</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => avatarLayerRef.current?.playAnimation('idle')}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                Idle
              </button>
              <button
                onClick={() => avatarLayerRef.current?.playAnimation('walking')}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                Walking
              </button>
            </div>
            <div className="text-white/60 text-xs mt-2 text-center">
              ReadyPlayerMe Animations
            </div>
          </div>

          {/* Light Preset Controls */}
          <div className="bg-black/20 backdrop-blur-md border border-white/30 rounded-lg shadow-lg p-3 space-y-2">
            <div className="text-white text-xs font-medium mb-2">Lighting</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => lightPresetManagerRef.current?.applyPreset('night')}
                className="bg-indigo-600/70 hover:bg-indigo-600 text-white px-2 py-1 rounded transition-colors"
              >
                Night
              </button>
              <button
                onClick={() => lightPresetManagerRef.current?.applyPreset('dawn')}
                className="bg-pink-500/70 hover:bg-pink-500 text-white px-2 py-1 rounded transition-colors"
              >
                Dawn
              </button>
              <button
                onClick={() => lightPresetManagerRef.current?.applyPreset('day')}
                className="bg-yellow-400/70 hover:bg-yellow-400 text-white px-2 py-1 rounded transition-colors"
              >
                Day
              </button>
              <button
                onClick={() => lightPresetManagerRef.current?.applyPreset('dusk')}
                className="bg-orange-500/70 hover:bg-orange-500 text-white px-2 py-1 rounded transition-colors"
              >
                Dusk
              </button>
            </div>
            <button
              onClick={() => lightPresetManagerRef.current?.applyCurrentTimePreset()}
              className="w-full bg-green-600/70 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Auto (Current Time)
            </button>
            <div className="text-white/60 text-xs text-center">
              Mapbox Lighting
            </div>
          </div>

          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-xs">
            <div>Q/E: Rotate View</div>
          </div>
        </div>
      )}

      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Location status */}
        {!userLocation && isDevelopment && (
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            Getting location...
          </div>
        )}

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
    </div>
  );
}

export default Map;
