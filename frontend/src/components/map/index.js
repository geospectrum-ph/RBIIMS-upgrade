import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaplibreLegendControl } from "@watergis/maplibre-gl-legend";
import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
import './index.css';

// import DEMLayer from '../../assets/SRTM_30meters_DEM_Philippines_clipped.tif'

// import regions from '../../assets/regions.json'


export default function Map() {
  const [riverBasin, setRiverBasin] = React.useState([]);
  const [barangays, setBarangays] = React.useState([]);
  const [roadNetworks, setRoadNetworks] = React.useState([]);
  const [forestCover, setForestCover] = React.useState([])


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
    const url = "http://localhost:4000/layer/getRiverBasin";
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
    const url = "http://localhost:4000/layer/getPointsHeat";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json().then((res) => {
        if (res.length > 0 ) {
        // console.log(res);
        setForestCover(res)
      }
      });
      
      
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getRoadNetworksData() {
    const url = "http://localhost:4000/layer/getRoadNetworks";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json().then((res) => {
        if (res.length > 0 ) {
        // console.log(res);
        setRoadNetworks(res)
      }
      });
      
      
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getBarangayData() {
    const url = "http://localhost:4000/layer/getBarangays";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const json = await response.json();
      
      if (json.length > 0 ) {
        console.log(json);
        setBarangays(json)
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once
  
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style,
      center: [lng, lat],
      zoom: zoom
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    getRiverBasinData();
    getForestCoverLossData()
    // getRoadNetworksData();
    // getBarangayData()
  

  
  }, [lng, lat, zoom]);

  useEffect(() => {
    if(riverBasin.length > 0 && forestCover.length > 0) {
      // map.current.on('load', () => { 

      map.current.addSource('raster-dem', {
        'type': "raster",
        'tiles': [
          'http://192.168.68.144:8080/geoserver/GMS/wms?service=WMS&version=1.1.1&request=GetMap&layers=GMS:SRTM_30meters_DEM_Philippines_clipped&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png'
        ],
        // 'tileSize': 256
      })

      map.current.addLayer({
        'id': 'raster-wms-dem',
        'type': 'raster',
        'source': 'raster-dem',
        'paint': {}
      })


      map.current.addSource('river-basin', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': riverBasin
        }
      });

      map.current.addLayer({
        'id': 'riverbasin',
        'type': 'line',
        'source': 'river-basin',
        'layout': {},
        'paint': {
          // 'fill-color': '#088',
          // 'fill-opacity': 0.8,
          'line-width': 2,
          'line-color': '#000'
        }
      });

      map.current.addSource('forestcoverloss', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': forestCover
        }
      });

       map.current.addLayer({
        'id': 'forestcover',
        'type': 'heatmap',
        'source': 'forestcoverloss',
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


      


      const targets = {
        'riverbasin': 'River Basins',
        'forestcover': 'Forest Cover Loss Heat Map (2022)',
        'forestcover-points': 'Forest Cover Loss (2022)',
        'raster-wms-dem': "SRTM DEM"
        // 'regions': 'Regions'
        // 'road-networks': 'Road Networks'
      }
      map.current.addControl(new MaplibreLegendControl(targets, {showDefault: false}), 'bottom-right');

    //   map.current.on('click', 'riverbasin', (e) => {
    //     const coordinates = e.features[0].geometry.coordinates;
    //     const name = e.features[0].properties.name;

    //     // Ensure that if the map is zoomed out such that multiple
    //     // copies of the feature are visible, the popup appears
    //     // over the copy being pointed to.
    //     // while (Math.abs(e.lngLat.lng - coordinates[0][0]) > 180) {
    //     //   coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    //     // }

    //     new maplibregl.Popup()
    //       .setLngLat(coordinates[0][0])
    //       .setHTML(name)
    //       .addTo(map);
    //     });

    //     // Change the cursor to a pointer when the mouse is over the places layer.
    //     map.current.on('mouseenter', 'places', () => {
    //       map.getCanvas().style.cursor = 'pointer';
    //     });

    //     // Change it back to a pointer when it leaves.
    //     map.current.on('mouseleave', 'places', () => {
    //       map.getCanvas().style.cursor = '';
    //     });
    }

  }, [riverBasin, forestCover])

  useEffect(() => {
    if(roadNetworks.length > 0) {
      // map.current.on('load', () => { 
      map.current.addSource('road-network', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': roadNetworks
        }
      });

      map.current.addLayer({
        'id': 'road-networks',
        'type': 'line',
        'source': 'road-network',
        'layout': {},
        'paint': {
          'fill-color': '#00f8',
          'fill-opacity': 0.6,
          'line-width': 2,
          'line-color': '#000'
        }
      });

      const targets = {
        'riverbasin': 'River Basins',
        'regions': 'Regions',
        'road-networks': 'Road Networks'
      }
      map.current.addControl(new MaplibreLegendControl(targets, {showDefault: true}), 'bottom-right');
    }

    
  }, [roadNetworks])
  

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}