import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const lng = 120.982200;
  const lat = 14.60420000;
  const zoom = 12;
  // const API_KEY = 'YOUR_MAPTILER_API_KEY_HERE';

  const style = {
    "version": 8,
    "sources": {
      "osm": {
        "type": "raster",
        "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        "tileSize": 256,
        "attribution": "&copy; OpenStreetMap Contributors",
        "maxzoom": 19
      }
    },
    "layers": [
      {
        "id": "osm",
        "type": "raster",
        "source": "osm" // This must match the source key above
      }
    ]
  };

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once
  
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style,
      center: [lng, lat],
      zoom: zoom
    });
  
  }, [lng, lat, zoom]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}