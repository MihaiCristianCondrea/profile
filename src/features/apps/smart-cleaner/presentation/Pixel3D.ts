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

/** The model's display material: replaced by dark glass, since the live screen takes over once it faces front. */
const SCREEN_MATERIAL = 'GP9XL_Screen';
const FIELD_OF_VIEW = 18;
/** The model's meshes are Draco-compressed; three.js's decoder is copied here from node_modules. */
const DRACO_DECODER_PATH = './smart-cleaner-ui/draco/';

export interface Pixel3D {
  /** `turn` 0 shows the back, 1 the front; `tilt` leans it in radians. */
  pose(turn: number, tilt?: number): void;
  resize(width: number, height: number): void;
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
 * standing upright with the screen towards the camera at turn 1.
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
  scene.add(turntable);

  const camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 0.01, 10);
  const height = Math.max(size.x, size.z);
  camera.position.set(0, 0, (height * 0.5) / Math.tan((FIELD_OF_VIEW * Math.PI) / 360));

  const draw = (): void => renderer.render(scene, camera);

  return {
    pose(turn, tilt = 0) {
      turntable.rotation.y = Math.PI * (1 - easeTurn(turn));
      turntable.rotation.x = tilt;
      draw();
    },
    resize(width, heightPx) {
      if (width <= 0 || heightPx <= 0) return;
      renderer.setSize(width, heightPx, false);
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      draw();
    },
    dispose() {
      environment.dispose();
      pmrem.dispose();
      glass.dispose();
      renderer.dispose();
    },
  };
}
