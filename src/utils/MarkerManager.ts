import mapboxgl from "mapbox-gl";
import { apiClient } from "../lib/apiClient";

export interface PlantMarker {
  id: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  plantName: string;
  createdById: string;
}

export interface AnimalMarker {
  id: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  name: string;
  createdById: string;
}

export interface LitterMarker {
  id: string;
  latitude: number;
  longitude: number;
  beforeImg: string;
  afterImg: string;
  createdById: string;
}

export interface CommunityEventMarker {
  id: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  eventName: string;
  location: string;
  createdById: string;
}

export interface MarkerData {
  id: string;
  name: string;
  image: string;
  position: [number, number]; // [longitude, latitude]
  type: "plant" | "animal" | "litter" | "community-event";
  createdById: string;
  originalData?:
    | PlantMarker
    | AnimalMarker
    | LitterMarker
    | CommunityEventMarker;
}

export class MarkerManager {
  private map: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];
  private markerData: MarkerData[] = [];
  private onMarkerClickCallback?: (markerData: MarkerData) => void;
  private useClusteringMode: boolean = false;

  constructor(
    map: mapboxgl.Map,
    onMarkerClick?: (markerData: MarkerData) => void,
    useClusteringMode: boolean = false
  ) {
    this.map = map;
    this.onMarkerClickCallback = onMarkerClick;
    this.useClusteringMode = useClusteringMode;
  }

  // Fetch markers from API
  async fetchMarkers() {
    try {
      const response = await apiClient.markers.getAll();

      const { plants, animals, litters, communityEvents } = response.data as {
        plants: PlantMarker[];
        animals: AnimalMarker[];
        litters: LitterMarker[];
        communityEvents: CommunityEventMarker[];
      };

      // Convert API data to MarkerData format
      const plantMarkers: MarkerData[] = plants.map((plant: PlantMarker) => ({
        id: `plant-${plant.id}`,
        name: plant.plantName,
        image: plant.imageUrl,
        position: [plant.longitude, plant.latitude] as [number, number],
        type: "plant" as const,
        createdById: plant.createdById,
        originalData: plant,
      }));

      const animalMarkers: MarkerData[] = animals.map(
        (animal: AnimalMarker) => ({
          id: `animal-${animal.id}`,
          name: animal.name,
          image: animal.imageUrl,
          position: [animal.longitude, animal.latitude] as [number, number],
          type: "animal" as const,
          createdById: animal.createdById,
          originalData: animal,
        })
      );

      const litterMarkers: MarkerData[] = litters.map(
        (litter: LitterMarker) => ({
          id: `litter-${litter.id}`,
          name: "Litter Cleanup",
          image: litter.afterImg, // Use after image as the main display
          position: [litter.longitude, litter.latitude] as [number, number],
          type: "litter" as const,
          createdById: litter.createdById,
          originalData: litter,
        })
      );

      const communityEventMarkers: MarkerData[] = (communityEvents || []).map(
        (event: CommunityEventMarker) => ({
          id: `community-event-${event.id}`,
          name: event.eventName,
          image: event.imageUrl,
          position: [event.longitude, event.latitude] as [number, number],
          type: "community-event" as const,
          createdById: event.createdById,
          originalData: event,
        })
      );

      // Filter out any markers with invalid coordinates
      const validPlantMarkers = plantMarkers.filter(
        (m) =>
          !isNaN(m.position[0]) &&
          !isNaN(m.position[1]) &&
          m.position[0] !== 0 &&
          m.position[1] !== 0
      );
      const validAnimalMarkers = animalMarkers.filter(
        (m) =>
          !isNaN(m.position[0]) &&
          !isNaN(m.position[1]) &&
          m.position[0] !== 0 &&
          m.position[1] !== 0
      );
      const validLitterMarkers = litterMarkers.filter(
        (m) =>
          !isNaN(m.position[0]) &&
          !isNaN(m.position[1]) &&
          m.position[0] !== 0 &&
          m.position[1] !== 0
      );
      const validCommunityEventMarkers = communityEventMarkers.filter(
        (m) =>
          !isNaN(m.position[0]) &&
          !isNaN(m.position[1]) &&
          m.position[0] !== 0 &&
          m.position[1] !== 0
      );

      // Create dummy bird markers near fallback location
      const dummyBirdMarkers: MarkerData[] = [
        {
          id: "bird-zebra-finch",
          name: "Zebra Finch",
          image:
            "https://cdn.britannica.com/10/250610-050-BC5CCDAF/Zebra-finch-Taeniopygia-guttata-bird.jpg",
          position: [72.901719, 19.073816], // Near fallback location
          type: "animal" as const,
          createdById: "system-fallback",
          originalData: {
            id: "zebra-finch-001",
            latitude: 19.073816,
            longitude: 72.901719,
            imageUrl:
              "https://cdn.britannica.com/10/250610-050-BC5CCDAF/Zebra-finch-Taeniopygia-guttata-bird.jpg",
            name: "Zebra Finch (Taeniopygia guttata)",
            createdById: "system-fallback",
          } as AnimalMarker,
        },
        {
          id: "bird-black-woodpecker",
          name: "Black Woodpecker",
          image:
            "https://cdn.britannica.com/45/251245-050-86C44E19/black-woodpecker-bird-dryocopus-martius.jpg",
          position: [72.899719, 19.071816], // Near fallback location
          type: "animal" as const,
          createdById: "system-fallback",
          originalData: {
            id: "black-woodpecker-001",
            latitude: 19.071816,
            longitude: 72.899719,
            imageUrl:
              "https://cdn.britannica.com/45/251245-050-86C44E19/black-woodpecker-bird-dryocopus-martius.jpg",
            name: "Black Woodpecker (Dryocopus martius)",
            createdById: "system-fallback",
          } as AnimalMarker,
        },
      ];

      // Create fallback community event markers to append to API response
      const fallbackCommunityEvents: MarkerData[] = [
        {
          id: "community-event-juhu-beach-cleaning",
          name: "Juhu Beach Cleaning Drive",
          image:
            "https://thecsrjournal.in/wp-content/uploads/2018/09/Adani-clean-up-after-Ganpati-immersion.jpg",
          position: [72.8265, 19.0989], // Juhu Beach coordinates
          type: "community-event" as const,
          createdById: "system-fallback",
          originalData: {
            id: "juhu-beach-cleaning",
            latitude: 19.0989,
            longitude: 72.8265,
            imageUrl:
              "https://thecsrjournal.in/wp-content/uploads/2018/09/Adani-clean-up-after-Ganpati-immersion.jpg",
            eventName: "Juhu Beach Cleaning Drive",
            location: "Juhu Beach",
            createdById: "system-fallback",
          } as CommunityEventMarker,
        },
        {
          id: "community-event-hanging-garden-clean-drive",
          name: "Hanging Garden Clean Drive",
          image:
            "https://www.mylaporetimes.com/wp-content/uploads/2014/10/IMG_90831.jpg",
          position: [72.804365, 18.956357], // Hanging Garden coordinates
          type: "community-event" as const,
          createdById: "system-fallback",
          originalData: {
            id: "hanging-garden-clean-drive",
            latitude: 18.956357,
            longitude: 72.804365,
            imageUrl:
              "https://www.mylaporetimes.com/wp-content/uploads/2014/10/IMG_90831.jpg",
            eventName: "Hanging Garden Clean Drive",
            location: "Hanging Garden",
            createdById: "system-fallback",
          } as CommunityEventMarker,
        },
      ];

      this.markerData = [
        ...validPlantMarkers,
        ...validAnimalMarkers,
        ...validLitterMarkers,
        ...validCommunityEventMarkers,
        ...fallbackCommunityEvents, // Append fallback community events
        ...dummyBirdMarkers, // Append dummy bird markers
      ];
      console.log(
        `Fetched ${this.markerData.length} valid markers from API (including ${fallbackCommunityEvents.length} fallback community events and ${dummyBirdMarkers.length} dummy birds):`,
        {
          plants: validPlantMarkers.length,
          animals: validAnimalMarkers.length + dummyBirdMarkers.length,
          litter: validLitterMarkers.length,
          communityEvents:
            validCommunityEventMarkers.length + fallbackCommunityEvents.length,
        }
      );
    } catch (error) {
      console.error("Error fetching markers:", error);
      // Fall back to dummy data if API fails
      this.initializeFallbackData();
    }
  }

  private createMarkerElement(markerInfo: MarkerData): HTMLElement {
    const el = document.createElement("div");
    el.className = `custom-marker marker-${markerInfo.type}`;
    el.setAttribute("data-marker-id", markerInfo.id);

    // Different styles based on marker type
    let borderColor = "#ffffff";
    let shadowColor = "rgba(0,0,0,0.3)";

    switch (markerInfo.type) {
      case "plant":
        borderColor = "#22c55e"; // Green for plants
        shadowColor = "rgba(34,197,94,0.4)";
        break;
      case "animal":
        borderColor = "#3b82f6"; // Blue for animals
        shadowColor = "rgba(59,130,246,0.4)";
        break;
      case "litter":
        borderColor = "#ef4444"; // Red for litter
        shadowColor = "rgba(239,68,68,0.4)";
        break;
      case "community-event":
        borderColor = "#f59e0b"; // Orange for community events
        shadowColor = "rgba(245,158,11,0.4)";
        break;
    }

    el.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 4px 8px ${shadowColor};
      cursor: pointer;
      transition: box-shadow 0.3s ease, border-width 0.3s ease;
      background-image: url('${markerInfo.image}');
      background-size: cover;
      background-position: center;
      opacity: 0;
      position: relative;
    `;

    // Add type indicator icon
    const icon = document.createElement("div");
    let iconSymbol = "";
    switch (markerInfo.type) {
      case "plant":
        iconSymbol = "🌱";
        break;
      case "animal":
        iconSymbol = "🐾";
        break;
      case "litter":
        iconSymbol = "♻️";
        break;
      case "community-event":
        iconSymbol = "🎪";
        break;
    }

    icon.innerHTML = iconSymbol;
    icon.style.cssText = `
      position: absolute;
      bottom: -8px;
      right: -8px;
      background: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border: 2px solid ${borderColor};
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      pointer-events: none;
    `;

    el.appendChild(icon);

    // Click event - add to both elements to ensure it works
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      // Small delay to ensure map state is stable
      setTimeout(() => {
        this.onMarkerClick(markerInfo);
      }, 50);
    };

    el.addEventListener("click", handleClick);
    icon.addEventListener("click", handleClick);

    // Hover effects - use CSS transforms that don't interfere with positioning
    el.addEventListener("mouseenter", () => {
      el.style.boxShadow = `0 6px 12px ${shadowColor.replace("0.4", "0.6")}`;
      el.style.borderWidth = "4px";
      el.style.zIndex = "40";
    });

    el.addEventListener("mouseleave", () => {
      el.style.boxShadow = `0 4px 8px ${shadowColor}`;
      el.style.borderWidth = "3px";
      el.style.zIndex = "auto";
    });

    return el;
  }

  private onMarkerClick(markerInfo: MarkerData) {
    console.log("Marker clicked:", markerInfo);

    // Use callback if provided, otherwise fall back to alert
    if (this.onMarkerClickCallback) {
      this.onMarkerClickCallback(markerInfo);
      return;
    }

    // Fallback alert (for backward compatibility)
    let message = `📍 ${markerInfo.name}\n`;
    message += `Location: ${markerInfo.position[1].toFixed(
      6
    )}, ${markerInfo.position[0].toFixed(6)}\n`;
    message += `ID: ${markerInfo.id}\n\n`;

    switch (markerInfo.type) {
      case "plant": {
        const plantData = markerInfo.originalData as PlantMarker;
        if (plantData) {
          message += `🌱 Plant Species: ${plantData.plantName}\n`;
          message += `Type: Plant Identification\n`;
          message += `Original ID: ${plantData.id}`;
        }
        break;
      }
      case "animal": {
        const animalData = markerInfo.originalData as AnimalMarker;
        if (animalData) {
          message += `🐾 Animal: ${animalData.name}\n`;
          message += `Type: Wildlife Sighting\n`;
          message += `Original ID: ${animalData.id}`;
        }
        break;
      }
      case "litter": {
        const litterData = markerInfo.originalData as LitterMarker;
        if (litterData) {
          message += `♻️ Litter Cleanup Report\n`;
          message += `Type: Environmental Cleanup\n`;
          message += `Original ID: ${litterData.id}\n`;
          message += `Before/After images available`;
        }
        break;
      }
      case "community-event": {
        const eventData = markerInfo.originalData as CommunityEventMarker;
        if (eventData) {
          message += `🎪 Event: ${eventData.eventName}\n`;
          message += `Location: ${eventData.location}\n`;
          message += `Type: Community Event\n`;
          message += `Original ID: ${eventData.id}`;
        }
        break;
      }
    }

    alert(message);
  }

  // Add all markers to the map with staggered animation
  async addMarkers(delay: number = 0) {
    // Clear existing markers first
    this.clearMarkers();

    // Ensure map is ready before adding markers
    if (!this.map.loaded() || !this.map.isStyleLoaded()) {
      console.warn("Map not ready for markers, waiting...");
      setTimeout(() => this.addMarkers(delay), 1000);
      return;
    }

    // Fetch fresh data from API
    await this.fetchMarkers();

    console.log(`Adding ${this.markerData.length} markers from API data`);

    if (this.markerData.length === 0) {
      console.warn("No markers to display, using fallback data");
      this.initializeFallbackData();
    }

    // Choose rendering method based on clustering mode
    if (this.useClusteringMode) {
      this.addClusteredMarkers(delay);
    } else {
      this.addIndividualMarkers(delay);
    }
  }

  // Original individual marker rendering
  private addIndividualMarkers(delay: number = 0) {
    // Add markers with proper validation and error handling
    const validMarkers = this.markerData.filter((markerInfo) => {
      // Enhanced coordinate validation
      if (!markerInfo.position || markerInfo.position.length !== 2) {
        console.warn(
          `Invalid position for marker ${markerInfo.id}:`,
          markerInfo.position
        );
        return false;
      }

      const [lng, lat] = markerInfo.position;

      // Check for valid coordinate ranges and non-zero values
      if (
        isNaN(lng) ||
        isNaN(lat) ||
        lng < -180 ||
        lng > 180 ||
        lat < -90 ||
        lat > 90 ||
        (lng === 0 && lat === 0)
      ) {
        console.warn(`Invalid coordinates for marker ${markerInfo.id}:`, {
          lng,
          lat,
        });
        return false;
      }

      return true;
    });

    console.log(`Creating ${validMarkers.length} valid markers`);

    // Add markers with proper timing
    validMarkers.forEach((markerInfo, index) => {
      const [lng, lat] = markerInfo.position;

      console.log(
        `Creating marker ${markerInfo.id} at [${lng}, ${lat}] - ${markerInfo.name}`
      );

      try {
        const el = this.createMarkerElement(markerInfo);

        // Create marker with explicit positioning
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([lng, lat])
          .addTo(this.map);

        this.markers.push(marker);

        // Animate marker appearance with staggered timing
        setTimeout(() => {
          if (el.parentElement) {
            // Ensure element is still in DOM
            el.style.opacity = "1";
            // Remove the initial transform scale, let it be natural
            el.style.transform = "none";
          }
        }, delay + index * 150);
      } catch (error) {
        console.error(`Error creating marker ${markerInfo.id}:`, error);
      }
    });

    console.log(`Successfully added ${this.markers.length} markers to map`);
  }

  // Hybrid clustered marker rendering - HTML markers with cluster overlay
  private addClusteredMarkers(delay: number = 0) {
    // First, add all individual HTML markers (like normal mode)
    this.addIndividualMarkers(delay);

    // Then add cluster visualization on top
    this.addClusterVisualization();

    console.log(
      `Added ${this.markerData.length} markers with clustering overlay`
    );
  }

  // Add cluster visualization overlay
  private addClusterVisualization() {
    // Remove existing cluster layers
    this.removeClusterLayers();

    // Prepare GeoJSON data for clustering
    const geojsonData = {
      type: "FeatureCollection" as const,
      features: this.markerData.map((marker) => ({
        type: "Feature" as const,
        properties: {
          id: marker.id,
          name: marker.name,
          image: marker.image,
          type: marker.type,
        },
        geometry: {
          type: "Point" as const,
          coordinates: marker.position,
        },
      })),
    };

    // Add clustered source
    this.map.addSource("markers-cluster", {
      type: "geojson",
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 12, // Max zoom to cluster points on (reduced from 16)
      clusterRadius: 80, // Radius of each cluster when clustering points (increased from 60)
    });

    // Add cluster circle layer (only visible at lower zoom levels)
    this.map.addLayer({
      id: "clusters",
      type: "circle",
      source: "markers-cluster",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#3b82f6", // Blue for small clusters
          5,
          "#22c55e", // Green for medium clusters
          15,
          "#f59e0b", // Orange for large clusters
          30,
          "#ef4444", // Red for very large clusters
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          25, // Radius for small clusters
          5,
          35, // Radius for medium clusters
          15,
          45, // Radius for large clusters
          30,
          55, // Radius for very large clusters
        ],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    });

    // Add cluster count labels
    this.map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "markers-cluster",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 14,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.3)",
        "text-halo-width": 1,
      },
    });

    // Add zoom-based visibility control
    this.map.on("zoom", () => {
      this.updateMarkerVisibility();
    });

    // Initial visibility update
    this.updateMarkerVisibility();

    // Add cluster click handlers
    this.addClusterClickHandlers();
  }

  // Update marker visibility based on zoom level
  private updateMarkerVisibility() {
    const zoom = this.map.getZoom();

    // Hide individual markers at low zoom levels when clusters are visible
    this.markers.forEach((marker) => {
      const element = marker.getElement();
      if (zoom < 11) {
        // At low zoom, hide individual markers and show clusters (reduced from 14)
        element.style.display = "none";
      } else {
        // At high zoom, show individual markers and clusters will naturally disappear
        element.style.display = "block";
      }
    });
  }

  // Add click handlers for cluster interactions
  private addClusterClickHandlers() {
    // Click on cluster to zoom in
    this.map.on("click", "clusters", (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });

      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id;
        const source = this.map.getSource(
          "markers-cluster"
        ) as mapboxgl.GeoJSONSource;

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null || zoom === undefined) return;

          const geometry = features[0].geometry as GeoJSON.Point;
          this.map.flyTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom + 3, // Zoom in more for better individual marker visibility (increased from 2)
            pitch: 78.37678796273495,
            duration: 800,
            easing: (t) => t * (2 - t), // Smooth easing
            essential: true,
          });
        });
      }
    });

    // Change cursor on hover for clusters
    this.map.on("mouseenter", "clusters", () => {
      this.map.getCanvas().style.cursor = "pointer";
    });

    this.map.on("mouseleave", "clusters", () => {
      this.map.getCanvas().style.cursor = "";
    });

    // Zoom handler is now managed in addClusterVisualization method
  }

  // Remove cluster layers and sources
  private removeClusterLayers() {
    const layersToRemove = ["clusters", "cluster-count"];

    layersToRemove.forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource("markers-cluster")) {
      this.map.removeSource("markers-cluster");
    }

    // Make all individual markers visible when clustering is disabled
    this.markers.forEach((marker) => {
      const element = marker.getElement();
      element.style.display = "block";
    });
  }

  // Switch between clustering and individual marker modes
  setClusteringMode(enabled: boolean) {
    this.useClusteringMode = enabled;
    // Re-render markers with new mode
    this.addMarkers(0);
  }

  // Get current clustering mode
  isClusteringEnabled(): boolean {
    return this.useClusteringMode;
  }

  private initializeFallbackData() {
    // Fixed locations around India with realistic coordinates as fallback
    this.markerData = [
      {
        id: "mumbai-fallback-plant",
        name: "Mumbai Local Plant",
        image:
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=60&h=60&fit=crop&crop=center",
        position: [72.900719, 19.072816], // Your specified fallback location
        type: "plant" as const,
        createdById: "system-fallback",
      },
      {
        id: "mumbai-plant",
        name: "Mumbai Garden Plant",
        image:
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=60&h=60&fit=crop&crop=center",
        position: [72.8777, 19.076], // Mumbai
        type: "plant" as const,
        createdById: "system-fallback",
      },
      {
        id: "delhi-animal",
        name: "Delhi Wildlife",
        image:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60&h=60&fit=crop&crop=center",
        position: [77.1025, 28.7041], // Delhi
        type: "animal" as const,
        createdById: "system-fallback",
      },
      {
        id: "bangalore-litter",
        name: "Bangalore Cleanup",
        image:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=60&h=60&fit=crop&crop=center",
        position: [77.5946, 12.9716], // Bangalore
        type: "litter" as const,
        createdById: "system-fallback",
      },
      // Community Event markers
      {
        id: "juhu-beach-cleaning",
        name: "Juhu Beach Cleaning Drive",
        image:
          "https://thecsrjournal.in/wp-content/uploads/2018/09/Adani-clean-up-after-Ganpati-immersion.jpg",
        position: [72.8265, 19.0989], // Juhu Beach coordinates
        type: "community-event" as const,
        createdById: "system-fallback",
        originalData: {
          id: "juhu-beach-cleaning",
          latitude: 19.0989,
          longitude: 72.8265,
          imageUrl:
            "https://thecsrjournal.in/wp-content/uploads/2018/09/Adani-clean-up-after-Ganpati-immersion.jpg",
          eventName: "Juhu Beach Cleaning Drive",
          location: "Juhu Beach",
          createdById: "system-fallback",
        } as CommunityEventMarker,
      },
      {
        id: "hanging-garden-clean-drive",
        name: "Hanging Garden Clean Drive",
        image:
          "https://www.mylaporetimes.com/wp-content/uploads/2014/10/IMG_90831.jpg",
        position: [72.804365, 18.956357], // Hanging Garden coordinates
        type: "community-event" as const,
        createdById: "system-fallback",
        originalData: {
          id: "hanging-garden-clean-drive",
          latitude: 18.956357,
          longitude: 72.804365,
          imageUrl:
            "https://www.mylaporetimes.com/wp-content/uploads/2014/10/IMG_90831.jpg",
          eventName: "Hanging Garden Clean Drive",
          location: "Hanging Garden",
          createdById: "system-fallback",
        } as CommunityEventMarker,
      },
      // Bird markers near fallback location
      {
        id: "fallback-bird-zebra-finch",
        name: "Zebra Finch",
        image:
          "https://cdn.britannica.com/10/250610-050-BC5CCDAF/Zebra-finch-Taeniopygia-guttata-bird.jpg",
        position: [72.901719, 19.073816], // Near fallback location
        type: "animal" as const,
        createdById: "system-fallback",
      },
      {
        id: "fallback-bird-black-woodpecker",
        name: "Black Woodpecker",
        image:
          "https://cdn.britannica.com/45/251245-050-86C44E19/black-woodpecker-bird-dryocopus-martius.jpg",
        position: [72.899719, 19.071816], // Near fallback location
        type: "animal" as const,
        createdById: "system-fallback",
      },
    ];
  }

  // Refresh markers (useful after new uploads)
  async refreshMarkers() {
    await this.addMarkers(0);
  }

  // Force reposition only when explicitly needed (not on every interaction)
  forceRepositionMarkers() {
    console.log("Force repositioning markers...");
    this.repositionMarkers();
  }

  // Fix marker positions if they get displaced
  repositionMarkers() {
    console.log("Repositioning markers...");
    this.markers.forEach((marker) => {
      try {
        const element = marker.getElement();
        const markerId = element.getAttribute("data-marker-id");

        if (markerId) {
          const markerData = this.markerData.find((m) => m.id === markerId);
          if (markerData && markerData.position) {
            const currentLngLat = marker.getLngLat();
            const [expectedLng, expectedLat] = markerData.position;

            // Only reposition if there's a significant difference (avoid micro-adjustments)
            const lngDiff = Math.abs(currentLngLat.lng - expectedLng);
            const latDiff = Math.abs(currentLngLat.lat - expectedLat);

            if (lngDiff > 0.0001 || latDiff > 0.0001) {
              marker.setLngLat(markerData.position);
              console.log(
                `Repositioned marker ${markerId} to correct position`
              );
            }
          }
        }
      } catch (error) {
        console.warn("Error repositioning marker:", error);
      }
    });
  }

  // Filter markers by type
  getMarkersByType(
    type: "plant" | "animal" | "litter" | "community-event"
  ): MarkerData[] {
    return this.markerData.filter((marker) => marker.type === type);
  }

  // Clear all markers from the map
  clearMarkers() {
    // Clear individual markers
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    // Clear cluster layers if they exist
    if (this.useClusteringMode) {
      this.removeClusterLayers();
    }
  }

  // Update marker data (for future API integration)
  updateMarkerData(newMarkerData: MarkerData[]) {
    this.markerData = newMarkerData;
  }

  // Get marker by ID
  getMarkerById(id: string): MarkerData | undefined {
    return this.markerData.find((marker) => marker.id === id);
  }

  // Get all marker data
  getAllMarkers(): MarkerData[] {
    return [...this.markerData];
  }

  // Get markers by user ID
  getMarkersByUserId(userId: string): MarkerData[] {
    return this.markerData.filter((marker) => marker.createdById === userId);
  }

  // Get user submission statistics
  getUserSubmissionStats(userId: string): {
    total: number;
    plants: number;
    animals: number;
    litter: number;
    communityEvents: number;
  } {
    const userMarkers = this.getMarkersByUserId(userId);
    return {
      total: userMarkers.length,
      plants: userMarkers.filter((m) => m.type === "plant").length,
      animals: userMarkers.filter((m) => m.type === "animal").length,
      litter: userMarkers.filter((m) => m.type === "litter").length,
      communityEvents: userMarkers.filter((m) => m.type === "community-event")
        .length,
    };
  }

  // Remove specific marker by ID
  removeMarkerById(id: string) {
    const markerIndex = this.markers.findIndex((marker) => {
      const element = marker.getElement();
      return element.getAttribute("data-marker-id") === id;
    });

    if (markerIndex !== -1) {
      this.markers[markerIndex].remove();
      this.markers.splice(markerIndex, 1);
    }

    // Also remove from data
    this.markerData = this.markerData.filter((marker) => marker.id !== id);
  }
}
