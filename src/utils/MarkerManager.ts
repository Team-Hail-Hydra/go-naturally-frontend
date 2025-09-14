import mapboxgl from "mapbox-gl";

export interface MarkerData {
  id: string;
  name: string;
  image: string;
  position: [number, number]; // [longitude, latitude]
}

export class MarkerManager {
  private map: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];
  private markerData: MarkerData[] = [];

  constructor(map: mapboxgl.Map) {
    this.map = map;
    this.initializeMarkerData();
  }

  private initializeMarkerData() {
    // Fixed locations around India with realistic coordinates
    this.markerData = [
      {
        id: "mumbai-coffee",
        name: "Coffee Shop Mumbai",
        image:
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=60&h=60&fit=crop&crop=center",
        position: [72.8777, 19.076], // Mumbai
      },
      {
        id: "delhi-restaurant",
        name: "Restaurant Delhi",
        image:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60&h=60&fit=crop&crop=center",
        position: [77.1025, 28.7041], // Delhi
      },
      {
        id: "bangalore-park",
        name: "Park Bangalore",
        image:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=60&h=60&fit=crop&crop=center",
        position: [77.5946, 12.9716], // Bangalore
      },
      {
        id: "chennai-mall",
        name: "Shopping Mall Chennai",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=60&h=60&fit=crop&crop=center",
        position: [80.2707, 13.0827], // Chennai
      },
      {
        id: "kolkata-gas",
        name: "Gas Station Kolkata",
        image:
          "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=60&h=60&fit=crop&crop=center",
        position: [88.3639, 22.5726], // Kolkata
      },
      {
        id: "hyderabad-hospital",
        name: "Hospital Hyderabad",
        image:
          "https://images.unsplash.com/photo-1551076805-e1869033e561?w=60&h=60&fit=crop&crop=center",
        position: [78.4867, 17.385], // Hyderabad
      },
      {
        id: "pune-school",
        name: "School Pune",
        image:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=60&h=60&fit=crop&crop=center",
        position: [73.8567, 18.5204], // Pune
      },
      {
        id: "ahmedabad-bank",
        name: "Bank Ahmedabad",
        image:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=60&h=60&fit=crop&crop=center",
        position: [72.5714, 23.0225], // Ahmedabad
      },
      {
        id: "jaipur-hotel",
        name: "Hotel Jaipur",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=60&h=60&fit=crop&crop=center",
        position: [75.7873, 26.9124], // Jaipur
      },
      {
        id: "kochi-port",
        name: "Port Kochi",
        image:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop&crop=center",
        position: [76.2673, 9.9312], // Kochi
      },
    ];
  }

  private createMarkerElement(markerInfo: MarkerData): HTMLElement {
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.setAttribute("data-marker-id", markerInfo.id);

    el.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      background-image: url('${markerInfo.image}');
      background-size: cover;
      background-position: center;
      opacity: 0;
      transform: scale(0.5);
    `;

    // Hover effects
    el.addEventListener("mouseenter", () => {
      el.style.transform = "scale(1.1)";
      el.style.boxShadow = "0 6px 12px rgba(0,0,0,0.4)";
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "scale(1)";
      el.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    });

    // Click event
    el.addEventListener("click", () => {
      this.onMarkerClick(markerInfo);
    });

    return el;
  }

  private onMarkerClick(markerInfo: MarkerData) {
    alert(
      `📍 ${markerInfo.name}\nLocation: ${markerInfo.position[1].toFixed(
        6
      )}, ${markerInfo.position[0].toFixed(6)}\nID: ${markerInfo.id}`
    );
  }

  // Add all markers to the map with staggered animation
  addMarkers(delay: number = 0) {
    // Clear existing markers first
    this.clearMarkers();

    console.log(`Adding ${this.markerData.length} markers across India`);

    this.markerData.forEach((markerInfo, index) => {
      const el = this.createMarkerElement(markerInfo);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(markerInfo.position)
        .addTo(this.map);

      this.markers.push(marker);

      // Animate marker appearance with staggered timing
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      }, delay + index * 200);
    });
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
