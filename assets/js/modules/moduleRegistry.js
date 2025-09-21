/*
 * Simple module registry to share reusable functionality across the site
 * while keeping CommonJS compatibility for automated tests.
 */
(function createModuleRegistry(globalScope) {
  const modules = new Map();

  function normalizeName(name) {
    return typeof name === 'string' ? name.trim() : '';
  }

  function register(name, exportsValue, options = {}) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) {
      throw new Error('ModuleRegistry.register requires a non-empty module name.');
    }
    modules.set(normalizedName, exportsValue);

    const aliasOption = Array.isArray(options.alias)
      ? options.alias
      : options.alias
        ? [options.alias]
        : [];

    aliasOption.forEach((alias) => {
      const normalizedAlias = normalizeName(alias);
      if (!normalizedAlias) {
        return;
      }
      try {
        globalScope[normalizedAlias] = exportsValue;
      } catch (error) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(`ModuleRegistry: Unable to expose alias "${normalizedAlias}".`, error);
        }
      }
    });

    return exportsValue;
  }

  function requireModule(name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName || !modules.has(normalizedName)) {
      throw new Error(`ModuleRegistry: Module "${normalizedName}" is not registered.`);
    }
    return modules.get(normalizedName);
  }

  function has(name) {
    const normalizedName = normalizeName(name);
    return normalizedName ? modules.has(normalizedName) : false;
  }

  function list() {
    return Array.from(modules.keys());
  }

  function reset() {
    modules.clear();
  }

  const registryApi = {
    register,
    require: requireModule,
    has,
    list,
    reset
  };

  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = registryApi;
  }

  if (globalScope && typeof globalScope === 'object') {
    globalScope.ModuleRegistry = registryApi;
  }
})(typeof window !== 'undefined' ? window : globalThis);
