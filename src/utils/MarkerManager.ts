import mapboxgl from "mapbox-gl";
import axios from 'axios';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PlantMarker {
  id: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  plantName: string;
}

export interface AnimalMarker {
  id: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  name: string;
}

export interface LitterMarker {
  id: string;
  latitude: number;
  longitude: number;
  beforeImg: string;
  afterImg: string;
}

export interface MarkerData {
  id: string;
  name: string;
  image: string;
  position: [number, number]; // [longitude, latitude]
  type: 'plant' | 'animal' | 'litter';
  originalData?: PlantMarker | AnimalMarker | LitterMarker;
}

export class MarkerManager {
  private map: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];
  private markerData: MarkerData[] = [];

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  // Fetch markers from API
  async fetchMarkers() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get('http://localhost:3000/api/v1/markers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const { plants, animals, litters } = response.data;
      
      // Convert API data to MarkerData format
      const plantMarkers: MarkerData[] = plants.map((plant: PlantMarker) => ({
        id: `plant-${plant.id}`,
        name: plant.plantName,
        image: plant.imageUrl,
        position: [plant.longitude, plant.latitude] as [number, number],
        type: 'plant' as const,
        originalData: plant
      }));

      const animalMarkers: MarkerData[] = animals.map((animal: AnimalMarker) => ({
        id: `animal-${animal.id}`,
        name: animal.name,
        image: animal.imageUrl,
        position: [animal.longitude, animal.latitude] as [number, number],
        type: 'animal' as const,
        originalData: animal
      }));

      const litterMarkers: MarkerData[] = litters.map((litter: LitterMarker) => ({
        id: `litter-${litter.id}`,
        name: 'Litter Cleanup',
        image: litter.afterImg, // Use after image as the main display
        position: [litter.longitude, litter.latitude] as [number, number],
        type: 'litter' as const,
        originalData: litter
      }));

      // Filter out any markers with invalid coordinates
      const validPlantMarkers = plantMarkers.filter(m => 
        !isNaN(m.position[0]) && !isNaN(m.position[1]) && 
        m.position[0] !== 0 && m.position[1] !== 0
      );
      const validAnimalMarkers = animalMarkers.filter(m => 
        !isNaN(m.position[0]) && !isNaN(m.position[1]) && 
        m.position[0] !== 0 && m.position[1] !== 0
      );
      const validLitterMarkers = litterMarkers.filter(m => 
        !isNaN(m.position[0]) && !isNaN(m.position[1]) && 
        m.position[0] !== 0 && m.position[1] !== 0
      );

      this.markerData = [...validPlantMarkers, ...validAnimalMarkers, ...validLitterMarkers];
      console.log(`Fetched ${this.markerData.length} valid markers from API:`, {
        plants: validPlantMarkers.length,
        animals: validAnimalMarkers.length,
        litter: validLitterMarkers.length
      });

    } catch (error) {
      console.error('Error fetching markers:', error);
      // Fall back to dummy data if API fails
      this.initializeFallbackData();
    }
  }

  private initializeFallbackData() {
    // Fixed locations around India with realistic coordinates as fallback
    this.markerData = [
      {
        id: "mumbai-coffee",
        name: "Coffee Shop Mumbai",
        image:
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=60&h=60&fit=crop&crop=center",
        position: [72.8777, 19.076], // Mumbai
        type: 'plant' as const,
      },
      {
        id: "delhi-restaurant",
        name: "Restaurant Delhi",
        image:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60&h=60&fit=crop&crop=center",
        position: [77.1025, 28.7041], // Delhi
        type: 'animal' as const,
      },
      {
        id: "bangalore-park",
        name: "Park Bangalore",
        image:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=60&h=60&fit=crop&crop=center",
        position: [77.5946, 12.9716], // Bangalore
        type: 'litter' as const,
      }
    ];
  }

  private createMarkerElement(markerInfo: MarkerData): HTMLElement {
    const el = document.createElement("div");
    el.className = `custom-marker marker-${markerInfo.type}`;
    el.setAttribute("data-marker-id", markerInfo.id);

    // Different styles based on marker type
    let borderColor = '#ffffff';
    let shadowColor = 'rgba(0,0,0,0.3)';
    
    switch (markerInfo.type) {
      case 'plant':
        borderColor = '#22c55e'; // Green for plants
        shadowColor = 'rgba(34,197,94,0.4)';
        break;
      case 'animal':
        borderColor = '#3b82f6'; // Blue for animals
        shadowColor = 'rgba(59,130,246,0.4)';
        break;
      case 'litter':
        borderColor = '#ef4444'; // Red for litter
        shadowColor = 'rgba(239,68,68,0.4)';
        break;
    }

    el.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 4px 8px ${shadowColor};
      cursor: pointer;
      transition: all 0.3s ease;
      background-image: url('${markerInfo.image}');
      background-size: cover;
      background-position: center;
      opacity: 0;
      transform: scale(0.5);
      position: relative;
    `;

    // Add type indicator icon
    const icon = document.createElement("div");
    let iconSymbol = '';
    switch (markerInfo.type) {
      case 'plant':
        iconSymbol = '🌱';
        break;
      case 'animal':
        iconSymbol = '🐾';
        break;
      case 'litter':
        iconSymbol = '♻️';
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
      this.onMarkerClick(markerInfo);
    };

    el.addEventListener("click", handleClick);
    icon.addEventListener("click", handleClick);

    // Hover effects
    el.addEventListener("mouseenter", () => {
      el.style.transform = "scale(1.1)";
      el.style.boxShadow = `0 6px 12px ${shadowColor.replace('0.4', '0.6')}`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "scale(1)";
      el.style.boxShadow = `0 4px 8px ${shadowColor}`;
    });

    return el;
  }

  private onMarkerClick(markerInfo: MarkerData) {
    console.log('Marker clicked:', markerInfo);
    
    let message = `📍 ${markerInfo.name}\n`;
    message += `Location: ${markerInfo.position[1].toFixed(6)}, ${markerInfo.position[0].toFixed(6)}\n`;
    message += `ID: ${markerInfo.id}\n\n`;
    
    switch (markerInfo.type) {
      case 'plant':
        const plantData = markerInfo.originalData as PlantMarker;
        if (plantData) {
          message += `🌱 Plant Species: ${plantData.plantName}\n`;
          message += `Type: Plant Identification\n`;
          message += `Original ID: ${plantData.id}`;
        }
        break;
      case 'animal':
        const animalData = markerInfo.originalData as AnimalMarker;
        if (animalData) {
          message += `🐾 Animal: ${animalData.name}\n`;
          message += `Type: Wildlife Sighting\n`;
          message += `Original ID: ${animalData.id}`;
        }
        break;
      case 'litter':
        const litterData = markerInfo.originalData as LitterMarker;
        if (litterData) {
          message += `♻️ Litter Cleanup Report\n`;
          message += `Type: Environmental Cleanup\n`;
          message += `Original ID: ${litterData.id}\n`;
          message += `Before/After images available`;
        }
        break;
    }
    
    alert(message);
  }

  // Add all markers to the map with staggered animation
  async addMarkers(delay: number = 0) {
    // Clear existing markers first
    this.clearMarkers();

    // Fetch fresh data from API
    await this.fetchMarkers();

    console.log(`Adding ${this.markerData.length} markers from API data`);

    if (this.markerData.length === 0) {
      console.warn('No markers to display');
      return;
    }

    this.markerData.forEach((markerInfo, index) => {
      // Validate coordinates before creating marker
      if (!markerInfo.position || markerInfo.position.length !== 2) {
        console.warn(`Invalid position for marker ${markerInfo.id}:`, markerInfo.position);
        return;
      }

      const [lng, lat] = markerInfo.position;
      if (isNaN(lng) || isNaN(lat)) {
        console.warn(`NaN coordinates for marker ${markerInfo.id}:`, { lng, lat });
        return;
      }

      console.log(`Creating marker ${markerInfo.id} at [${lng}, ${lat}] - ${markerInfo.name}`);

      const el = this.createMarkerElement(markerInfo);

      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(this.map);

        this.markers.push(marker);

        // Animate marker appearance with staggered timing
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "scale(1)";
        }, delay + index * 100); // Reduced delay for faster loading

      } catch (error) {
        console.error(`Error creating marker ${markerInfo.id}:`, error);
      }
    });

    console.log(`Successfully added ${this.markers.length} markers to map`);
  }

  // Refresh markers (useful after new uploads)
  async refreshMarkers() {
    await this.addMarkers(0);
  }

  // Filter markers by type
  getMarkersByType(type: 'plant' | 'animal' | 'litter'): MarkerData[] {
    return this.markerData.filter(marker => marker.type === type);
  }

  // Clear all markers from the map
  clearMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
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
