import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RasterDEMSourceSpecification } from "mapbox-gl";
import AvatarCreator from "./AvatarCreator";
import { AvatarLayer } from "./AvatarLayer";
import EventsDropdown from './EventsDropdown';
import PlantUpload from './PlantUpload'; // Import the new component

function Map() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const avatarLayerRef = useRef<AvatarLayer | null>(null);
  const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false);

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
      maxPitch: 85, // Allow higher pitch for better 3D viewing
    });

    mapRef.current = map;

    map.on("load", () => {
      // Hide loading when the map becomes idle after first render
      map.once("idle", () => setIsLoading(false));
      try {
        if (!map.getSource("mapbox-dem")) {
          const demSource: RasterDEMSourceSpecification = {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
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
              // Stop any ongoing camera transitions before starting a new one
              map.stop();
              map.easeTo({
                center: [longitude, latitude],
                zoom: 16,
                pitch: 60,
                bearing: -20,
                duration: 3000,
                easing: (t) => t * t,
                essential: true,
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
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
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

      // Create new avatar layer
      const avatarLayer = new AvatarLayer({
        id: "user-avatar",
        avatarUrl,
        position: userLocation,
        scale: 2, // Reduced scale for better visibility
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
      {!avatarUrl && userLocation && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowAvatarCreator(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors font-medium"
          >
            Create Avatar
          </button>
        </div>
      )}

      {/* Avatar status */}
      {avatarUrl && userLocation && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
            Avatar Active
          </div>
          <button
            onClick={() => setShowAvatarCreator(true)}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-sm"
          >
            Change Avatar
          </button>
        </div>
      )}

      {/* Plant Upload Component */}
      <PlantUpload userLocation={userLocation} />

      {/* Top right controls */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
        {/* Location status */}
        {!userLocation && (
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            Getting location...
          </div>
        )}
        
        {/* Three dots menu button */}
        <div className="relative">
          <button
            onClick={() => setIsEventsDropdownOpen(!isEventsDropdownOpen)}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition-colors"
            title="Events Menu"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>

          {/* Events Dropdown */}
          <EventsDropdown 
            isOpen={isEventsDropdownOpen}
            onClose={() => setIsEventsDropdownOpen(false)}
          />
        </div>
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
