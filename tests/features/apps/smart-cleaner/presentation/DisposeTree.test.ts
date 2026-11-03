import { disposeTree, type Disposable, type DisposableNode } from '../../../../../src/features/apps/smart-cleaner/presentation/DisposeTree';

const resource = (): Disposable & { dispose: jest.Mock } => ({ dispose: jest.fn() });

function tree(nodes: Array<Omit<DisposableNode, 'traverse'>>): DisposableNode {
  const all = nodes.map((node) => ({ ...node, traverse: () => undefined }));
  return { traverse: (visit) => all.forEach(visit) };
}

describe('disposeTree', () => {
  test('releases every geometry, material and texture of a loaded model', () => {
    const geometry = resource();
    const map = resource();
    const normalMap = resource();
    const material = { ...resource(), name: 'GP9XL_Frame', map, normalMap, color: { r: 0 } };
    const glass = resource();

    disposeTree(tree([{ geometry, material: [material, glass] }]));

    [geometry, map, normalMap, material, glass].forEach((item) => expect(item.dispose).toHaveBeenCalledTimes(1));
  });

  test('releases a resource shared by several meshes once', () => {
    const geometry = resource();
    const texture = resource();
    const material = { ...resource(), map: texture };

    const released = disposeTree(tree([{ geometry, material }, { geometry, material }]));

    expect(released).toBe(3);
    [geometry, texture, material].forEach((item) => expect(item.dispose).toHaveBeenCalledTimes(1));
  });

  test('skips nodes without geometry or material', () => {
    expect(disposeTree(tree([{}]))).toBe(0);
  });
});
