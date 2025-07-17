import * as React from "react";

export const MapContext = React.createContext();

function MapContextProvider (props) {
  const url_dem = 'http://192.168.68.144:8080/geoserver/GMS/wms?service=WMS&version=1.1.1&request=GetMap&layers=GMS:SRTM_30meters_DEM_Philippines_clipped&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true&transparent=true'

  const [forestCover, setForestCover] = React.useState([])
  
  async function getForestCoverLossData() {
    const url = "http://localhost:1433/layer/getPointsHeat";
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
  const ANA_GROUPS = [
    {
      title: "Analytics",
      layers: [
        // Forest Loss
        { id: "forest-loss-2001", label: "Forest Loss 2001" },
        { id: "forest-loss-2007", label: "Forest Loss 2007" },
        { id: "forest-loss-2010", label: "Forest Loss 2010" },
        { id: "forest-loss-2015", label: "Forest Loss 2015" },
        { id: "forest-loss-2018", label: "Forest Loss 2018" },
        { id: "forest-loss-2022", label: "Forest Loss 2022" },
      ],
      subGroups: [
        {
        title: "Forest Loss",
        layers: ["forest-loss-2001", "forest-loss-2007", "forest-loss-2010", "forest-loss-2015", "forest-loss-2018", "forest-loss-2022"],
      },
      ]
    }
  ]
  const LAYER_GROUPS = [
  {
    title: "Vector Layers",
    layers: [
      { id: "boundary-regional", label: "Regional Boundaries" },
      { id: "boundary-provincial", label: "Provincial Boundaries" },
      { id: "national-roads", label: "National Roads" },
      { id: "soil-type", label: "Soil Type" },
      { id: "geol-phils", label: "Geology of the Philippines" },
      { id: "nipa", label: "National Integrated Protected Areas System (NIPAS)" },
      { id: "kba", label: "Key Biodiversity Areas" },
      // Major River Basins
      { id: "abra-river", label: "Abra River Basin" },
      { id: "agno-river", label: "Agno River Basin" },
      { id: "agusan-river", label: "Agusan River Basin" },
      { id: "apayao-abulug-river", label: "Apayao-Abulug River Basin" },
      { id: "bicol-river", label: "Bicol River Basin" },
      { id: "buayan-malungan-river", label: "Buayan-Malungon River Basin" },
      { id: "cagayan-de-oro-river", label: "Cagayan De Oro River Basin" },
      { id: "cagayan-river", label: "Cagayan River Basin" },
      { id: "davao-river", label: "Davao River Basin" },
      { id: "ilog-hilabangan-river", label: "Ilog-Hilabangan River Basin" },
      { id: "jalaur-river", label: "Jalaur River Basin" },
      { id: "mindanao-river", label: "Mindanao River Basin" },
      { id: "pampanga-river", label: "Pampanga River Basin" },
      { id: "panay-river", label: "Panay River Basin" },
      { id: "pasig-laguna-de-bay-river", label: "Pasig-Laguna de Bay River Basin" },
      { id: "ranao-agus-river", label: "Ranao-Agus River Basin" },
      { id: "tagoloan-river", label: "Tagoloan River Basin" },
      { id: "tagum-libuganon-river", label: "Tagum-Libuganon River Basin" },

      // Protected Areas
      { id: "bird-sanctuary", label: "Bird Sanctuary" },
      { id: "national-park", label: "National Park" },
      { id: "protected-seascape", label: "Protected Seascape" },
      { id: "watershed-reserve", label: "Watershed Reserve" },
      
    ],
    subGroups: [
      {
        title: "Administrative Boundaries",
        layers: ["boundary-regional", "boundary-provincial", 'national-roads'],
      },
      {
        title: "Major River Basins",
        layers: ["abra-river", "agno-river", "agusan-river", "apayao-abulug-river", "bicol-river", "buayan-malungan-river", "cagayan-de-oro-river",
          "cagayan-river", "davao-river", "ilog-hilabangan-river", "jalaur-river", "mindanao-river", "pampanga-river", "panay-river", 
          "pasig-laguna-de-bay-river", "ranao-agus-river", "tagoloan-river", "tagum-libuganon-river", ],
      },
      {
        title: "Protected Areas",
        layers: ["nipa", "bird-sanctuary", "national-park", "protected-seascape", "watershed-reserve", ],
      },
      
      {
        title: "Biodiversity",
        layers: ["kba"],
      },
      {
        title: "Geological Infomation",
        layers: ["soil-type", "geol-phils"],
      },
    ],
  },
  {
    title: "Raster Layers",
    layers: [
      { id: "srtm-dem", label: "SRTM DEM" },
    ],
  },
];

const VECTOR_LAYERS = [
  // National Roads
  {
    id: "national-roads",
    mapLayerId: "national-roads-layer",
    type: "line",
    source: "nationalRoads",
    paint: {
      "line-color": "#333333",
      "line-width": 2,
    },
  },
  // Soil Type
  {
    id: "soil-type",
    mapLayerId: "soil-type-layer",
    type: "fill",
    source: "soilType",
    paint: {
      "fill-color": ["match", ["get", "type"], "Sandy Loam", "#F4A460", "Beach Sand", "#F4A460", "Fine Sandy Loam", "#F4A460", "Sand Dunes", "#F4A460", "Loamy Sand", "#F4A460", "Loam", "#D2B48C", "Silt Loam", "#D2B48C", "Silty Clay Loam", "#D2B48C", "Clay", "#A0522D", "Silty Clay", "#A0522D", "Hydrosol", "#87CEFA", "Bog Deep", "#6B8E23", "Rock Land", "#C0C0C0", "#cccccc"],
      "fill-opacity": 0.8,
      "fill-outline-color": "#000000",
    },
  },
  // Geology
  {
    id: "geol-phils",
    mapLayerId: "geol-phils-layer",
    type: "fill",
    source: "GeolPhils",
    paint: {
      "fill-color": "#b0bc0b",
      "fill-opacity": 0.5,
      "fill-outline-color": "#000000",
    },
  },
  // KBA
  {
    id: "kba",
    mapLayerId: "kba-layer",
    type: "fill",
    source: "KBA",
    paint: {
      "fill-color": "#031eb5",
      "fill-opacity": 0.5,
      "fill-outline-color": "#000000",
    },
  },
  // Nipa
  {
    id: "nipa",
    mapLayerId: "nipa-layer",
    type: "fill",
    source: "Nipas",
    paint: {
      "fill-color": "#b51203",
      "fill-opacity": 0.5,
      "fill-outline-color": "#000000",
    },
  },
  // River Basins
  {
    id: "abra-river",
    mapLayerId: "abra-river-layer",
    type: "fill",
    source: "abraRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "agno-river",
    mapLayerId: "agno-river-layer",
    type: "fill",
    source: "agnoRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "agusan-river",
    mapLayerId: "agusan-river-layer",
    type: "fill",
    source: "agusanRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "apayao-abulug-river",
    mapLayerId: "apayao-abulug-river-layer",
    type: "fill",
    source: "apayaoRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "bicol-river",
    mapLayerId: "bicol-river-layer",
    type: "fill",
    source: "bicolRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "buayan-malungan-river",
    mapLayerId: "buayan-malungan-river-layer",
    type: "fill",
    source: "buayanRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "cagayan-river",
    mapLayerId: "cagayan-river-layer",
    type: "fill",
    source: "cagayanRiver",
    paint: {
      "fill-color": "#00AA00",
      "fill-opacity": 0.5,
    },
  },
  // Protected Areas
  {
    id: "bird-sanctuary",
    mapLayerId: "bird-sanctuary-layer",
    type: "fill",
    source: "BirdSanctuary",
    paint: {
      "fill-color": "#043493",
      "fill-opacity": 0.5,
    },
  },
  {
    id: "national-park",
    mapLayerId: "national-park-layer",
    type: "fill",
    source: "NationalPark",
    paint: {
      "fill-color": "#FFA500",
      "fill-opacity": 0.7,
    },
  },
  {
    id: "protected-seascape",
    mapLayerId: "protected-seascape-layer",
    type: "fill",
    source: "ProtectedSea",
    paint: {
      "fill-color": "#b51203",
      "fill-opacity": 0.5,
      "fill-outline-color": "#000000",
    },
  },
  {
    id: "watershed-reserve",
    mapLayerId: "watershed-reserve-layer",
    type: "fill",
    source: "WatershedReserve",
    paint: {
      "fill-color": "#0788c4",
      "fill-opacity": 0.5,
      "fill-outline-color": "#000000",
    },
  },
  // Forest Loss
  {
    id: "forestcove",
    mapLayerId: "forest-loss-2001-layer",
    type: "circle",
    source: "forestcoverlos",
    paint: {
      
    },
  },
  //
  // Raster Layer
  {
    id: "srtm-dem",
    mapLayerId: "wms-layer",
    existsInStyle: true,
  },
];

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19,
    },
    wmsSource: {
      type: "raster",
      tiles: [url_dem],
      tileSize: 256,
      attribution: "DEM Layer from GeoServer",
    },
    nationalRoads: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3Ahotosm_phl_roads_lines_shp&outputFormat=application%2Fjson&maxFeatures=214120",
    },
    soilType: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AdaSoil&outputFormat=application%2Fjson",
    },
    GeolPhils: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AGeol_Phils_MGB&outputFormat=application%2Fjson",
    },
    Nipas: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3ANipas_&outputFormat=application%2Fjson",
    },
    KBA: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AKBA_&outputFormat=application%2Fjson",
    },
    abraRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AAbra%20River%20Basin&outputFormat=application%2Fjson",
    },
    agnoRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AAgno%20River%20Basin&outputFormat=application%2Fjson",
    },
    agusanRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AAgusan%20River%20Basin&outputFormat=application%2Fjson",
    },
    apayaoRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AApayao-Abulug%20River%20Basin&outputFormat=application%2Fjson",
    },
    bicolRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3ABicol%20River%20Basin&outputFormat=application%2Fjson",
    },
    buayanRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3ABuayan-Malungon%20River%20Basin&outputFormat=application%2Fjson",
    },
    cagayanRiver: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3ACagayan%20River%20Basin&outputFormat=application%2Fjson",
    },
    // Protected Areas
    BirdSanctuary: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AGame_Refuge_and_Bird_Sanctuary&outputFormat=application%2Fjson",
    },
    NationalPark: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3ANational_Park&outputFormat=application%2Fjson",
    },
    ProtectedSea: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AProtected_Seascape&outputFormat=application%2Fjson",
    },
    WatershedReserve: {
      type: "geojson",
      data: "http://192.168.68.144:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3AWatershed_Reservation&outputFormat=application%2Fjson",
    },
    // forest losssources...
    forestcoverlos: {
      type: "geojson",
      data: {
        'type': 'FeatureCollection',
        'features':forestCover
      },
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
    {
      id: "wms-layer",
      type: "raster",
      source: "wmsSource",
      layout: {
        visibility: "none",
      },
    },
  ],
};

  const [visibleLayers, setVisibleLayers] = React.useState(
    LAYER_GROUPS.reduce((acc, group) => {
      group.layers.forEach((layer) => {
        acc[typeof layer === "string" ? layer : layer.id] = false;
      });
      return acc;
    }, {}))

  return (
    <MapContext.Provider value={
      { url_dem, ANA_GROUPS, LAYER_GROUPS, VECTOR_LAYERS, MAP_STYLE,
        visibleLayers, setVisibleLayers
      }
    }>
      {props.children}
    </MapContext.Provider>
  )
}

export default MapContextProvider;