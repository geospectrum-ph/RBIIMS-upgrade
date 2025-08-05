// services/LoadingIndicator.js
import React from 'react';
import './LoadingIndicator.css';

export default function LoadingIndicator() {
  return (
    <div className="loading-indicator">
      <div className="spinner_layer"></div>
      <div className="loading-text">Loading layer..</div>
    </div>
  );
}