import React from 'react';

const AppDebug = () => {
  React.useEffect(() => {
    console.log('%c🚀 App-Debug mounted', 'color: green; font-size: 16px');
    
    // Test Map and Set
    try {
      const testMap = new Map();
      testMap.set('test', 'value');
      console.log('✅ Map works:', testMap.get('test'));
    } catch (e) {
      console.error('❌ Map error:', e);
    }
    
    try {
      const testSet = new Set();
      testSet.add('test');
      console.log('✅ Set works:', testSet.has('test'));
    } catch (e) {
      console.error('❌ Set error:', e);
    }
    
    // Try to reproduce the error
    try {
      const obj: any = undefined;
      obj.add('test'); // This should throw
    } catch (e: any) {
      console.error('✅ Caught expected error:', e.message);
    }
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Mode</h1>
      <p>Check the console for debug output</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => {
          console.log('Testing Map/Set...');
          const m = new Map();
          m.set('click', 'test');
          const s = new Set();
          s.add('click');
          console.log('Map/Set work on click!');
        }}>
          Test Map/Set
        </button>
      </div>
    </div>
  );
};

export default AppDebug;