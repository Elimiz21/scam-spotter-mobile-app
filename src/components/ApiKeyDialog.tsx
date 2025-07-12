import React, { useState } from 'react';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>
          Enhanced Analysis with OpenAI
        </h3>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '14px' }}>
          To enable advanced language pattern analysis, please provide your OpenAI API key. 
          This will significantly improve scam detection accuracy. The key is stored locally and never sent to our servers.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '14px'
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '4px',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};