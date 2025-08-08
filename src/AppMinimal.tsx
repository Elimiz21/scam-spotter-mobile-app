import React from 'react';

const AppMinimal = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>ScamShield App - Minimal Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
};

export default AppMinimal;