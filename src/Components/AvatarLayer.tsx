import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import mapboxgl from "mapbox-gl";
import { ReadyPlayerMeAnimationLibrary } from "../utils/ReadyPlayerMeAnimationLibrary";
import { AnimationStateMachine } from "../utils/AnimationStateMachine";

export interface AvatarLayerOptions {
  id: string;
  avatarUrl: string;
  position: [number, number]; // [longitude, latitude]
  scale?: number;
}

export class AvatarLayer implements mapboxgl.CustomLayerInterface {
  id: string;
  type = "custom" as const;
  renderingMode = "3d" as const;

  private map?: mapboxgl.Map;
  private camera?: THREE.Camera;
  private scene?: THREE.Scene;
  private renderer?: THREE.WebGLRenderer;
  private avatar?: THREE.Group;
  private options: AvatarLayerOptions;
  private mixer?: THREE.AnimationMixer;
  private clock: THREE.Clock;
  private currentAction?: THREE.AnimationAction;
  private actions: { [key: string]: THREE.AnimationAction } = {};
  private animationStateMachine?: AnimationStateMachine;


  constructor(options: AvatarLayerOptions) {
    this.id = options.id;
    this.options = options;
    this.clock = new THREE.Clock();
  }

  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.map = map;

    // Create Three.js scene
    this.scene = new THREE.Scene();

