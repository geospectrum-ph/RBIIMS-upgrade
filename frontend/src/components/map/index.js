import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MaplibreLegendControl } from "@watergis/maplibre-gl-legend";
import "@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css";
import "./index.css";
import { MapContext } from "../../context/MapContext";
import { LayoutContext } from "../../context/LayoutContext";

export default function Map({ visibleLayers }) {
  const [riverBasin, setRiverBasin] = React.useState([]);
  const [roadNetworks, setRoadNetworks] = React.useState([]);
  const [forestCover, setForestCover] = React.useState([]);

  const { VECTOR_LAYERS, MAP_STYLE, forestCoverData, populationData } = React.useContext(MapContext);
  const { page } = React.useContext(LayoutContext);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const lng = 121.9822;
  const lat = 12.6042;
  const zoom = 5.5;
  // const API_KEY = 'YOUR_MAPTILER_API_KEY_HERE';

  const style = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap Contributors",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm", // This must match the source key above
      },
    ],
  };

  async function getRoadNetworks() {
    const url = "http://localhost:1433/layer/getRoadNetworks";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json().then((res) => {
        if (res.length > 0) {
          // console.log(res);
          setRiverBasin(res);
        }
      });
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getNationalRoad() {
    const url = "http://localhost:1433/layer/getNatRoad";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json().then((res) => {
        if (res.length > 0) {
          console.log(res);
          setRiverBasin(res);
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

  // Forest Cover Loss
  useEffect(() => {
    if (!map.current) return;

    // Add or update forest cover layers when data changes
    Object.entries(forestCoverData).forEach(([key, features]) => {
      const [region, year] = key.split("-");
      const sourceId = `forest-cover-${region}-${year}`;
      const layerId = `forest-cover-layer-${region}-${year}`;

      // Check if source already exists
      if (map.current.getSource(sourceId)) {
        map.current.getSource(sourceId).setData({
          type: "FeatureCollection",
          features,
        });
      } else {
        // Add new source and layer
        map.current.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features,
          },
        });

        map.current.addLayer({
          id: layerId,
          type: "heatmap",
          source: sourceId,
          maxzoom: 16,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "mag"], 0, 0, 6, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0, 9, 1, 11, 3],
            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)", 0.8, "rgb(239,138,98)", 1, "rgb(178,24,43)"],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 20],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 11, 0],
          },
        });

        // Add circle layer for higher zoom levels
        map.current.addLayer({
          id: `${layerId}-points`,
          type: "circle",
          source: sourceId,
          minzoom: 10,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, ["interpolate", ["linear"], ["get", "mag"], 1, 1, 6, 4], 16, ["interpolate", ["linear"], ["get", "mag"], 1, 5, 6, 50]],
            "circle-color": ["interpolate", ["linear"], ["get", "mag"], 1, "rgba(33,102,172,0)", 2, "rgb(103,169,207)", 3, "rgb(209,229,240)", 4, "rgb(253,219,199)", 5, "rgb(239,138,98)", 6, "rgb(178,24,43)"],
            "circle-stroke-color": "white",
            "circle-stroke-width": 1,
            "circle-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0, 8, 1],
          },
        });
      }
    });
  }, [forestCoverData]);

  // Population
  useEffect(() => {
    if (!map.current) return;

    Object.entries(visibleLayers).forEach(([layerId, isVisible]) => {
      if (layerId.startsWith("POP_MAY202-") || layerId.startsWith("PopDensity-")) {
        const [dataType, region] = layerId.split("-");
        const layerIdToShow = `population-layer-${dataType}-${region}`;

        if (map.current.getLayer(layerIdToShow)) {
          map.current.setLayoutProperty(layerIdToShow, "visibility", isVisible ? "visible" : "none");
        }
      }

      if (layerId.includes("-")) {
        const [region, year] = layerId.split("-");
        const baseLayerId = `forest-cover-layer-${region}-${year}`;

        if (map.current.getLayer(baseLayerId)) {
          map.current.setLayoutProperty(baseLayerId, "visibility", isVisible ? "visible" : "none");
          map.current.setLayoutProperty(`${baseLayerId}-points`, "visibility", isVisible ? "visible" : "none");
        }
      }
    });
  }, [visibleLayers]);

  // Database page
  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: zoom,
    });

    // getRoadNetworks();
    // getNationalRoad();

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

  // handles visibleLayers changes RASTER:
  useEffect(() => {
    if (!map.current) return;

    VECTOR_LAYERS.forEach(({ id, mapLayerId }) => {
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(mapLayerId, "visibility", visibleLayers[id] ? "visible" : "none");
      }
    });

    // Handle TWI layer visibility
    if (map.current.getLayer("twi-layer")) {
      map.current.setLayoutProperty("twi-layer", "visibility", visibleLayers["Topograhic Wetness Index"] ? "visible" : "none");
    }
    // Handle Slope layer visibility
    if (map.current.getLayer("slope-layer")) {
      map.current.setLayoutProperty("slope-layer", "visibility", visibleLayers["Slope"] ? "visible" : "none");
    }
    // Handle HilLshdde layer visibility
    if (map.current.getLayer("hillshade-layer")) {
      map.current.setLayoutProperty("hillshade-layer", "visibility", visibleLayers["Hillshade"] ? "visible" : "none");
    }
  }, [visibleLayers]);

  // Population and hover effect
  useEffect(() => {
    if (!map.current) return;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    let hoveredFeature = null;
    let lastHighlightLayerId = null;

    Object.entries(populationData).forEach(([key, features]) => {
      const [dataType, region] = key.split("-");
      const sourceId = `population-${dataType}-${region}`;
      const layerId = `population-layer-${dataType}-${region}`;
      const highlightLayerId = `highlight-${dataType}-${region}`;

      features.forEach((f, idx) => {
        if (!f.properties._uid) {
          f.properties._uid = `${dataType}-${region}-${idx}`;
        }
      });

      // Add or update source
      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features,
          },
        });

        // Fill layer
        map.current.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": dataType === "POP_MAY202" ? ["interpolate", ["linear"], ["get", "population"], 0, "#ffffb2", 50000, "#fed976", 100000, "#feb24c", 200000, "#fd8d3c", 300000, "#fc4e2a", 500000, "#e31a1c", 1000000, "#b10026", 3000000, "#2f005f"] : ["interpolate", ["linear"], ["get", "density"], 0, "#ffffcc", 750, "#c2e699", 2500, "#78c679", 5000, "#31a354", 10000, "#006837", 20000, "#004529", 30000, "#002518", 50000, "#001510"],
            "fill-opacity": 1,
            "fill-outline-color": "#000",
          },
        });

        // Highlight border layer
        map.current.addLayer({
          id: highlightLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#0aacc9",
            "line-width": 2,
          },
          filter: ["==", "_uid", ""],
        });

        map.current.on("mousemove", layerId, (e) => {
          const feature = e.features[0];
          const _uid = feature.properties._uid;

          // If already hovered, do nothing
          if (hoveredFeature === _uid) return;

          // Reset previous highlight
          if (lastHighlightLayerId && map.current.getLayer(lastHighlightLayerId)) {
            map.current.setFilter(lastHighlightLayerId, ["==", "_uid", ""]);
          }

          hoveredFeature = _uid;
          lastHighlightLayerId = highlightLayerId;

          map.current.getCanvas().style.cursor = "pointer";

          // Set new highlight
          map.current.setFilter(highlightLayerId, ["==", "_uid", _uid]);

          const props = feature.properties;
          const content = `
            <strong>${props.municipality}</strong><br/>
               Municipality Code: ${props.municipality_code}<br/>
            Region: ${props.region}<br/>
            ${props.population ? `Population: ${props.population}<br/>` : ""}
            ${props.density ? `Density: ${props.density}` : ""}
          `;

          popup.setLngLat(e.lngLat).setHTML(content).addTo(map.current);
        });

        map.current.on("mouseleave", layerId, () => {
          map.current.getCanvas().style.cursor = "";
          popup.remove();

          if (lastHighlightLayerId && map.current.getLayer(lastHighlightLayerId)) {
            map.current.setFilter(lastHighlightLayerId, ["==", "_uid", ""]);
          }

          hoveredFeature = null;
          lastHighlightLayerId = null;
        });
      } else {
        map.current.getSource(sourceId).setData({
          type: "FeatureCollection",
          features,
        });
        map.current.on("mousemove", layerId, (e) => {
          const feature = e.features[0];
          const _uid = feature.properties._uid;

          // If already hovered, do nothing
          if (hoveredFeature === _uid) return;

          // Reset previous highlight
          if (lastHighlightLayerId && map.current.getLayer(lastHighlightLayerId)) {
            map.current.setFilter(lastHighlightLayerId, ["==", "_uid", ""]);
          }

          hoveredFeature = _uid;
          lastHighlightLayerId = highlightLayerId;

          map.current.getCanvas().style.cursor = "pointer";

          // Set new highlight
          map.current.setFilter(highlightLayerId, ["==", "_uid", _uid]);

          const props = feature.properties;
          const content = `
            <strong>${props.municipality}</strong><br/>
            Municipality Code: ${props.municipality_code}<br/>
            Region: ${props.region}<br/>
            ${props.population ? `Population: ${props.population}<br/>` : ""}
            ${props.density ? `Density: ${props.density}` : ""}
            
          `;

          popup.setLngLat(e.lngLat).setHTML(content).addTo(map.current);
        });

        map.current.on("mouseleave", layerId, () => {
          map.current.getCanvas().style.cursor = "";
          popup.remove();

          if (lastHighlightLayerId && map.current.getLayer(lastHighlightLayerId)) {
            map.current.setFilter(lastHighlightLayerId, ["==", "_uid", ""]);
          }

          hoveredFeature = null;
          lastHighlightLayerId = null;
        });
      }
    });

    return () => {
      popup.remove();
    };
  }, [populationData]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}
