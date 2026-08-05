import { deserialize, serialize } from 'node:v8';

/**
 * jsdom does not implement `structuredClone`, which every supported browser has
 * shipped since 2022. The shim lives here so production code keeps using the
 * platform API instead of carrying a compatibility layer.
 */
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => deserialize(serialize(value)) as T;
}
