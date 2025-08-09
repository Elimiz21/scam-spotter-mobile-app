// Trace the exact source of undefined.add() error

// Store original methods
const originalSetAdd = Set.prototype.add;
const originalMapSet = Map.prototype.set;

// Track all Set creations
const SetConstructor = window.Set;
window.Set = class TrackedSet extends SetConstructor {
  constructor(...args: any[]) {
    super(...args);
    console.log('%c🔍 New Set created', 'color: blue', {
      stack: new Error().stack
    });
  }
  
  add(value: any) {
    if (!this || typeof super.add !== 'function') {
      console.error('%c❌ Set.add called on invalid object!', 'color: red; font-size: 16px', {
        this: this,
        stack: new Error().stack
      });
      throw new Error('Set.add called on invalid object');
    }
    return super.add(value);
  }
} as any;

// Track all Map creations
const MapConstructor = window.Map;
window.Map = class TrackedMap extends MapConstructor {
  constructor(...args: any[]) {
    super(...args);
    console.log('%c🔍 New Map created', 'color: green', {
      stack: new Error().stack
    });
  }
  
  set(key: any, value: any) {
    if (!this || typeof super.set !== 'function') {
      console.error('%c❌ Map.set called on invalid object!', 'color: red; font-size: 16px', {
        this: this,
        stack: new Error().stack
      });
      throw new Error('Map.set called on invalid object');
    }
    return super.set(key, value);
  }
} as any;

// Intercept property access to catch undefined.add
const handler: ProxyHandler<any> = {
  get(target, prop, receiver) {
    if (prop === 'add' && (target === undefined || target === null)) {
      console.error('%c🎯 FOUND IT! Trying to access .add on undefined/null', 'color: red; font-size: 20px');
      console.trace('Stack trace for undefined.add:');
      throw new Error('Attempting to access .add on undefined/null');
    }
    return Reflect.get(target, prop, receiver);
  }
};

// Try to proxy undefined (won't work but worth trying)
try {
  Object.defineProperty(window, 'undefined', {
    get() {
      return new Proxy({}, handler);
    }
  });
} catch (e) {
  // Expected to fail
}

console.log('%c🔍 Trace error loaded - tracking all Set/Map operations', 'color: purple; font-size: 14px; font-weight: bold');

export {};