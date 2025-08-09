// Debug wrapper to catch the exact error
const originalAdd = Set.prototype.add;
const originalClassListAdd = typeof DOMTokenList !== 'undefined' ? DOMTokenList.prototype.add : null;

// Override Set.prototype.add to catch undefined errors
Set.prototype.add = function(...args) {
  if (!this) {
    console.error('ERROR: Set.add called on undefined or null!');
    console.trace();
    throw new Error('Set.add called on undefined or null');
  }
  return originalAdd.apply(this, args);
};

// Override classList.add to catch undefined errors
if (originalClassListAdd) {
  DOMTokenList.prototype.add = function(...args) {
    if (!this) {
      console.error('ERROR: classList.add called on undefined or null!');
      console.trace();
      throw new Error('classList.add called on undefined or null');
    }
    return originalClassListAdd.apply(this, args);
  };
}

// Log when this debug wrapper loads
console.log('Debug wrapper loaded - monitoring for undefined.add() calls');

export {};