    // Create camera
    this.camera = new THREE.Camera();

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });

    this.renderer.autoClear = false;

    // Enable shadows for better depth perception
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Enhanced lighting setup for better visibility
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    this.scene.add(directionalLight);

    // Back light to illuminate the back of the model
    const backLight = new THREE.DirectionalLight(0x8899ff, 0.8);
    backLight.position.set(-50, 80, -100);
    this.scene.add(backLight);

    // Fill light from the side
    const fillLight = new THREE.DirectionalLight(0xffaa88, 0.5);
    fillLight.position.set(-100, 50, 0);
    this.scene.add(fillLight);

    // Increased ambient light for overall brightness
    const ambientLight = new THREE.AmbientLight(0x606060, 0.8);
    this.scene.add(ambientLight);

    // Hemisphere light for natural outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(
      0x87ceeb, // sky color
      0x8b7355, // ground color
      0.6
    );
    this.scene.add(hemisphereLight);

    // Point light near the avatar for extra visibility
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 50, 0);
    this.scene.add(pointLight);

    // Load avatar
    this.loadAvatar();
  }

  private async loadAvatar() {
    if (!this.scene) return;
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise<{
        scene: THREE.Group;
        scenes: THREE.Group[];
        cameras: THREE.Camera[];
        animations: THREE.AnimationClip[];
      }>((resolve, reject) => {
        loader.load(this.options.avatarUrl, resolve, undefined, reject);
      });

      this.avatar = gltf.scene;

      if (this.avatar && this.scene) {
        // Enable shadows on the avatar
        this.avatar.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Enhance material properties for better visibility
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial ||
                    mat instanceof THREE.MeshPhysicalMaterial) {
                    mat.envMapIntensity = 0.8;
                    mat.needsUpdate = true;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial ||
                child.material instanceof THREE.MeshPhysicalMaterial) {
                child.material.envMapIntensity = 0.8;
                child.material.needsUpdate = true;
              }
            }
          }
        });

        // Setup animation mixer for ReadyPlayerMe animations
        // Find the armature/skeleton in the avatar hierarchy
        let animationRoot = this.avatar;
        this.avatar.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh) {
            // Use the skeleton root if we find a skinned mesh
            if (child.skeleton && child.skeleton.bones.length > 0) {
              const parentBone = child.skeleton.bones[0].parent;
              if (parentBone) {
                animationRoot = parentBone as THREE.Group;
              }
            }
          }
        });

        console.log("Animation root object:", animationRoot);
        this.mixer = new THREE.AnimationMixer(animationRoot);

        // Check if avatar already has animations (some ReadyPlayerMe avatars come with basic animations)
        if (gltf.animations && gltf.animations.length > 0) {
          // Store avatar's built-in animations
          gltf.animations.forEach((clip, index) => {
            const action = this.mixer!.clipAction(clip);
            this.actions[clip.name || `builtin_${index}`] = action;
          });
          console.log("Found built-in animations:", Object.keys(this.actions));
        }

        // Load ReadyPlayerMe animations
        this.loadAnimations();

        this.scene.add(this.avatar);
        console.log("Avatar loaded and added to scene with enhanced lighting");
      }
      this.map?.triggerRepaint();
    } catch (error) {
      console.error("Error loading avatar:", error);
    }
  }

  render(_gl: WebGLRenderingContext, matrix: number[]) {
    if (!this.camera || !this.scene || !this.renderer || !this.avatar) return;

    // Update animation mixer
    if (this.mixer) {
      const deltaTime = this.clock.getDelta();
      this.mixer.update(deltaTime);

      // Update animation state machine
      if (this.animationStateMachine) {
        this.animationStateMachine.update(deltaTime);
      }
    }

    // Get the mercator coordinate for the position
    const modelOrigin = this.options.position;
    // Raise the model above ground
    const modelAltitude = 0; // Increased altitude for better visibility
    // Rotate model to face camera better
    const modelRotate = [Math.PI / 2, Math.PI, 0]; // X, Y, Z

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    // Adjust scale for better visibility
    const modelScale =
      modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() *
      (this.options.scale || 15);

    // Build transformation matrix
    const translate = new THREE.Matrix4().makeTranslation(
      modelAsMercatorCoordinate.x,
      modelAsMercatorCoordinate.y,
      modelAsMercatorCoordinate.z || 0
    );
    const scale = new THREE.Matrix4().makeScale(
      modelScale,
      -modelScale,
      modelScale
    );
    const rotationX = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(1, 0, 0),
      modelRotate[0]
    );
    const rotationY = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(0, 1, 0),
      modelRotate[1]
    );
    const rotationZ = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(0, 0, 1),
      modelRotate[2]
    );

    // Compose the transformation
    const l = new THREE.Matrix4()
      .multiply(translate)
      .multiply(scale)
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    // Mapbox projection matrix
    const m = new THREE.Matrix4().fromArray(matrix);
    this.camera.projectionMatrix = m.multiply(l);

    // Update lighting position relative to camera
    if (this.map) {
      const bearing = this.map.getBearing();
      // const pitch = this.map.getPitch();

      // Rotate lights based on camera orientation for consistent lighting
      const lights = this.scene.children.filter(child => child instanceof THREE.Light);
      lights.forEach(light => {
        if (light instanceof THREE.DirectionalLight && light.intensity === 0.8) {
          // Rotate back light to always illuminate from behind camera
          const angle = (bearing * Math.PI) / 180;
          light.position.set(
            -Math.sin(angle) * 100,
            80,
            -Math.cos(angle) * 100
          );
        }
      });
    }

    // Render
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map?.triggerRepaint();
  }

  onRemove() {
    if (this.avatar && this.scene) {
      this.scene.remove(this.avatar);
    }
  }

  updateAvatarPosition(position: [number, number]) {
    this.options.position = position;
    if (this.avatar && this.map) {
      const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        position,
        15 // Keep consistent altitude
      );

      // Update position with proper scaling
      this.avatar.position.set(
        modelAsMercatorCoordinate.x,
        modelAsMercatorCoordinate.y,
        modelAsMercatorCoordinate.z || 0
      );

      console.log("Avatar position updated:", position, this.avatar.position);
      this.map.triggerRepaint();
    }
  }

  // Animation control methods
  playAnimation(animationName: string, fadeTime: number = 0.5) {
    if (!this.mixer) {
      console.warn("Animation mixer not initialized");
      return;
    }

    // Handle walking animation through state machine
    if (animationName === 'walking' && this.animationStateMachine) {
      this.animationStateMachine.startWalking();
      return;
    }

    // Handle idle animations through state machine
    if ((animationName === 'idle' || animationName.includes('idle')) && this.animationStateMachine) {
      this.animationStateMachine.returnToBaseIdle();
      return;
    }

    // Fallback to direct animation control for other animations
    if (!this.actions[animationName]) {
      console.warn(`Animation "${animationName}" not found. Available: ${Object.keys(this.actions).join(', ')}`);
      return;
    }

    const newAction = this.actions[animationName];

    if (this.currentAction && this.currentAction !== newAction) {
      // Crossfade to new animation
      this.currentAction.fadeOut(fadeTime);
      newAction.reset().fadeIn(fadeTime).play();
    } else if (!this.currentAction) {
      // Just play the animation
      newAction.play();
    }

    this.currentAction = newAction;
    console.log(`Playing animation: ${animationName}`);
  }

  stopAnimation() {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = undefined;
    }
  }

  getAvailableAnimations(): string[] {
    return Object.keys(this.actions);
  }

  getCurrentAnimation(): string | null {
    if (this.animationStateMachine) {
      return this.animationStateMachine.getCurrentAnimationName() || null;
    }

    if (this.currentAction) {
      const animationName = Object.keys(this.actions).find(
        key => this.actions[key] === this.currentAction
      );
      return animationName || null;
    }
    return null;
  }

  // Get animation state machine status for debugging
  getAnimationState() {
    if (this.animationStateMachine) {
      return {
        currentState: this.animationStateMachine.getCurrentState(),
        currentAnimation: this.animationStateMachine.getCurrentAnimationName(),
        stateTime: this.animationStateMachine.getStateTime(),
        isInIdleState: this.animationStateMachine.isInIdleState()
      };
    }
    return null;
  }

  // Load ReadyPlayerMe animations
  private async loadAnimations() {
    if (!this.mixer || !this.avatar) return;

    try {
      console.log("Loading ReadyPlayerMe animations...");

      // Get available animations from static methods
      const availableAnimations = ReadyPlayerMeAnimationLibrary.getAnimations();
      console.log("Available animations:", availableAnimations.map(a => a.name));

      // Load each available animation
      for (const animation of availableAnimations) {
        const animationName = animation.name;
        try {
          console.log(`Loading animation: ${animationName}`);
          const clip = await ReadyPlayerMeAnimationLibrary.loadAnimation(animationName);

          if (clip) {
            console.log(`Animation clip details:`, {
              name: clip.name,
              duration: clip.duration,
              tracks: clip.tracks.length,
              trackNames: clip.tracks.map(track => track.name)
            });

            const action = this.mixer!.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;
            this.actions[animationName] = action;
            console.log(`Successfully loaded animation: ${animationName}`);
          }
        } catch (error) {
          console.error(`Failed to load animation "${animationName}":`, error);
        }
      }

      console.log("ReadyPlayerMe animations loaded:", Object.keys(this.actions));

      // Initialize Animation State Machine with enhanced timing
      this.animationStateMachine = new AnimationStateMachine({
        initialVariationDuration: 20000, // 20 seconds for extended initial viewing
        baseIdleDuration: 15000, // 30 seconds of stable base idle between variations
        variationDurationMin: 4000, // 4-8 seconds for variation playback
        variationDurationMax: 8000,
        fadeTime: 0.8 // Smooth transitions between animations
      });

      // Register animations with state machine
      this.animationStateMachine.registerAnimations(this.actions);
      console.log("Animation State Machine initialized and started");

    } catch (error) {
      console.error("Failed to load ReadyPlayerMe animations:", error);
    }
  }

  // Load additional animations on demand
  async loadAnimation(animationName: string): Promise<boolean> {
    if (!this.mixer || !this.avatar) return false;

    // Check if animation is already loaded
    if (this.actions[animationName]) {
      console.log(`Animation "${animationName}" already loaded`);
      return true;
    }

    try {
      const clip = await ReadyPlayerMeAnimationLibrary.loadAnimation(animationName);
      if (clip) {
        console.log(`On-demand animation clip details:`, {
          name: clip.name,
          duration: clip.duration,
          tracks: clip.tracks.length
        });

        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        this.actions[animationName] = action;
        console.log(`Successfully loaded animation: ${animationName}`);
        return true;
      }
    } catch (error) {
      console.error(`Failed to load animation "${animationName}":`, error);
    }

    return false;
  }
}