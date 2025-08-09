// Debug file to intercept and trace the undefined.add() error

// Override Set.prototype.add to catch errors
const originalSetAdd = Set.prototype.add;
Set.prototype.add = function(value: any) {
  console.log('Set.add called with:', value, 'on', this);
  console.trace('Stack trace for Set.add:');
  
  if (!this || typeof this.add !== 'function') {
    console.error('ERROR: Set.add called on invalid object:', this);
    throw new Error('Set.add called on non-Set object');
  }
  
  return originalSetAdd.call(this, value);
};

// Override Map.prototype.set to catch errors
const originalMapSet = Map.prototype.set;
Map.prototype.set = function(key: any, value: any) {
  console.log('Map.set called with:', key, value, 'on', this);
  
  if (!this || typeof this.set !== 'function') {
    console.error('ERROR: Map.set called on invalid object:', this);
    throw new Error('Map.set called on non-Map object');
  }
  
  return originalMapSet.call(this, key, value);
};

// Catch any undefined property access
const handler = {
  get(target: any, prop: string) {
    if (prop === 'add' && target === undefined) {
      console.error('CAUGHT: Trying to access .add on undefined!');
      console.trace('Stack trace:');
      throw new Error('Attempting to call .add on undefined');
    }
    return target[prop];
  }
};

// Log when this debug file loads
console.log('%c🔍 Debug error interceptor loaded', 'color: red; font-weight: bold');

// Export to ensure module loads
export const debugLoaded = true;