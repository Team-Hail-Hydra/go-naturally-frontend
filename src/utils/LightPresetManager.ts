// Simplified Light Preset System using Mapbox built-in presets
// Uses Mapbox's native dawn, day, dusk, night lighting

export interface SimpleLightPreset {
  name: "dawn" | "day" | "dusk" | "night";
  description: string;
  timeRange: { start: number; end: number }; // 24-hour format
}

export class LightPresetManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any; // Mapbox Map instance
  private currentPreset?: SimpleLightPreset;
  private updateInterval?: number;

  // Simplified light presets using Mapbox built-in lighting
  private static readonly LIGHT_PRESETS: SimpleLightPreset[] = [
    {
      name: "night",
      description: "Deep night with moonlight",
      timeRange: { start: 0, end: 6 },
    },
    {
      name: "dawn",
      description: "Early morning sunrise",
      timeRange: { start: 6, end: 12 },
    },
    {
      name: "day",
      description: "Bright daylight",
      timeRange: { start: 12, end: 18 },
    },
    {
      name: "dusk",
      description: "Evening twilight",
      timeRange: { start: 18, end: 24 },
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(map: any) {
    this.map = map;
    this.applyCurrentTimePreset();
    this.startAutoUpdate();
  }

  // Get current time and determine appropriate preset
  private getCurrentHour(): number {
    return new Date().getHours();
  }

  // Find the appropriate preset for the current time
  private getPresetForTime(hour: number): SimpleLightPreset {
    for (const preset of LightPresetManager.LIGHT_PRESETS) {
      const { start, end } = preset.timeRange;

      // Handle day boundary (e.g., 18:00 - 24:00 includes 0:00 - 6:00)
      if (start > end) {
        if (hour >= start || hour < end) {
          return preset;
        }
      } else {
        if (hour >= start && hour < end) {
          return preset;
        }
      }
    }

    // Fallback to day if no match found
    return LightPresetManager.LIGHT_PRESETS.find((p) => p.name === "day")!;
  }

  // Apply light preset using Mapbox's built-in presets
  private applyLightPreset(preset: SimpleLightPreset) {
    if (!this.map.isStyleLoaded()) {
      // Wait for style to load before applying lighting
      this.map.once("styledata", () => this.applyLightPreset(preset));
      return;
    }

    try {
      // Use Mapbox's built-in light presets
      this.map.setConfigProperty("basemap", "lightPreset", preset.name);

      this.currentPreset = preset;
      console.log(
        `Applied light preset: ${preset.name} (${preset.description})`
      );
    } catch (error) {
      console.warn("Failed to apply light preset:", error);

      // Fallback: try to set basic lighting properties
      try {
        if (preset.name === "night") {
          this.map.setLight({
            color: "#2d3748",
            intensity: 0.3,
          });
        } else if (preset.name === "dawn") {
          this.map.setLight({
            color: "#fbb6ce",
            intensity: 0.6,
          });
        } else if (preset.name === "day") {
          this.map.setLight({
            color: "#ffffff",
            intensity: 1.0,
          });
        } else if (preset.name === "dusk") {
          this.map.setLight({
            color: "#9f7aea",
            intensity: 0.5,
          });
        }
      } catch (fallbackError) {
        console.warn("Fallback lighting also failed:", fallbackError);
      }
    }
  }

  // Apply preset based on current time
  public applyCurrentTimePreset() {
    const currentHour = this.getCurrentHour();
    const preset = this.getPresetForTime(currentHour);
    this.applyLightPreset(preset);
  }

  // Start automatic updates every hour
  private startAutoUpdate() {
    // Update every hour (3600000 ms)
    this.updateInterval = setInterval(() => {
      this.applyCurrentTimePreset();
    }, 3600000);

    // Also update on the next hour boundary
    const now = new Date();
    const nextHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() + 1,
      0,
      0,
      0
    );
    const timeToNextHour = nextHour.getTime() - now.getTime();

    setTimeout(() => {
      this.applyCurrentTimePreset();
    }, timeToNextHour);
  }

  // Manual preset application
  public applyPreset(presetName: string) {
    const preset = LightPresetManager.LIGHT_PRESETS.find(
      (p) => p.name === presetName
    );
    if (preset) {
      this.applyLightPreset(preset);
    } else {
      console.warn(`Light preset "${presetName}" not found`);
    }
  }

  // Get available presets
  public getAvailablePresets(): string[] {
    return LightPresetManager.LIGHT_PRESETS.map((p) => p.name);
  }

  // Get current preset info
  public getCurrentPreset(): SimpleLightPreset | undefined {
    return this.currentPreset;
  }

  // Cleanup
  public destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
}
