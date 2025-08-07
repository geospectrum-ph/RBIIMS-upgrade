import * as React from "react";
import axios from "axios";
import * as shp from "shpjs";

export const MapContext = React.createContext({
  moveLayerUp: () => {},
  moveLayerDown: () => {},
  setMapInstance: () => {},
  uploadShapefile: () => {},
  uploadedLayers: [],
  addUploadedLayerToGroup: () => {},
});

function MapContextProvider(props) {
  const [mapInstance, setMapInstance] = React.useState(null);
  const [uploadedLayers, setUploadedLayers] = React.useState([]);
  
  const url_dem = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_30meters_DEM_Philippines_clipped&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;
  const url_twi = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_DEM_Philippines_TWI&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;
  const url_slope = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_DEM_Philippines_Slope&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;
  const url_hillshade = `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver?layer=GMS:SRTM_HillshadeColor_Philippines_clip&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857`;

  const [forestCoverData, setForestCoverData] = React.useState({});
  const [populationData, setPopulationData] = React.useState({});
  const [showModal, setShowModal] = React.useState(false); // Upload modal
  const [showModalEdit, setShowModalEdit] = React.useState(false); // Edit modal

  const fetchForestData = async (region, year) => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_DOMAIN}/layer/getPointsHeat?regn=${region}&year=${year}`;
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
      const url = `${process.env.REACT_APP_BACKEND_DOMAIN}/layer/getPopulationData?type=${dataType}&region=${encodeURIComponent(region)}`;
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

  const uploadShapefile = async (files, layerName, groupName) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append(file.name.endsWith(".shp") ? "shp" : file.name.endsWith(".dbf") ? "dbf" : file.name.endsWith(".prj") ? "prj" : "file", file);
      });
      formData.append("tableName", layerName);
      formData.append("groupName", groupName);

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/shapefiles`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000,
      });

      const newLayer = {
        id: layerName,
        label: layerName,
        group: groupName,
        type: "fill",
        source: `uploaded-${layerName}`,
        paint: {
          "fill-color": getRandomColor(),
          "fill-opacity": 0.7,
          "fill-outline-color": "#000",
        },
      };

      setUploadedLayers((prev) => [...prev, newLayer]);
      return { success: true, layer: newLayer };
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  };

  // Helper function for random colors
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const fetchUploadedLayers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/uploaded-layers`);
      const layers = response.data.map((layer) => ({
        id: layer.table_name,
        label: layer.layer_name,
        group: layer.group_name,
        type: "fill",
        source: `uploaded-${layer.table_name}`,
        paint: {
          "fill-color": getRandomColor(),
          "fill-opacity": 0.7,
        },
      }));
      setUploadedLayers(layers);
      return layers;
    } catch (error) {
      console.error("Error fetching uploaded layers:", error);
      return [];
    }
  };

  const moveLayerUp = (layerId) => {
    if (!mapInstance) return;
    console.log("testup");
    const currentOrder = mapInstance
      .getStyle()
      .layers.filter((l) => visibleLayers[l.id] || visibleLayers[l.id?.split("-")[0]])
      .map((l) => l.id);

    const currentIndex = currentOrder.indexOf(layerId);
    if (currentIndex <= 0) return;

    mapInstance.moveLayer(layerId, currentOrder[currentIndex - 1]);
  };

  const moveLayerDown = (layerId) => {
    if (!mapInstance) return;
    console.log("testdown");
    const currentOrder = mapInstance
      .getStyle()
      .layers.filter((l) => visibleLayers[l.id] || visibleLayers[l.id?.split("-")[0]])
      .map((l) => l.id);

    const currentIndex = currentOrder.indexOf(layerId);
    if (currentIndex === -1 || currentIndex >= currentOrder.length - 1) return;

    if (currentIndex < currentOrder.length - 2) {
      mapInstance.moveLayer(layerId, currentOrder[currentIndex + 2]);
    } else {
      mapInstance.moveLayer(layerId);
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
          layers: ["Topographic Wetness Index", "Slope", "Hillshade"],
        },
      ],
    },
  ];

  const LAYER_GROUPS = [
    {
      title: "Administrative boundaries",
      subGroups: [
        {
          title: "Provincial Boundaries",
          layers: [
            { id: "province-1", label: "Province 1" },
            { id: "province-2", label: "Province 2" },
          ],
        },
        {
          title: "Municipal Boundaries",
          layers: [
            { id: "municipality-1", label: "Municipality 1" },
            { id: "municipality-2", label: "Municipality 2" },
          ],
        },
        {
          title: "Barangay Boundaries",
          layers: [
            { id: "barangay-1", label: "Barangay 1" },
            { id: "barangay-2", label: "Barangay 2" },
          ],
        },
      ],
    },
    {
      title: "Water Resources and Hydrology",
      subGroups: [
        {
          title: "Major River Basin",
          layers: [
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
          ],
        },
        {
          title: "Stream Network",
          layers: [
            { id: "Abatan_stream_Network", label: "Abatan Stream Network" },
            { id: "Abra_stream_Network", label: "Abra Stream Network" },
            { id: "Abulug_stream_Network", label: "Abulug Stream Network" },
            { id: "Agno_stream_Network", label: "Agno Stream Network" },
            { id: "Agus_stream_Network", label: "Agus Stream Network" },
            { id: "Agusan_stream_Network", label: "Agusan Stream Network" },
            { id: "Aklan_stream_Network", label: "Aklan Stream Network" },
            { id: "Amburayan_stream_Network", label: "Amburayan Stream Network" },
            { id: "Amnay_stream_Network", label: "Amnay Stream Network" },
            { id: "Angat_stream_Network", label: "Angat Stream Network" },
            { id: "Aringay_stream_Network", label: "Aringay Stream Network" },
            { id: "Asiga_stream_Network", label: "Asiga Stream Network" },
            { id: "Bago_stream_Network", label: "Bago Stream Network" },
            { id: "Balite_stream_Network", label: "Balite Basit Stream Network" },
            { id: "Basey_stream_Network", label: "Basey Stream Network" },
            { id: "Bato_stream_Network", label: "Bato Stream Network" },
            { id: "Bauang_stream_Network", label: "Bauang Stream Network" },
            { id: "Bayawan_stream_Network", label: "Bayawan Stream Network" },
            { id: "Bicol_stream_Network", label: "Bicol Stream Network" },
            { id: "Binalbagan_stream_Network", label: "Binalbagan Stream Network" },
            { id: "Bislak_stream_Network", label: "Bislak Stream Network" },
            { id: "Bislig_stream_Network", label: "Bislig Stream Network" },
            { id: "Bongabong_stream_Network", label: "Bongabong Stream Network" },
            { id: "Bucao_stream_Network", label: "Bucao Stream Network" },
            { id: "Cadacan_stream_Network", label: "Cadacan Stream Network" },
            { id: "Cagaranan_stream_Network", label: "Cagaranan Stream Network" },
            { id: "Cagayan_stream_Network", label: "Cagayan Stream Network" },
            { id: "Cagayan_de_Oro_stream_Network", label: "Cagayan De Oro Stream Network" },
            { id: "Caguray_stream_Network", label: "Caguray Stream Network" },
            { id: "Calbiga_stream_Network", label: "Calbiga Stream Network" },
            { id: "Calumpang_stream_Network", label: "Calumpang Stream Network" },
            { id: "Cantilan_stream_Network", label: "Cantilan Stream Network" },
            { id: "Caraga_stream_Network", label: "Caraga Stream Network" },
            { id: "Casauman_stream_Network", label: "Casauman Stream Network" },
            { id: "Catarman_stream_Network", label: "Catarman Stream Network" },
            { id: "Cateel_stream_Network", label: "Cateel Stream Network" },
            { id: "Catubig_stream_Network", label: "Catubig Stream Network" },
            { id: "Daguitan_Marabang_stream_Network", label: "Daguitan Marabang Stream Network" },
            { id: "Davao_stream_Network", label: "Davao Stream Network" },
            { id: "Dikayu_stream_Network", label: "Dikayu Stream Network" },
            { id: "Dinas_stream_Network", label: "Dinas Stream Network" },
            { id: "Dipolog_stream_Network", label: "Dipolog Stream Network" },
            { id: "Diteki_stream_Network", label: "Diteki Stream Network" },
            { id: "Dolores_stream_Network", label: "Dolores Stream Network" },
            { id: "Gandara_stream_Network", label: "Gandara Stream Network" },
            { id: "Glan_stream_Network", label: "Glan Stream Network" },
            { id: "Himogaan_stream_Network", label: "Himogaan Stream Network" },
            { id: "Hinatuan_stream_Network", label: "Hinatuan Stream Network" },
            { id: "Ilian_stream_Network", label: "Ilian Stream Network" },
            { id: "Ilog_Hilabangan_stream_Network", label: "Ilog Hilabangan Stream Network" },
            { id: "Inabanga_stream_Network", label: "Inabanga Stream Network" },
            { id: "Infanta_stream_Network", label: "Infanta Stream Network" },
            { id: "Ingin_Maras_stream_Network", label: "Ingin Maras Stream Network" },
            { id: "Iponan_stream_Network", label: "Iponan Stream Network" },
            { id: "Jalaur_stream_Network", label: "Jalaur Stream Network" },
            { id: "Jibatang_stream_Network", label: "Jibatang Stream Network" },
            { id: "Kalaong_stream_Network", label: "Kalaong Stream Network" },
            { id: "Kilbay_Catabangan_stream_Network", label: "Kilbay Catabangan Stream Network" },
            { id: "Kraan_stream_Network", label: "Kraan Stream Network" },
            { id: "Labangan_stream_Network", label: "Labangan Stream Network" },
            { id: "Labo_stream_Network", label: "Labo Stream Network" },
            { id: "Laoag_stream_Network", label: "Laoag Stream Network" },
            { id: "Lasang_stream_Network", label: "Lasang Stream Network" },
            { id: "Little_Lun_stream_Network", label: "Little Lun Stream Network" },
            { id: "Llorente_stream_Network", label: "Llorente Stream Network" },
            { id: "Loboc_stream_Network", label: "Loboc Stream Network" },
            { id: "Lubao_stream_Network", label: "Lubao Stream Network" },
            { id: "Lumangbayan_stream_Network", label: "Lumangbayan Stream Network" },
            { id: "Lumintao_stream_Network", label: "Lumintao Stream Network" },
            { id: "Magasawang_Tubig_stream_Network", label: "Magasawang Tubig Stream Network" },
            { id: "Magbando_stream_Network", label: "Magbando Stream Network" },
            { id: "Makar_stream_Network", label: "Makar Stream Network" },
            { id: "Malaking_Ilog_stream_Network", label: "Malaking Ilog Stream Network" },
            { id: "Malaylay_stream_Network", label: "Malaylay Stream Network" },
            { id: "Malungon_stream_Network", label: "Malungon Stream Network" },
            { id: "Mamburao_stream_Network", label: "Mamburao Stream Network" },
            { id: "Mandulog_stream_Network", label: "Mandulog Stream Network" },
            { id: "Mano_stream_Network", label: "Mano Stream Network" },
            { id: "Maranding_stream_Network", label: "Maranding Stream Network" },
            { id: "Marikina_Pasig_stream_Network", label: "Marikina Pasig Stream Network" },
            { id: "Matling_stream_Network", label: "Matling Stream Network" },
            { id: "Mongpong_stream_Network", label: "Mongpong Stream Network" },
            { id: "Norte_Lauis_stream_Network", label: "Norte Lauis Stream Network" },
            { id: "Odiongan_stream_Network", label: "Odiongan Stream Network" },
            { id: "Ogod_stream_Network", label: "Ogod Stream Network" },
            { id: "Oras_stream_Network", label: "Oras Stream Network" },
            { id: "Padala_Mainit_stream_Network", label: "Padala Mainit Stream Network" },
            { id: "Pagatban_stream_Network", label: "Pagatban Stream Network" },
            { id: "Pagbahan_stream_Network", label: "Pagbahan Stream Network" },
            { id: "Pagsangahan_stream_Network", label: "Pagsangahan Stream Network" },
            { id: "Palanan_stream_Network", label: "Palanan Stream Network" },
            { id: "Palo_stream_Network", label: "Palo Stream Network" },
            { id: "Pambu_Khan_stream_Network", label: "Pambu Khan Stream Network" },
            { id: "Pampanga_stream_Network", label: "Pampanga Stream Network" },
            { id: "Pamplona_stream_Network", label: "Pamplona Stream Network" },
            { id: "Panay_stream_Network", label: "Panay Stream Network" },
            { id: "Pansipit_stream_Network", label: "Pansipit Stream Network" },
            { id: "Paro_Dapitan_stream_Network", label: "Paro Dapitan Stream Network" },
            { id: "Patalan_Dagupan_stream_Network", label: "Patalan Dagupan Stream Network" },
            { id: "Quipit_stream_Network", label: "Quipit Stream Network" },
            { id: "Rio_Grande_de_Mindanao_stream_Network", label: "Rio Grande De Mindanao Stream Network" },
            { id: "Rizal_stream_Network", label: "Rizal Stream Network" },
            { id: "Roxas_stream_Network", label: "Roxas Stream Network" },
            { id: "Sablayan_stream_Network", label: "Sablayan Stream Network" },
            { id: "Salug_stream_Network", label: "Salug Stream Network" },
            { id: "Sangputan_stream_Network", label: "Sangputan Stream Network" },
            { id: "Sibalom_stream_Network", label: "Sibalom Stream Network" },
            { id: "Sibuguey_stream_Network", label: "Sibuguey Stream Network" },
            { id: "Sibulao_stream_Network", label: "Sibulao Stream Network" },
            { id: "Siguel_stream_Network", label: "Siguel Stream Network" },
            { id: "Silay_stream_Network", label: "Silay Stream Network" },
            { id: "Sindangan_stream_Network", label: "Sindangan Stream Network" },
            { id: "Siocon_stream_Network", label: "Siocon Stream Network" },
            { id: "Sipalay_stream_Network", label: "Sipalay Stream Network" },
            { id: "Sipocong_stream_Network", label: "Sipocong Stream Network" },
            { id: "Sumlog_stream_Network", label: "Sumlog Stream Network" },
            { id: "Suribao_stream_Network", label: "Suribao Stream Network" },
            { id: "Taboan_stream_Network", label: "Taboan Stream Network" },
            { id: "Taft_stream_Network", label: "Taft Stream Network" },
            { id: "Tago_stream_Network", label: "Tago Stream Network" },
            { id: "Tagoloan_stream_Network", label: "Tagoloan Stream Network" },
            { id: "Tagum_stream_Network", label: "Tagum Stream Network" },
            { id: "Tanjay_stream_Network", label: "Tanjay Stream Network" },
            { id: "Ternate_stream_Network", label: "Ternate Stream Network" },
            { id: "Tian_stream_Network", label: "Tian Stream Network" },
            { id: "Tigum_stream_Network", label: "Tigum Stream Network" },
            { id: "Ulot_stream_Network", label: "Ulot Stream Network" },
            { id: "Umiray_stream_Network", label: "Umiray Stream Network" },
          ],
        },
      ],
      layers: [
        { id: "srtm-dem", label: "Digital Elevation Model" },
        { id: "hillshade", label: "Hillshade" },
        { id: "twi", label: "Topographic Wetness Index" },
        { id: "slope", label: "Slope" },
        { id: "tpi", label: "Topographic Position Index" },
        { id: "tc", label: "Topographic Contour" },
        { id: "rough", label: "Roughness" },
        { id: "aspect", label: "Aspect" },
        { id: "relief", label: "Color Relief" },
      ],
    },
    {
      title: "Climate and Meteorology",
      layers: [
        { id: "evapotrans", label: "Evapotranspiration" },
        { id: "meteorological", label: "Meteorological" },
        { id: "tmsi", label: "Tidal Monitoring Station Inventory" },
      ],
    },
    {
      title: "Geophysical and Hazards",
      layers: [
        { id: "soil-type", label: "Soil Type" },
        { id: "geol-phils", label: "Geology of the Philippines" },
      ],
    },
    {
      title: "Biodiversity and Conservation",
      layers: [
        { id: "protected-seascape", label: "Protected Seascape" },
        { id: "kba", label: "Key Biodiversity Areas" },
      ],
    },
    {
      title: "Aquatic and Marine Monitoring",
      layers: [{ id: "", label: "Surficial Sediment Survey" }],
    },
    {
      title: "Demographics",
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
      title: "Environmental Management",
      subGroups: [
        {
          title: "Forest Cover Loss",
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
      ],
    },
    {
      title: "Infrastructure and Facilities",
      layers: [{ id: "national-roads", label: "National Roads" }],
    },
    {
      title: "Agriculture and Forestry",
      layers: [{ id: "", label: "Agriculture Crop Farm Inventory" }],
    },
    {
      title: "Industry and Commerce",
      layers: [{ id: "", label: "Manufacturing Sector Inventory" }],
    },
    // other groups here
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
    // Stream Netowrks
    {
      id: "Abatan_stream_Network",
      mapLayerId: "Abatan_stream_Network-layer",
      type: "line",
      source: "AbatanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Abra_stream_Network",
      mapLayerId: "Abra_stream_Network-layer",
      type: "line",
      source: "AbraStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Abulug_stream_Network",
      mapLayerId: "Abulug_stream_Network-layer",
      type: "line",
      source: "AbulugStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Agno_stream_Network",
      mapLayerId: "Agno_stream_Network-layer",
      type: "line",
      source: "AgnoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Agus_stream_Network",
      mapLayerId: "Agus_stream_Network-layer",
      type: "line",
      source: "AgusStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Agusan_stream_Network",
      mapLayerId: "Agusan_stream_Network-layer",
      type: "line",
      source: "AgusanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Aklan_stream_Network",
      mapLayerId: "Aklan_stream_Network-layer",
      type: "line",
      source: "AklanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Amburayan_stream_Network",
      mapLayerId: "Amburayan_stream_Network-layer",
      type: "line",
      source: "AmburayanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Amnay_stream_Network",
      mapLayerId: "Amnay_stream_Network-layer",
      type: "line",
      source: "AmnayStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Angat_stream_Network",
      mapLayerId: "Angat_stream_Network-layer",
      type: "line",
      source: "AngatStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Aringay_stream_Network",
      mapLayerId: "Aringay_stream_Network-layer",
      type: "line",
      source: "AringayStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Asiga_stream_Network",
      mapLayerId: "Asiga_stream_Network-layer",
      type: "line",
      source: "AsigaStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bago_stream_Network",
      mapLayerId: "Bago_stream_Network-layer",
      type: "line",
      source: "BagoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Balite_stream_Network",
      mapLayerId: "Balite_stream_Network-layer",
      type: "line",
      source: "BaliteStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Basey_stream_Network",
      mapLayerId: "Basey_stream_Network-layer",
      type: "line",
      source: "BaseyStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bato_stream_Network",
      mapLayerId: "Bato_stream_Network-layer",
      type: "line",
      source: "BatoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bauang_stream_Network",
      mapLayerId: "Bauang_stream_Network-layer",
      type: "line",
      source: "BauangStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bayawan_stream_Network",
      mapLayerId: "Bayawan_stream_Network-layer",
      type: "line",
      source: "BayawanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bicol_stream_Network",
      mapLayerId: "Bicol_stream_Network-layer",
      type: "line",
      source: "BicolStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Binalbagan_stream_Network",
      mapLayerId: "Binalbagan_stream_Network-layer",
      type: "line",
      source: "BinalbaganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bislak_stream_Network",
      mapLayerId: "Bislak_stream_Network-layer",
      type: "line",
      source: "BislakStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bislig_stream_Network",
      mapLayerId: "Bislig_stream_Network-layer",
      type: "line",
      source: "BisligStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bongabong_stream_Network",
      mapLayerId: "Bongabong_stream_Network-layer",
      type: "line",
      source: "BongabongStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Bucao_stream_Network",
      mapLayerId: "Bucao_stream_Network-layer",
      type: "line",
      source: "BucaoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Cadacan_stream_Network",
      mapLayerId: "Cadacan_stream_Network-layer",
      type: "line",
      source: "CadacanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Cagaranan_stream_Network",
      mapLayerId: "Cagaranan_stream_Network-layer",
      type: "line",
      source: "CagarananStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Cagayan_stream_Network",
      mapLayerId: "Cagayan_stream_Network-layer",
      type: "line",
      source: "CagayanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Cagayan_de_Oro_stream_Network",
      mapLayerId: "Cagayan_de_Oro_stream_Network-layer",
      type: "line",
      source: "CagayanDeOroStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Caguray_stream_Network",
      mapLayerId: "Caguray_stream_Network-layer",
      type: "line",
      source: "CagurayStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Calbiga_stream_Network",
      mapLayerId: "Calbiga_stream_Network-layer",
      type: "line",
      source: "CalbigaStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Calumpang_stream_Network",
      mapLayerId: "Calumpang_stream_Network-layer",
      type: "line",
      source: "CalumpangStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Cantilan_stream_Network",
      mapLayerId: "Cantilan_stream_Network-layer",
      type: "line",
      source: "CantilanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Caraga_stream_Network",
      mapLayerId: "Caraga_stream_Network-layer",
      type: "line",
      source: "CaragaStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Casauman_stream_Network",
      mapLayerId: "Casauman_stream_Network-layer",
      type: "line",
      source: "CasaumanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Catarman_stream_Network",
      mapLayerId: "Catarman_stream_Network-layer",
      type: "line",
      source: "CatarmanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Cateel_stream_Network",
      mapLayerId: "Cateel_stream_Network-layer",
      type: "line",
      source: "CateelStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Catubig_stream_Network",
      mapLayerId: "Catubig_stream_Network-layer",
      type: "line",
      source: "CatubigStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Daguitan_Marabang_stream_Network",
      mapLayerId: "Daguitan_Marabang_stream_Network-layer",
      type: "line",
      source: "DaguitanMarabangStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Davao_stream_Network",
      mapLayerId: "Davao_stream_Network-layer",
      type: "line",
      source: "DavaoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Dikayu_stream_Network",
      mapLayerId: "Dikayu_stream_Network-layer",
      type: "line",
      source: "DikayuStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Dinas_stream_Network",
      mapLayerId: "Dinas_stream_Network-layer",
      type: "line",
      source: "DinasStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Dipolog_stream_Network",
      mapLayerId: "Dipolog_stream_Network-layer",
      type: "line",
      source: "DipologStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Diteki_stream_Network",
      mapLayerId: "Diteki_stream_Network-layer",
      type: "line",
      source: "DitekiStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Dolores_stream_Network",
      mapLayerId: "Dolores_stream_Network-layer",
      type: "line",
      source: "DoloresStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Gandara_stream_Network",
      mapLayerId: "Gandara_stream_Network-layer",
      type: "line",
      source: "GandaraStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Glan_stream_Network",
      mapLayerId: "Glan_stream_Network-layer",
      type: "line",
      source: "GlanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Himogaan_stream_Network",
      mapLayerId: "Himogaan_stream_Network-layer",
      type: "line",
      source: "HimogaanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Hinatuan_stream_Network",
      mapLayerId: "Hinatuan_stream_Network-layer",
      type: "line",
      source: "HinatuanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Ilian_stream_Network",
      mapLayerId: "Ilian_stream_Network-layer",
      type: "line",
      source: "IlianStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Ilog_Hilabangan_stream_Network",
      mapLayerId: "Ilog_Hilabangan_stream_Network-layer",
      type: "line",
      source: "IlogHilabanganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Inabanga_stream_Network",
      mapLayerId: "Inabanga_stream_Network-layer",
      type: "line",
      source: "InabangaStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Infanta_stream_Network",
      mapLayerId: "Infanta_stream_Network-layer",
      type: "line",
      source: "InfantaStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Ingin_Maras_stream_Network",
      mapLayerId: "Ingin_Maras_stream_Network-layer",
      type: "line",
      source: "InginMarasStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Iponan_stream_Network",
      mapLayerId: "Iponan_stream_Network-layer",
      type: "line",
      source: "IponanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Jalaur_stream_Network",
      mapLayerId: "Jalaur_stream_Network-layer",
      type: "line",
      source: "JalaurStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Jibatang_stream_Network",
      mapLayerId: "Jibatang_stream_Network-layer",
      type: "line",
      source: "JibatangStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Kalaong_stream_Network",
      mapLayerId: "Kalaong_stream_Network-layer",
      type: "line",
      source: "KalaongStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Kilbay_Catabangan_stream_Network",
      mapLayerId: "Kilbay_Catabangan_stream_Network-layer",
      type: "line",
      source: "KilbayCatabanganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Kraan_stream_Network",
      mapLayerId: "Kraan_stream_Network-layer",
      type: "line",
      source: "KraanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Labangan_stream_Network",
      mapLayerId: "Labangan_stream_Network-layer",
      type: "line",
      source: "LabanganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Labo_stream_Network",
      mapLayerId: "Labo_stream_Network-layer",
      type: "line",
      source: "LaboStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Laoag_stream_Network",
      mapLayerId: "Laoag_stream_Network-layer",
      type: "line",
      source: "LaoagStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Lasang_stream_Network",
      mapLayerId: "Lasang_stream_Network-layer",
      type: "line",
      source: "LasangStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Little_Lun_stream_Network",
      mapLayerId: "Little_Lun_stream_Network-layer",
      type: "line",
      source: "LittleLunStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Llorente_stream_Network",
      mapLayerId: "Llorente_stream_Network-layer",
      type: "line",
      source: "LlorenteStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Loboc_stream_Network",
      mapLayerId: "Loboc_stream_Network-layer",
      type: "line",
      source: "LobocStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Lubao_stream_Network",
      mapLayerId: "Lubao_stream_Network-layer",
      type: "line",
      source: "LubaoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Lumangbayan_stream_Network",
      mapLayerId: "Lumangbayan_stream_Network-layer",
      type: "line",
      source: "LumangbayanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Lumintao_stream_Network",
      mapLayerId: "Lumintao_stream_Network-layer",
      type: "line",
      source: "LumintaoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Magasawang_Tubig_stream_Network",
      mapLayerId: "Magasawang_Tubig_stream_Network-layer",
      type: "line",
      source: "MagasawangTubigStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Magbando_stream_Network",
      mapLayerId: "Magbando_stream_Network-layer",
      type: "line",
      source: "MagbandoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Makar_stream_Network",
      mapLayerId: "Makar_stream_Network-layer",
      type: "line",
      source: "MakarStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Malaking_Ilog_stream_Network",
      mapLayerId: "Malaking_Ilog_stream_Network-layer",
      type: "line",
      source: "MalakingIlogStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Malaylay_stream_Network",
      mapLayerId: "Malaylay_stream_Network-layer",
      type: "line",
      source: "MalaylayStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Malungon_stream_Network",
      mapLayerId: "Malungon_stream_Network-layer",
      type: "line",
      source: "MalungonStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Mamburao_stream_Network",
      mapLayerId: "Mamburao_stream_Network-layer",
      type: "line",
      source: "MamburaoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Mandulog_stream_Network",
      mapLayerId: "Mandulog_stream_Network-layer",
      type: "line",
      source: "MandulogStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Mano_stream_Network",
      mapLayerId: "Mano_stream_Network-layer",
      type: "line",
      source: "ManoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Maranding_stream_Network",
      mapLayerId: "Maranding_stream_Network-layer",
      type: "line",
      source: "MarandingStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Marikina_Pasig_stream_Network",
      mapLayerId: "Marikina_Pasig_stream_Network-layer",
      type: "line",
      source: "MarikinaPasigStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Matling_stream_Network",
      mapLayerId: "Matling_stream_Network-layer",
      type: "line",
      source: "MatlingStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Mongpong_stream_Network",
      mapLayerId: "Mongpong_stream_Network-layer",
      type: "line",
      source: "MongpongStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Norte_Lauis_stream_Network",
      mapLayerId: "Norte_Lauis_stream_Network-layer",
      type: "line",
      source: "NorteLauisStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Odiongan_stream_Network",
      mapLayerId: "Odiongan_stream_Network-layer",
      type: "line",
      source: "OdionganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Ogod_stream_Network",
      mapLayerId: "Ogod_stream_Network-layer",
      type: "line",
      source: "OgodStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Oras_stream_Network",
      mapLayerId: "Oras_stream_Network-layer",
      type: "line",
      source: "OrasStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Padala_Mainit_stream_Network",
      mapLayerId: "Padala_Mainit_stream_Network-layer",
      type: "line",
      source: "PadalaMainitStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tagoloan_stream_Network",
      mapLayerId: "Tagoloan_stream_Network-layer",
      type: "line",
      source: "TagoloanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tagum_stream_Network",
      mapLayerId: "Tagum_stream_Network-layer",
      type: "line",
      source: "TagumStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Talisay_stream_Network",
      mapLayerId: "Talisay_stream_Network-layer",
      type: "line",
      source: "TalisayStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Talomo_stream_Network",
      mapLayerId: "Talomo_stream_Network-layer",
      type: "line",
      source: "TalomoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tamugan_stream_Network",
      mapLayerId: "Tamugan_stream_Network-layer",
      type: "line",
      source: "TamuganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tanauan_stream_Network",
      mapLayerId: "Tanauan_stream_Network-layer",
      type: "line",
      source: "TanauanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tandag_stream_Network",
      mapLayerId: "Tandag_stream_Network-layer",
      type: "line",
      source: "TandagStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tapian_stream_Network",
      mapLayerId: "Tapian_stream_Network-layer",
      type: "line",
      source: "TapianStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tapuac_stream_Network",
      mapLayerId: "Tapuac_stream_Network-layer",
      type: "line",
      source: "TapuacStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tawiran_stream_Network",
      mapLayerId: "Tawiran_stream_Network-layer",
      type: "line",
      source: "TawiranStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tibaguin_stream_Network",
      mapLayerId: "Tibaguin_stream_Network-layer",
      type: "line",
      source: "TibaguinStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tibungco_stream_Network",
      mapLayerId: "Tibungco_stream_Network-layer",
      type: "line",
      source: "TibungcoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tigbauan_stream_Network",
      mapLayerId: "Tigbauan_stream_Network-layer",
      type: "line",
      source: "TigbauanStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Timbangan_stream_Network",
      mapLayerId: "Timbangan_stream_Network-layer",
      type: "line",
      source: "TimbanganStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tinambac_stream_Network",
      mapLayerId: "Tinambac_stream_Network-layer",
      type: "line",
      source: "TinambacStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Tuguegarao_stream_Network",
      mapLayerId: "Tuguegarao_stream_Network-layer",
      type: "line",
      source: "TuguegaraoStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Ulot_stream_Network",
      mapLayerId: "Ulot_stream_Network-layer",
      type: "line",
      source: "UlotStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
      },
    },
    {
      id: "Umiray_stream_Network",
      mapLayerId: "Umiray_stream_Network-layer",
      type: "line",
      source: "UmirayStream",
      paint: {
        "line-color": "#0041ceff",
        "line-width": 1,
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
    {
      id: "twi",
      mapLayerId: "twi-layer",
      existsInStyle: true,
    },
    {
      id: "slope",
      mapLayerId: "slope-layer",
      existsInStyle: true,
    },
    {
      id: "hillshade",
      mapLayerId: "hillshade-layer",
      existsInStyle: true,
    },
    {
      id: "POP_MAY202",
      mapLayerId: "population-layer",
      type: "fill",
      source: "population",
      paint: {
        "fill-color": ["interpolate", ["linear"], ["get", "population"], 0, "#ffffb2", 50000, "#fed976", 100000, "#feb24c", 200000, "#fd8d3c", 300000, "#fc4e2a", 500000, "#e31a1c", 1000000, "#b10026", 3000000, "#2f005f"],
        "fill-opacity": 1,
        "fill-outline-color": "#000",
      },
    },
    {
      id: "PopDensity",
      mapLayerId: "population-density-layer",
      type: "fill",
      source: "populationDensity",
      paint: {
        "fill-color": ["interpolate", ["linear"], ["get", "density"], 0, "#ffffcc", 750, "#c2e699", 2500, "#78c679", 5000, "#31a354", 10000, "#006837", 20000, "#004529", 30000, "#002518", 50000, "#001510"],
        "fill-opacity": 1,
        "fill-outline-color": "#000",
      },
    },
    // Forest loss layers
    {
      id: "FOREST_LOSS",
      mapLayerId: "forest-loss-layer",
      type: "heatmap",
      source: "forestLoss",
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "mag"], 0, 0, 6, 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0, 9, 1, 11, 3],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)", 0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)"],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 11, 0],
      },
    },
    {
      id: "FOREST_LOSS_POINTS",
      mapLayerId: "forest-loss-points-layer",
      type: "circle",
      source: "forestLoss",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, ["interpolate", ["linear"], ["get", "mag"], 1, 1, 6, 4], 16, ["interpolate", ["linear"], ["get", "mag"], 1, 5, 6, 50]],
        "circle-color": ["interpolate", ["linear"], ["get", "mag"], 1, "rgba(33,102,172,0)", 2, "rgb(103,169,207)", 3, "rgb(209,229,240)", 4, "rgb(253,219,199)", 5, "rgb(239,138,98)", 6, "rgb(178,24,43)"],
        "circle-stroke-color": "white",
        "circle-stroke-width": 1,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 8, 1],
      },
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
      // Stream Network
      AbatanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AbatanStream`,
      },
      AbraStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AbraStream`,
      },
      AbulugStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AbulugStream`,
      },
      AgnoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AgnoStream`,
      },
      AgusStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AgusStream`,
      },
      AgusanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AgusanStream`,
      },
      AklanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AklanStream`,
      },
      AmburayanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AmburayanStream`,
      },
      AmnayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AmnayStream`,
      },
      AngatStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AngatStream`,
      },
      AringayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AringayStream`,
      },
      AsigaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/AsigaStream`,
      },
      BagoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BagoStream`,
      },
      BaliteStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BaliteStream`,
      },
      BaseyStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BaseyStream`,
      },
      BatoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BatoStream`,
      },
      BauangStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BauangStream`,
      },
      BayawanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BayawanStream`,
      },
      BicolStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BicolStream`,
      },
      BinalbaganStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BinalbaganStream`,
      },
      BislakStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BislakStream`,
      },
      BisligStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BisligStream`,
      },
      BongabongStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BongabongStream`,
      },
      BucaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/BucaoStream`,
      },
      CadacanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CadacanStream`,
      },
      CagarananStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CagarananStream`,
      },
      CagayanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CagayanStream`,
      },
      CagayandeOroStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CagayandeOroStream`,
      },
      CagurayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CagurayStream`,
      },
      CalbigaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CalbigaStream`,
      },
      CalumpangStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CalumpangStream`,
      },
      CantilanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CantilanStream`,
      },
      CaragaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CaragaStream`,
      },
      CasaumanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CasaumanStream`,
      },
      CatarmanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CatarmanStream`,
      },
      CateelStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CateelStream`,
      },
      CatubigStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/CatubigStream`,
      },
      DaguitanMarabangStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DaguitanMarabangStream`,
      },
      DavaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DavaoStream`,
      },
      DikayuStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DikayuStream`,
      },
      DinasStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DinasStream`,
      },
      DipologStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DipologStream`,
      },
      DitekiStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DitekiStream`,
      },
      DoloresStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/DoloresStream`,
      },
      GandaraStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/GandaraStream`,
      },
      GlanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/GlanStream`,
      },
      HimogaanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/HimogaanStream`,
      },
      HinatuanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/HinatuanStream`,
      },
      IlianStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/IlianStream`,
      },
      IlogHilabanganStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/IlogHilabanganStream`,
      },
      InabangaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/InabangaStream`,
      },
      InfantaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/InfantaStream`,
      },
      InginMarasStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/InginMarasStream`,
      },
      IponanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/IponanStream`,
      },
      JalaurStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/JalaurStream`,
      },
      JibatangStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/JibatangStream`,
      },
      KalaongStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/KalaongStream`,
      },
      KilbayCatabanganStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/KilbayCatabanganStream`,
      },
      KraanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/KraanStream`,
      },
      LabanganStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LabanganStream`,
      },
      LaboStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LaboStream`,
      },
      LaoagStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LaoagStream`,
      },
      LasangStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LasangStream`,
      },
      LittleLunStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LittleLunStream`,
      },
      LlorenteStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LlorenteStream`,
      },
      LobocStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LobocStream`,
      },
      LubaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LubaoStream`,
      },
      LumangbayanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LumangbayanStream`,
      },
      LumintaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/LumintaoStream`,
      },
      MagasawangTubigStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MagasawangTubigStream`,
      },
      MagbandoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MagbandoStream`,
      },
      MakarStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MakarStream`,
      },
      MalakingIlogStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MalakingIlogStream`,
      },
      MalaylayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MalaylayStream`,
      },
      MalungonStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MalungonStream`,
      },
      MamburaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MamburaoStream`,
      },
      MandulogStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MandulogStream`,
      },
      ManoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/ManoStream`,
      },
      MarandingStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MarandingStream`,
      },
      MarikinaPasigStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MarikinaPasigStream`,
      },
      MatlingStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MatlingStream`,
      },
      MongpongStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/MongpongStream`,
      },
      NorteLauisStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/NorteLauisStream`,
      },
      OdionganStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/OdionganStream`,
      },
      OgodStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/OgodStream`,
      },
      OrasStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/OrasStream`,
      },
      PadalaMainitStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PadalaMainitStream`,
      },
      PagatbanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PagatbanStream`,
      },
      PagbahanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PagbahanStream`,
      },
      PagsangahanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PagsangahanStream`,
      },
      PalananStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PalananStream`,
      },
      PaloStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PaloStream`,
      },
      PambuKhanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PambuKhanStream`,
      },
      PampangaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PampangaStream`,
      },
      PamplonaStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PamplonaStream`,
      },
      PanayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PanayStream`,
      },
      PansipitStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PansipitStream`,
      },
      ParoDapitanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/ParoDapitanStream`,
      },
      PatalanDagupanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/PatalanDagupanStream`,
      },
      QuipitStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/QuipitStream`,
      },
      RioGrandedeMindanaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/RioGrandedeMindanaoStream`,
      },
      RizalStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/RizalStream`,
      },
      RoxasStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/RoxasStream`,
      },
      SablayanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SablayanStream`,
      },
      SalugStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SalugStream`,
      },
      SangputanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SangputanStream`,
      },
      SibalomStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SibalomStream`,
      },
      SibugueyStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SibugueyStream`,
      },
      SibulaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SibulaoStream`,
      },
      SiguelStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SiguelStream`,
      },
      SilayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SilayStream`,
      },
      SindanganStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SindanganStream`,
      },
      SioconStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SioconStream`,
      },
      SipalayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SipalayStream`,
      },
      SipocongStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SipocongStream`,
      },
      SumlogStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SumlogStream`,
      },
      SuribaoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/SuribaoStream`,
      },
      TaboanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TaboanStream`,
      },
      TaftStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TaftStream`,
      },
      TagoStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TagoStream`,
      },
      TagoloanStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TagoloanStream`,
      },
      TagumStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TagumStream`,
      },
      TanjayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TanjayStream`,
      },
      TernateStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TernateStream`,
      },
      TianStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TianStream`,
      },
      TigumStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/TigumStream`,
      },
      UlotStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/UlotStream`,
      },
      UmirayStream: {
        type: "geojson",
        data: `${process.env.REACT_APP_BACKEND_DOMAIN}/api/geoserver/UmirayStream`,
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

  const [visibleLayers, setVisibleLayers] = React.useState(() => {
    const initialState = {};

    // Process top-level layers
    LAYER_GROUPS.forEach((group) => {
      // Handle direct layers in group
      if (group.layers) {
        group.layers.forEach((layer) => {
          const layerId = typeof layer === "string" ? layer : layer.id;
          initialState[layerId] = false;
        });
      }

      // Handle layers in subgroups
      if (group.subGroups) {
        group.subGroups.forEach((subGroup) => {
          // Handle direct layers in subgroup
          if (subGroup.layers) {
            subGroup.layers.forEach((layer) => {
              const layerId = subGroup.value ? `${subGroup.value}-${typeof layer === "string" ? layer : layer.id}` : typeof layer === "string" ? layer : layer.id;
              initialState[layerId] = false;
            });
          }

          // Handle nested subgroups
          if (subGroup.subGroups) {
            subGroup.subGroups.forEach((nestedSubGroup) => {
              if (nestedSubGroup.layers) {
                nestedSubGroup.layers.forEach((layer) => {
                  const layerId = nestedSubGroup.value ? `${nestedSubGroup.value}-${typeof layer === "string" ? layer : layer.id}` : typeof layer === "string" ? layer : layer.id;
                  initialState[layerId] = false;
                });
              }
            });
          }
        });
      }
    });

    return initialState;
  });

  return <MapContext.Provider value={{ showModalEdit, setShowModalEdit, showModal, setShowModal, uploadShapefile, fetchUploadedLayers, uploadedLayers, setUploadedLayers, url_dem, ANA_GROUPS, LAYER_GROUPS, VECTOR_LAYERS, MAP_STYLE, visibleLayers, setVisibleLayers, fetchForestData, forestCoverData, fetchPopulationData, populationData, moveLayerUp, moveLayerDown, setMapInstance }}>{props.children}</MapContext.Provider>;
}

export default MapContextProvider;
