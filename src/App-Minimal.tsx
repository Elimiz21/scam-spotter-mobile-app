import React from 'react';

console.log('App-Minimal loading...');

// Test Map/Set at module level
try {
  const testMap = new Map();
  testMap.set('module-level', 'test');
  console.log('✅ Module-level Map works');
} catch (e) {
  console.error('❌ Module-level Map failed:', e);
}

const AppMinimal = () => {
  console.log('App-Minimal rendering...');
  
  return (
    <div style={{ padding: '50px', fontFamily: 'monospace' }}>
      <h1>Minimal App - Testing</h1>
      <p>If you see this, the app loaded!</p>
      <p>Check console for debug info.</p>
    </div>
  );
};

export default AppMinimal;