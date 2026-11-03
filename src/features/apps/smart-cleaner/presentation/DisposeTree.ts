/**
 * Releases the GPU resources of a loaded model: every geometry, material and
 * texture under `root`, once each, however many meshes share them.
 *
 * Typed structurally rather than against three.js, so the lifecycle can be
 * tested without WebGL or loading three.js's ES modules.
 */
export interface Disposable {
  dispose(): void;
}

export interface DisposableNode {
  geometry?: Disposable;
  material?: Disposable | Disposable[];
  traverse(visit: (node: DisposableNode) => void): void;
}

function isDisposable(value: unknown): value is Disposable {
  return typeof value === 'object' && value !== null && typeof (value as Disposable).dispose === 'function';
}

/** Textures are the disposable values a material holds (map, normalMap, roughnessMap, ...). */
function texturesOf(material: Disposable): Disposable[] {
  return Object.values(material).filter((value): value is Disposable => isDisposable(value) && value !== material);
}

export function disposeTree(root: DisposableNode): number {
  const released = new Set<Disposable>();
  const release = (resource: Disposable | undefined): void => {
    if (!resource || released.has(resource)) return;
    released.add(resource);
    resource.dispose();
  };
  root.traverse((node) => {
    release(node.geometry);
    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    materials.forEach((material) => {
      texturesOf(material).forEach(release);
      release(material);
    });
  });
  return released.size;
}
