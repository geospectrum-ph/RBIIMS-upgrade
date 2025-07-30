import * as React from "react";

export const MapContext = React.createContext();

function MapContextProvider(props) {
const url_dem = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_30meters_DEM_Philippines_clipped&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;
const url_twi = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_DEM_Philippines_TWI&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;
const url_slope = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_DEM_Philippines_Slope&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;
const url_hillshade = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_HillshadeColor_Philippines_clip&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;

  const [forestCoverData, setForestCoverData] = React.useState({});
  const [populationData, setPopulationData] = React.useState({});

  const fetchForestData = async (region, year) => {
    try {
      const url = `http://localhost:1433/layer/getPointsHeat?regn=${region}&year=${year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      setForestCoverData((prev) => ({
        ...prev,
        [`${region}-${year}`]: data,
      }));
    } catch (error) {
      console.error("Error fetching forest data:", error);
    }
  };

  const fetchPopulationData = async (dataType, region) => {
    try {
      const url = `http://localhost:1433/layer/getPopulationData?type=${dataType}&region=${encodeURIComponent(region)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      setPopulationData((prev) => ({
        ...prev,
        [`${dataType}-${region}`]: data,
      }));
    } catch (error) {
      console.error("Error fetching population data:", error);
    }
  };
  const ANA_GROUPS = [
    {
      title: "Analytics",
      layers: [
        // These will be the main region layers
      ],
      subGroups: [
        {
          title: "Heat Map (Forest Loss)",
          layers: [],
          subGroups: [
            {
              title: "BARMM",
              value: "BARMM",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "CAR",
              value: "CAR",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "NCR",
              value: "NCR",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Negros Island Region",
              value: "NIR",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 1 (Ilocos Region)",
              value: "R1",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 2 (Cagayan Valley)",
              value: "R2",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 3 (Central Luzon))",
              value: "R3",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 4-A (CALABARZON)",
              value: "R4A",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 4-B (MIMAROPA)",
              value: "MIMAROPA",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 5 (Bicol Region)",
              value: "R5",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 6 (Western Bisayas)",
              value: "R6",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 7 (Central Visayas)",
              value: "R7",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 8 (Eastern Visayas)",
              value: "R8",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 9 (Zamboanga Peninsula)",
              value: "R9",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 10 (Northern Mindanao)",
              value: "R10",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 11 (Davao Region)",
              value: "R11",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 12 (SOCCSKSARGEN)",
              value: "R12",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
            {
              title: "Region 13 (CARAGA)",
              value: "R13",
              layers: ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            },
          ],
        },
        {
          title: "Choropleth Map",
          layers: [],
          subGroups: [
            {
              title: "Population (May 2020)",
              value: "POP_MAY202",
              layers: ["REGION I (ILOCOS REGION)", "REGION II (CAGAYAN VALLEY)", "REGION III (CENTRAL LUZON)", "REGION IV-A (CALABARZON)", "REGION IV-B (MIMAROPA)", "REGION V (BICOL REGION)", "REGION VI (WESTERN VISAYAS)", "REGION VII (CENTRAL VISAYAS)", "REGION VIII (EASTERN VISAYAS)", "REGION IX (ZAMBOANGA PENINSULA)", "REGION X (NORTHERN MINDANAO)", "REGION XI (DAVAO REGION)", "REGION XII (SOCCSKSARGEN)", "NATIONAL CAPITAL REGION (NCR)", "CORDILLERA ADMINISTRATIVE REGION (CAR)", "AUTONOMOUS REGION IN MUSLIM MINDANAO (ARMM)", "REGION XIII (Caraga)", "Negros Island Region"],
            },
            {
              title: "Population Density",
              value: "PopDensity",
              layers: ["REGION I (ILOCOS REGION)", "REGION II (CAGAYAN VALLEY)", "REGION III (CENTRAL LUZON)", "REGION IV-A (CALABARZON)", "REGION IV-B (MIMAROPA)", "REGION V (BICOL REGION)", "REGION VI (WESTERN VISAYAS)", "REGION VII (CENTRAL VISAYAS)", "REGION VIII (EASTERN VISAYAS)", "REGION IX (ZAMBOANGA PENINSULA)", "REGION X (NORTHERN MINDANAO)", "REGION XI (DAVAO REGION)", "REGION XII (SOCCSKSARGEN)", "NATIONAL CAPITAL REGION (NCR)", "CORDILLERA ADMINISTRATIVE REGION (CAR)", "AUTONOMOUS REGION IN MUSLIM MINDANAO (ARMM)", "REGION XIII (Caraga)", "Negros Island Region"],
            },
          ],
        },
        {
          title: "Topograhic Derivatives",
          layers: ["Topograhic Wetness Index", "Slope", "Hillshade"],
        },
      ],
    },
  ];

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
          layers: ["boundary-regional", "boundary-provincial", "national-roads"],
        },
        {
          title: "Major River Basins",
          layers: ["abra-river", "agno-river", "agusan-river", "apayao-abulug-river", "bicol-river", "buayan-malungan-river", "cagayan-de-oro-river", "cagayan-river", "davao-river", "ilog-hilabangan-river", "jalaur-river", "mindanao-river", "pampanga-river", "panay-river", "pasig-laguna-de-bay-river", "ranao-agus-river", "tagoloan-river", "tagum-libuganon-river"],
        },
        {
          title: "Protected Areas",
          layers: ["nipa", "bird-sanctuary", "national-park", "protected-seascape", "watershed-reserve"],
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
      layers: [{ id: "srtm-dem", label: "SRTM DEM" }],
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
      paint: {},
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
      wmsTWISource: {
        type: "raster",
        tiles: [url_twi],
        tileSize: 256,
        attribution: "TWI Layer from GeoServer",
      },
      wmsSlopeSource: {
        type: "raster",
        tiles: [url_slope],
        tileSize: 256,
        attribution: "Slope Layer from GeoServer",
      },
      wmsHillshadeSource: {
        type: "raster",
        tiles: [url_hillshade],
        tileSize: 256,
        attribution: "HillShade Layer from GeoServer",
      },
      // nationalRoads: {
      //   type: "geojson",
      //   data: "http://192.168.1.133:8080/geoserver/GMS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GMS%3Ahotosm_phl_roads_lines_shp&outputFormat=application%2Fjson&maxFeatures=214120",
      // },
      soilType: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/soilType`,
      },
      GeolPhils: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/soilType`,
      },
      Nipas: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/Nipas`,
      },
      KBA: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/KBA`,
      },
      abraRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/abraRiver`,
      },
      agnoRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/agnoRiver`,
      },
      agusanRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/agusanRiver`,
      },
      apayaoRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/apayaoRiver`,
      },
      bicolRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/bicolRiver`,
      },
      buayanRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/buayanRiver`,
      },
      cagayanRiver: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/cagayanRiver`,
      },
      // Protected Areas
      BirdSanctuary: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BirdSanctuary`,
      },
      NationalPark: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/NationalPark`,
      },
      ProtectedSea: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/ProtectedSea`,
      },
      WatershedReserve: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/WatershedReserve`,
      },
      // forest losssources...
      forestcoverlos: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: forestCoverData,
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
      {
        id: "twi-layer",
        type: "raster",
        source: "wmsTWISource",
        layout: {
          visibility: "none",
        },
      },
      {
        id: "slope-layer",
        type: "raster",
        source: "wmsSlopeSource",
        layout: {
          visibility: "none",
        },
      },
      {
        id: "hillshade-layer",
        type: "raster",
        source: "wmsHillshadeSource",
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
    }, {})
  );

  return <MapContext.Provider value={{ url_dem, ANA_GROUPS, LAYER_GROUPS, VECTOR_LAYERS, MAP_STYLE, visibleLayers, setVisibleLayers, fetchForestData, forestCoverData, fetchPopulationData, populationData }}>{props.children}</MapContext.Provider>;
}

export default MapContextProvider;
