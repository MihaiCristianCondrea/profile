import {
  ACESFilmicToneMapping,
  Box3,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

/** The model's display material: dark glass under the live screen, which shows through it. */
const SCREEN_MATERIAL = 'GP9XL_Screen';
const FIELD_OF_VIEW = 18;
/** The model's meshes are Draco-compressed; three.js's decoder is copied here from node_modules. */
const DRACO_DECODER_PATH = './smart-cleaner-ui/draco/';
/** The UI kit's phone window in CSS pixels (Material Next `phone`). */
export const SCREEN_WIDTH = 430;
export const SCREEN_HEIGHT = 957;
/**
 * The model is in metres; CSS3DRenderer maps world units to CSS pixels, so the
 * scene works in millimetres to keep its matrices well conditioned.
 */
const UNITS_PER_METRE = 1000;
/**
 * The glass mesh spans the whole front; the lit display sits inside the
 * bezel, with rounded corners. Millimetres, from the Pixel 9 Pro XL.
 */
const BEZEL_MM = 2.4;
const DISPLAY_CORNER_MM = 8;
const FRONT_CAMERA_TOP_MM = 4.6;
const FRONT_CAMERA_MM = 3.4;

export interface Pixel3D {
  /**
   * `turn` 0 shows the back, 1 the front; `tilt` leans it in radians; `side`
   * (1 or -1) picks which way it turns in.
   */
  pose(turn: number, tilt?: number, side?: number): void;
  resize(width: number, height: number): void;
  /**
   * Places `screen` (a live, interactive element of SCREEN_WIDTH by
   * SCREEN_HEIGHT pixels) on the phone's display. It turns with the phone and
   * hides when the display faces away.
   */
  attachScreen(screen: HTMLElement): void;
  dispose(): void;
}

/** Smoothstep, so the turn starts and lands softly. */
export function easeTurn(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function materialsOf(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

/**
 * Renders the phone into `canvas` on demand (only when pose or size change),
 * standing upright with the screen towards the camera at turn 1. A CSS3D layer
 * over the canvas, drawn with the same camera, carries the live screen.
 */
export async function createPixel3D(canvas: HTMLCanvasElement, model: ArrayBuffer): Promise<Pixel3D> {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const draco = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
  const gltf = await new GLTFLoader().setDRACOLoader(draco).parseAsync(model, '');
  draco.dispose();
  const phone = gltf.scene;
  const glass = new MeshPhysicalMaterial({ color: 0x07090d, roughness: 0.08, metalness: 0, clearcoat: 1 });
  let screenY = 0;
  phone.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    if (Array.isArray(node.material)) {
      node.material = node.material.map((material) => (material.name === SCREEN_MATERIAL ? glass : material));
    } else if (node.material.name === SCREEN_MATERIAL) {
      node.material = glass;
    }
    // Which side of the slab the display sits on, from the screen's own vertices.
    if (materialsOf(node).includes(glass)) {
      const box = new Box3().setFromObject(node);
      screenY = box.getCenter(new Vector3()).y;
    }
  });

  // Centre the model, then stand it up with the display facing +z.
  const bounds = new Box3().setFromObject(phone);
  const centre = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  phone.position.sub(centre);
  const upright = new Group();
  upright.add(phone);
  upright.rotation.x = screenY >= centre.y ? Math.PI / 2 : -Math.PI / 2;
  // Standing it up leaves the camera end at the bottom; turn it the right way up.
  const rightWayUp = new Group();
  rightWayUp.add(upright);
  rightWayUp.rotation.z = Math.PI;
  const turntable = new Group();
  turntable.add(rightWayUp);
  turntable.scale.setScalar(UNITS_PER_METRE);
  scene.add(turntable);

  // Where the display is, in turntable space, measured while it is at rest.
  scene.updateMatrixWorld(true);
  const display = new Box3();
  phone.traverse((node) => {
    if (node instanceof Mesh && materialsOf(node).includes(glass)) display.expandByObject(node);
  });
  const displayCentre = display.getCenter(new Vector3()).divideScalar(UNITS_PER_METRE);
  const displaySize = display.getSize(new Vector3()).divideScalar(UNITS_PER_METRE);

  const camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 1, 10000);
  const height = Math.max(size.x, size.z) * UNITS_PER_METRE;
  camera.position.set(0, 0, (height * 0.5) / Math.tan((FIELD_OF_VIEW * Math.PI) / 360));

  const cssScene = new Scene();
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.classList.add('cleaner-pixel-screen-layer');
  canvas.after(cssRenderer.domElement);
  // The CSS layer mirrors the turntable: CSS3D objects need a scene of their own.
  const cssTurntable = new Group();
  cssScene.add(cssTurntable);
  let screenObject: CSS3DObject | undefined;

  const draw = (): void => {
    cssTurntable.rotation.copy(turntable.rotation);
    renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
  };

  return {
    pose(turn, tilt = 0, side = 1) {
      turntable.rotation.y = side * Math.PI * (1 - easeTurn(turn));
      turntable.rotation.x = tilt;
      draw();
    },
    attachScreen(screen) {
      if (screenObject) cssTurntable.remove(screenObject);
      screen.style.backfaceVisibility = 'hidden';
      screenObject = new CSS3DObject(screen);
      // Just above the glass, so the model never cuts through the screen.
      const widthMm = displaySize.x * UNITS_PER_METRE - 2 * BEZEL_MM;
      const heightMm = displaySize.y * UNITS_PER_METRE - 2 * BEZEL_MM;
      const pxPerMm = SCREEN_WIDTH / widthMm;
      screen.style.borderRadius = `${DISPLAY_CORNER_MM * pxPerMm}px`;
      screen.style.setProperty('--camera-top', `${FRONT_CAMERA_TOP_MM * pxPerMm}px`);
      screen.style.setProperty('--camera-size', `${FRONT_CAMERA_MM * pxPerMm}px`);
      // Centred on the glass, just above it, so the model never cuts through the screen.
      screenObject.position.set(
        displayCentre.x * UNITS_PER_METRE,
        displayCentre.y * UNITS_PER_METRE,
        display.max.z + 0.05,
      );
      screenObject.scale.set(widthMm / SCREEN_WIDTH, heightMm / SCREEN_HEIGHT, 1);
      cssTurntable.add(screenObject);
      draw();
    },
    resize(width, heightPx) {
      if (width <= 0 || heightPx <= 0) return;
      renderer.setSize(width, heightPx, false);
      cssRenderer.setSize(width, heightPx);
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      draw();
    },
    dispose() {
      environment.dispose();
      pmrem.dispose();
      glass.dispose();
      renderer.dispose();
      cssRenderer.domElement.remove();
    },
  };
}
