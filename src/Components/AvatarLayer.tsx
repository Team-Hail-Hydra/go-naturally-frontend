import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import mapboxgl from "mapbox-gl";

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

  constructor(options: AvatarLayerOptions) {
    this.id = options.id;
    this.options = options;
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

    // Add lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 100, 100).normalize();
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

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
        // Get the mercator coordinate for the position
        const modelAsMercatorCoordinate =
          mapboxgl.MercatorCoordinate.fromLngLat(this.options.position, 0);

        // Calculate scale based on meters per mercator coordinate unit
        const meterInMercatorCoordinateUnits =
          modelAsMercatorCoordinate.meterInMercatorCoordinateUnits();
        const modelScale =
          meterInMercatorCoordinateUnits * (this.options.scale || 2);

        // Position and scale the avatar
        this.avatar.position.set(
          modelAsMercatorCoordinate.x,
          modelAsMercatorCoordinate.y,
          modelAsMercatorCoordinate.z || 0
        );

        this.avatar.scale.set(modelScale, -modelScale, modelScale);

        // Rotate to stand upright (Ready Player Me models need 90-degree rotation)
        this.avatar.rotation.x = Math.PI / 2;

        this.scene.add(this.avatar);

        console.log("Avatar loaded and positioned:", {
          position: this.avatar.position,
          scale: this.avatar.scale,
          rotation: this.avatar.rotation,
          mercatorCoordinate: modelAsMercatorCoordinate,
          meterInMercatorCoordinateUnits,
          finalScale: modelScale,
        });
      }

      // Trigger a repaint
      this.map?.triggerRepaint();
    } catch (error) {
      console.error("Error loading avatar:", error);
    }
  }

  render(gl: WebGLRenderingContext, matrix: number[]) {
    if (!this.camera || !this.scene || !this.renderer) return;

    // Create the projection matrix from the Mapbox matrix
    const m = new THREE.Matrix4().fromArray(matrix);

    // Apply transformations to align with Mapbox coordinate system
    const transformMatrix = new THREE.Matrix4()
      .makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
      .multiply(
        new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          Math.PI
        )
      )
      .multiply(m);

    this.camera.projectionMatrix = transformMatrix;
    this.camera.matrixWorldInverse = new THREE.Matrix4();

    // Save WebGL state
    const { program } = gl.getParameter(gl.CURRENT_PROGRAM) || {};

    // Render the scene
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);

    // Restore WebGL state
    if (program) {
      gl.useProgram(program);
    }

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
        0
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
}
