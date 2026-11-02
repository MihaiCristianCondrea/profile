'use strict';
// Drop-in replacement for deepmerge's default export and .all(), covering the API
// jest-config uses. Unlike upstream <=4.3.1 it never copies prototype-polluting keys
// and builds results from plain objects only. See docs/deployment.md "Dependency security".
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isMergeableObject(value) {
  if (!value || typeof value !== 'object') return false;
  const tag = Object.prototype.toString.call(value);
  return tag !== '[object RegExp]' && tag !== '[object Date]';
}

function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value)
    ? deepmerge(Array.isArray(value) ? [] : {}, value, options)
    : value;
}

function defaultArrayMerge(target, source, options) {
  return target.concat(source).map((item) => cloneUnlessOtherwiseSpecified(item, options));
}

function ownKeys(object) {
  const symbols = Object.getOwnPropertySymbols(object)
    .filter((symbol) => Object.prototype.propertyIsEnumerable.call(object, symbol));
  return Object.keys(object).concat(symbols).filter((key) => !UNSAFE_KEYS.has(key));
}

function mergeObject(target, source, options) {
  const destination = {};
  if (options.isMergeableObject(target)) {
    ownKeys(target).forEach((key) => {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }
  ownKeys(source).forEach((key) => {
    const hasTarget = Object.prototype.hasOwnProperty.call(target, key);
    if (hasTarget && options.isMergeableObject(source[key])) {
      const merge = options.customMerge ? options.customMerge(key) || deepmerge : deepmerge;
      destination[key] = merge(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}

function deepmerge(target, source, options) {
  const resolved = Object.assign({}, options);
  resolved.arrayMerge = resolved.arrayMerge || defaultArrayMerge;
  resolved.isMergeableObject = resolved.isMergeableObject || isMergeableObject;
  resolved.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
  const sourceIsArray = Array.isArray(source);
  if (sourceIsArray !== Array.isArray(target)) return cloneUnlessOtherwiseSpecified(source, resolved);
  return sourceIsArray
    ? resolved.arrayMerge(target, source, resolved)
    : mergeObject(target, source, resolved);
}

deepmerge.all = function all(array, options) {
  if (!Array.isArray(array)) throw new Error('first argument should be an array');
  return array.reduce((prev, next) => deepmerge(prev, next, options), {});
};

module.exports = deepmerge;
module.exports.default = deepmerge;
