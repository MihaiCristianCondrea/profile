import { createPixel3D } from '../../../../../src/features/apps/smart-cleaner/presentation/Pixel3D';

const mockRender = jest.fn();
const mockCssRender = jest.fn();
const mockSetSize = jest.fn();
const mockDispose = jest.fn();
const mockParse = jest.fn();

jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn(() => {
    let ratio = 1;
    return {
      setPixelRatio: (value: number) => { ratio = value; },
      getPixelRatio: () => ratio,
      setSize: mockSetSize,
      render: mockRender,
      dispose: mockDispose,
    };
  }),
  PMREMGenerator: jest.fn(() => ({
    fromScene: () => ({ texture: { dispose: jest.fn() } }),
    dispose: jest.fn(),
  })),
}));
jest.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
  DRACOLoader: class {
    setDecoderPath() { return this; }
    dispose() { /* no decoder workers in jsdom */ }
  },
}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    setDRACOLoader() { return this; }
    parseAsync() { return mockParse(); }
  },
}));
jest.mock('three/examples/jsm/environments/RoomEnvironment.js', () => ({ RoomEnvironment: class {} }));
jest.mock('three/examples/jsm/renderers/CSS3DRenderer.js', () => {
  const { Object3D } = jest.requireActual('three');
  return {
    CSS3DObject: class extends Object3D {},
    CSS3DRenderer: class {
      domElement = document.createElement('div');
      setSize = jest.fn();
      render = mockCssRender;
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  const { Group, Mesh, BoxGeometry, MeshPhysicalMaterial } = jest.requireActual('three');
  const scene = new Group();
  scene.add(new Mesh(new BoxGeometry(0.08, 0.01, 0.16), new MeshPhysicalMaterial({ name: 'GP9XL_Screen' })));
  mockParse.mockResolvedValue({ scene });
});

test('defers offscreen draws, renders the latest pose on entry, and skips settled redraws', async () => {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  const pixel = await createPixel3D(canvas, new ArrayBuffer(0));
  pixel.resize(300, 600);
  pixel.attachScreen(document.createElement('div'));
  pixel.pose(0.2);
  pixel.pose(0.7);
  expect(mockRender).not.toHaveBeenCalled();
  pixel.setVisible(true);
  expect(mockRender).toHaveBeenCalledTimes(1);
  expect(mockCssRender).toHaveBeenCalledTimes(1);
  pixel.pose(0.7);
  pixel.resize(300, 600);
  pixel.setVisible(true);
  expect(mockRender).toHaveBeenCalledTimes(1);
  pixel.setVisible(false);
  pixel.pose(1);
  pixel.resize(320, 640);
  expect(mockRender).toHaveBeenCalledTimes(1);
  pixel.setVisible(true);
  expect(mockRender).toHaveBeenCalledTimes(2);
  expect(mockCssRender).toHaveBeenCalledTimes(2);
  expect(mockSetSize).toHaveBeenCalledTimes(2);
  pixel.dispose();
  expect(document.querySelector('.cleaner-pixel-screen-layer')).toBeNull();
  canvas.remove();
});

test('releases the renderer when model decoding fails before a Pixel can be returned', async () => {
  mockParse.mockRejectedValueOnce(new Error('decoder failed'));
  await expect(createPixel3D(document.createElement('canvas'), new ArrayBuffer(0))).rejects.toThrow('decoder failed');
  expect(mockDispose).toHaveBeenCalledTimes(1);
});
