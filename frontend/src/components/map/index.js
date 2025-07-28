import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaplibreLegendControl } from "@watergis/maplibre-gl-legend";
import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
import './index.css';
import { MapContext } from '../../context/MapContext';
import { LayoutContext } from '../../context/LayoutContext';


export default function Map({visibleLayers}) {
  const [riverBasin, setRiverBasin] = React.useState([]);
  const [roadNetworks, setRoadNetworks] = React.useState([]);
  const [forestCover, setForestCover] = React.useState([])

  const {VECTOR_LAYERS, MAP_STYLE} = React.useContext(MapContext)
  const {page} = React.useContext(LayoutContext)


  const mapContainer = useRef(null);
  const map = useRef(null);
  const lng = 120.982200;
  const lat = 14.60420000;
  const zoom = 6;
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

  async function getRiverBasinData() {
    const url = "http://localhost:1433/layer/getRiverBasin";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json().then((res) => {
        if (res.length > 0 ) {
        // console.log(res);
        setRiverBasin(res)
      }
      });
      
      
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getForestCoverLossData() {
    const url = "http://localhost:1433/layer/getPointsHeat";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json().then((res) => {
        if (res.length > 0 ) {
        console.log(res);
        setForestCover(res)
      }
      });
      
      
    } catch (error) {
      console.error(error.message);
    }
  }

  function formatProperties(props) {
  if (!props) return "No properties";

  return Object.entries(props)
    .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
    .join("<br/>");
}




  useEffect(() => {
    if(riverBasin.length > 0 && forestCover.length > 0 && page === "analytics") {

      map.current.addSource('forestcoverloss', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': forestCover
        }
      });

       map.current.addLayer({
        'id': 'forestcover', //change
        'type': 'heatmap',
        'source': 'forestcoverloss', //change
        'maxzoom': 16,
        'paint': {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                0,
                0,
                6,
                1
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                0,
                9,
                1,
                11,
                3
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparency color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(253,219,199)',
                0.8,
                'rgb(239,138,98)',
                1,
                'rgb(178,24,43)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                2,
                9,
                20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                11,
                0
            ]
        }
      });

      map.current.addLayer({
        'id': 'forestcover-point',
        'type': 'circle',
        'source': 'forestcoverloss',
        'minzoom': 10,
        'paint': {
          // Size circle radius by earthquake magnitude and zoom level
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7,
            ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4],
            16,
            ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]
          ],
          // Color circle by earthquake magnitude
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            1,
            'rgba(33,102,172,0)',
            2,
            'rgb(103,169,207)',
            3,
            'rgb(209,229,240)',
            4,
            'rgb(253,219,199)',
            5,
            'rgb(239,138,98)',
            6,
            'rgb(178,24,43)'
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          // Transition from heatmap to circle layer by zoom level
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7,
            0,
            8,
            1
          ]
        }
      });
    }

  }, [forestCover, page])

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: zoom,
    });

    getForestCoverLossData()
    getRiverBasinData()

    map.current.on("load", () => {
      VECTOR_LAYERS.forEach((layerConfig) => {
        if (!layerConfig.existsInStyle && map.current.getSource(layerConfig.source)) {
          map.current.addLayer({
            id: layerConfig.mapLayerId,
            type: layerConfig.type,
            source: layerConfig.source,
            layout: {
              visibility: "none",
            },
            paint: layerConfig.paint,
          });
        }

        // Add click event to display popup if layer type is fill or line
        if (layerConfig.type === "fill" || layerConfig.type === "line") {
          map.current.on("click", layerConfig.mapLayerId, (e) => {
            const feature = e.features[0];
            const props = feature?.properties;
            const coords = e.lngLat;

            new maplibregl.Popup()
              .setLngLat(coords)
              .setHTML(`<strong>${layerConfig.id}</strong><br/>${formatProperties(props)}`)
              .addTo(map.current);
          });

          map.current.on("mouseenter", layerConfig.mapLayerId, () => {
            map.current.getCanvas().style.cursor = "pointer";
          });

          map.current.on("mouseleave", layerConfig.mapLayerId, () => {
            map.current.getCanvas().style.cursor = "";
          });
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lng, lat, zoom]);

  useEffect(() => {
    if (!map.current) return;

    VECTOR_LAYERS.forEach(({ id, mapLayerId }) => {
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(mapLayerId, "visibility", visibleLayers[id] ? "visible" : "none");
      }
    });
  }, [visibleLayers]);
  

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}