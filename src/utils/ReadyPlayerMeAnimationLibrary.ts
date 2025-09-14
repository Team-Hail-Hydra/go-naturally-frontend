// ReadyPlayerMe Animation Library Integration
// This class loads real ReadyPlayerMe animations from their official library
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface RPMAnimation {
  name: string;
  url: string;
  category: "idle" | "locomotion" | "emotes" | "dance" | "actions";
  description: string;
}

export class ReadyPlayerMeAnimationLibrary {
  // Official ReadyPlayerMe Animation Library with real GLB URLs
  // These animations work with ANY ReadyPlayerMe avatar
  private static readonly ANIMATION_LIBRARY: RPMAnimation[] = [
    // Idle Animations for State Machine - Base Animation
    {
      name: "idle_base",
      url: "https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/idle/M_Standing_Idle_002.glb",
      category: "idle",
      description: "Standing idle 002 - Base idle animation",
    },
    // Idle Variations for Dynamic Behavior
    {
      name: "idle_variation_005",
      url: "https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/idle/M_Standing_Idle_Variations_005.glb",
      category: "idle",
      description: "Standing idle variation 005 - Random variation",
    },
    {
      name: "idle_variation_006",
      url: "https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/idle/M_Standing_Idle_Variations_006.glb",
      category: "idle",
      description: "Standing idle variation 006 - Random variation",
    },
    {
      name: "idle_variation_007",
      url: "https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/idle/M_Standing_Idle_Variations_007.glb",
      category: "idle",
      description: "Standing idle variation 007 - Random variation",
    },
    {
      name: "idle_variation_008",
      url: "https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/idle/M_Standing_Idle_Variations_008.glb",
      category: "idle",
      description: "Standing idle variation 008 - Random variation",
    },
    // Locomotion Animation (separate for later use)
    {
      name: "walking",
      url: "https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/locomotion/M_Walk_001.glb",
      category: "locomotion",
      description: "Basic walking cycle",
    },
  ];

  // Get all available animations
  public static getAnimations(): RPMAnimation[] {
    return this.ANIMATION_LIBRARY;
  }

  // Get animations by category
  public static getAnimationsByCategory(
    category: RPMAnimation["category"]
  ): RPMAnimation[] {
    return this.ANIMATION_LIBRARY.filter((anim) => anim.category === category);
  }

  // Get animation by name
  public static getAnimation(name: string): RPMAnimation | undefined {
    return this.ANIMATION_LIBRARY.find((anim) => anim.name === name);
  }

  // Load animation from ReadyPlayerMe official library
  public static async loadAnimation(
    animationName: string
  ): Promise<THREE.AnimationClip | null> {
    const animationData = this.getAnimation(animationName);
    if (!animationData) {
      console.warn(
        `Animation "${animationName}" not found in ReadyPlayerMe library`
      );
      return null;
    }

    try {
      console.log(
        `Loading animation "${animationName}" from:`,
        animationData.url
      );

      const loader = new GLTFLoader();
      const gltf = await new Promise<{
        scene: THREE.Group;
        animations: THREE.AnimationClip[];
      }>((resolve, reject) => {
        loader.load(
          animationData.url,
          resolve,
          (progress) => {
            console.log(
              `Loading animation ${animationName}:`,
              Math.round((progress.loaded / progress.total) * 100) + "%"
            );
          },
          reject
        );
      });

      if (gltf.animations && gltf.animations.length > 0) {
        console.log(
          `Successfully loaded animation "${animationName}" with ${gltf.animations.length} clips`
        );
        // Return the first animation clip (ReadyPlayerMe animations typically have one clip)
        return gltf.animations[0];
      }

      console.warn(`No animations found in ${animationData.url}`);
      return null;
    } catch (error) {
      console.error(`Failed to load animation "${animationName}":`, error);
      return null;
    }
  }

  // Load multiple animations at once
  public static async loadAnimations(
    animationNames: string[]
  ): Promise<{ [key: string]: THREE.AnimationClip }> {
    const animations: { [key: string]: THREE.AnimationClip } = {};

    const promises = animationNames.map(async (name) => {
      const clip = await this.loadAnimation(name);
      if (clip) {
        animations[name] = clip;
      }
    });

    await Promise.all(promises);
    return animations;
  }

  // Get recommended animation set for different use cases
  public static getRecommendedAnimationSet(
    useCase: "basic" | "social" | "gaming" | "complete"
  ): string[] {
    switch (useCase) {
      case "basic":
        return [
          "idle_base",
          "idle_variation_006",
          "idle_variation_007",
          "walking",
        ];
      case "social":
        return [
          "idle_base",
          "idle_variation_005",
          "idle_variation_006",
          "idle_variation_007",
          "idle_variation_008",
          "walking",
        ];
      case "gaming":
        return this.ANIMATION_LIBRARY.map((anim) => anim.name);
      case "complete":
        return this.ANIMATION_LIBRARY.map((anim) => anim.name);
      default:
        return [
          "idle_base",
          "idle_variation_005",
          "idle_variation_006",
          "idle_variation_007",
          "idle_variation_008",
          "walking",
        ];
    }
  }
}
