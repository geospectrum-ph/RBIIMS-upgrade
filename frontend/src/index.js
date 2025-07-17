import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Map from './components/map';
import App from './layout/index'
import MapContextProvider from './context/MapContext';
import LayoutContextProvider from './context/LayoutContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LayoutContextProvider>
      <MapContextProvider>
        <App />
      </MapContextProvider>
    </LayoutContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
