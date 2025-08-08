import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MaplibreLegendControl } from "@watergis/maplibre-gl-legend";
import "@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css";
import "./index.css";
import { MapContext } from "../../context/MapContext";
import { LayoutContext } from "../../context/LayoutContext";
import LoadingIndicator from "../../services/LoadingIndicator";
import UploadModal from "../upload";
import EditModal from "../edit";

export default function Map({ visibleLayers }) {
  const [riverBasin, setRiverBasin] = React.useState([]);
  const [roadNetworks, setRoadNetworks] = React.useState([]);
  const [forestCover, setForestCover] = React.useState([]);
  const [isMapLoading, setIsMapLoading] = React.useState(false);
  const { setDatasets, fetchDatasets, datasets, DATASET_TABLES, VECTOR_LAYERS, MAP_STYLE, forestCoverData, populationData, setMapInstance, uploadedLayers, showModal, setShowModal, showModalEdit, setShowModalEdit } = React.useContext(MapContext);
  const { page } = React.useContext(LayoutContext);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const lng = 121.9822;
  const lat = 12.6042;
  const zoom = 5.5;
  // const API_KEY = 'YOUR_MAPTILER_API_KEY_HERE';

  // Upload shapefile tooltip
  class UploadControl {
    constructor(onClick) {
      this.onClick = onClick;
    }

    onAdd(map) {
      this._map = map;
      this._container = document.createElement("div");
      this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";
      this._container.innerHTML = `<button title="Upload Shapefile" style="font-size: 18px;">📁</button>`;
      this._container.onclick = this.onClick;
      return this._container;
    }

    onRemove() {
      this._container.remove();
      this._map = undefined;
    }
  }
  // Edit DB tooltip
  class EditControl {
    constructor(onClick) {
      this.onClick = onClick;
    }

    onAdd(map) {
      this._map = map;
      this._container = document.createElement("div");
      this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";
      this._container.innerHTML = `<button title="Edit Data" style="font-size: 18px;">✎</button>`;
      this._container.onclick = this.onClick;
      return this._container;
    }

    onRemove() {
      this._container.remove();
      this._map = undefined;
    }
  }

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

  // function for popup content (from geoserver)
  function formatProperties(props) {
    if (!props) return "No properties";

    return Object.entries(props)
      .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
      .join("<br/>");
  }

  // function for popup content (Uplaoded layers)
  function formatPopupContent(layerId, feature) {
    const properties = feature.properties;
    let content = `<h3>${layerId}</h3><table>`;
    // Add geometry type
    content += `<tr><td><strong>Geometry</strong></td><td>${feature.geometry.type}</td></tr>`;
    // Add all properties
    for (const [key, value] of Object.entries(properties)) {
      content += `<tr><td><strong>${key}</strong></td><td>${value !== null ? value : "NULL"}</td></tr>`;
    }
    return content + `</table>`;
  }

  // Database page map initialization
  useEffect(() => {
    if (map.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: zoom,
    });

    map.current = mapInstance;
    setMapInstance(mapInstance);

    map.current.on("load", () => {
      // Map controls
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");
      map.current.addControl(new maplibregl.FullscreenControl(), "top-right");
      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "top-right"
      );
      map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: "metric" }), "bottom-left");
      map.current.addControl(new UploadControl(() => setShowModal(true)), "top-right");
      map.current.addControl(new EditControl(() => setShowModalEdit(true)), "top-right");

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
        console.log(layerConfig);
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
      setMapInstance(null); // Clean up
    };
  }, [lng, lat, zoom]);

  // Render uploaded layers to Map
  useEffect(() => {
    if (!map.current || !uploadedLayers.length) return;

    let loadingCount = uploadedLayers.length;
    setIsMapLoading(true);

    const checkFinishLoading = () => {
      loadingCount -= 1;
      if (loadingCount <= 0) {
        setIsMapLoading(false);
      }
    };

    const fetchAndAddLayer = async (layer) => {
      const sourceId = layer.source;
      const layerId = layer.id;

      try {
        // Wait for style to load if needed
        if (!map.current.isStyleLoaded()) {
          await new Promise((resolve) => map.current.once("styledata", resolve));
        }

        const response = await fetch(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/uploaded-layer/${layerId}`);
        const geojsonData = await response.json();

        if (!geojsonData.features || !geojsonData.features.length) {
          console.warn(`No features found in layer ${layerId}`);
          return;
        }

        // Determine layer type from first feature's geometry
        const firstFeature = geojsonData.features[0];
        let layerType;
        let paintConfig = {};

        switch (firstFeature.geometry.type) {
          case "Point":
          case "MultiPoint":
            layerType = "circle";
            paintConfig = {
              "circle-radius": 6,
              "circle-color": "#068881ff",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff",
            };
            break;
          case "LineString":
          case "MultiLineString":
            layerType = "line";
            paintConfig = {
              "line-color": "#FF5722",
              "line-width": 2,
            };
            break;
          case "Polygon":
          case "MultiPolygon":
            layerType = "fill";
            paintConfig = {
              "fill-color": "#888888",
              "fill-opacity": 0.7,
              "fill-outline-color": "#000",
            };
            break;
          default:
            layerType = "circle";
            paintConfig = {
              "circle-radius": 3,
              "circle-color": "#0981b1ff",
            };
        }

        // Remove existing layer if present
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }

        // Add new source and layer
        map.current.addSource(sourceId, {
          type: "geojson",
          data: geojsonData,
        });

        map.current.addLayer({
          id: layerId,
          type: layerType,
          source: sourceId,
          paint: paintConfig,
          layout: {
            visibility: visibleLayers[layerId] ? "visible" : "none",
          },
        });

        // Wait until the source reports it’s fully loaded
        const onSourceData = (e) => {
          if (e.sourceId === sourceId && e.isSourceLoaded && map.current.getSource(sourceId)?.loaded?.()) {
            map.current.off("sourcedata", onSourceData);
            checkFinishLoading();
          }
        };

        map.current.on("sourcedata", onSourceData);

        // Add interactivity
        map.current.on("click", layerId, (e) => {
          const feature = e.features[0];
          if (!feature) return;

          new maplibregl.Popup().setLngLat(e.lngLat).setHTML(formatPopupContent(layerId, feature)).addTo(map.current);
        });

        map.current.on("mouseenter", layerId, () => {
          map.current.getCanvas().style.cursor = "pointer";
        });

        map.current.on("mouseleave", layerId, () => {
          map.current.getCanvas().style.cursor = "";
        });
      } catch (error) {
        console.error(`Error loading layer ${layerId}:`, error);
      }
    };

    // Process each uploaded layer
    uploadedLayers.forEach(fetchAndAddLayer);

    // Cleanup function
    return () => {
      uploadedLayers.forEach((layer) => {
        if (map.current) {
          if (map.current.getLayer(layer.id)) {
            map.current.removeLayer(layer.id);
          }
          if (map.current.getSource(layer.source)) {
            map.current.removeSource(layer.source);
          }
          // Remove event listeners
          map.current.off("click", layer.id);
          map.current.off("mouseenter", layer.id);
          map.current.off("mouseleave", layer.id);
        }
      });
    };
  }, [uploadedLayers, visibleLayers]);

  //  uploaded layers
  useEffect(() => {
    if (!map.current) return;

    // Add click handler for uploaded layers
    uploadedLayers.forEach((layer) => {
      if (!map.current.getLayer(layer.id)) return;

      map.current.on("click", layer.id, (e) => {
        const feature = e.features[0];
        if (!feature) return;

        const properties = feature.properties;
        let content = `<h3>${layer.name}</h3><table>`;

        // Add geometry type
        content += `<tr><td><strong>Geometry</strong></td><td>${feature.geometry.type}</td></tr>`;

        // Add all properties as table rows
        for (const [key, value] of Object.entries(properties)) {
          content += `<tr><td><strong>${key}</strong></td><td>${value !== null ? value : "NULL"}</td></tr>`;
        }

        content += `</table>`;

        new maplibregl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map.current);
      });

      // Change cursor on hover
      map.current.on("mouseenter", layer.id, () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", layer.id, () => {
        map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      // Clean up event listeners
      uploadedLayers.forEach((layer) => {
        if (map.current) {
          map.current.off("click", layer.id);
          map.current.off("mouseenter", layer.id);
          map.current.off("mouseleave", layer.id);
        }
      });
    };
  }, [uploadedLayers]);

  // Forest Cover Loss
  useEffect(() => {
    if (!map.current) return;

    Object.entries(forestCoverData).forEach(([key, features]) => {
      const [region, year] = key.split("-");
      const sourceId = `forest-loss-${region}-${year}`;
      const layerId = `forest-loss-layer-${region}-${year}`;

      if (map.current.getSource(sourceId)) {
        map.current.getSource(sourceId).setData({
          type: "FeatureCollection",
          features,
        });
      } else {
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
          paint: VECTOR_LAYERS.find((l) => l.id === "FOREST_LOSS").paint,
        });

        map.current.addLayer({
          id: `${layerId}-points`,
          type: "circle",
          source: sourceId,
          minzoom: 10,
          paint: VECTOR_LAYERS.find((l) => l.id === "FOREST_LOSS_POINTS").paint,
        });
      }
    });
  }, [forestCoverData]);

  // Population
  useEffect(() => {
    if (!map.current) return;

    Object.entries(populationData).forEach(([key, features]) => {
      const [dataType, region] = key.split("-");
      const sourceId = `population-${dataType}-${region}`;
      const layerId = `population-layer-${dataType}-${region}`;

      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features,
          },
        });

        const paintConfig = dataType === "POP_MAY202" ? VECTOR_LAYERS.find((l) => l.id === "POP_MAY202").paint : VECTOR_LAYERS.find((l) => l.id === "PopDensity").paint;

        map.current.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: paintConfig,
        });
      } else {
        map.current.getSource(sourceId).setData({
          type: "FeatureCollection",
          features,
        });
      }
    });
  }, [populationData]);

  // handles visibleLayers changes RASTER and the datasets fetch from the database
  useEffect(() => {
    if (!map.current) return;

    setIsMapLoading(true);
    map.current.on("dataloading", (e) => {
      if (e.dataType === "source" && e.sourceDataType === "tile") {
        setIsMapLoading(true);
      }
    });

    map.current.on("idle", () => {
      setIsMapLoading(false);
    });

    // Function to add interactivity to a layer
    const addInteractivity = (layerId) => {
      // Remove existing event listeners to avoid duplicates
      map.current.off("click", layerId);
      map.current.off("mouseenter", layerId);
      map.current.off("mouseleave", layerId);

      // Add new interactivity
      map.current.on("click", layerId, (e) => {
        const feature = e.features[0];
        if (!feature) return;

        new maplibregl.Popup().setLngLat(e.lngLat).setHTML(formatPopupContent(layerId, feature)).addTo(map.current);
      });

      map.current.on("mouseenter", layerId, () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", layerId, () => {
        map.current.getCanvas().style.cursor = "";
      });
    };

    const updateLayers = async () => {
      // First handle all visibility updates
      VECTOR_LAYERS.forEach(({ id, mapLayerId }) => {
        if (map.current.getLayer(mapLayerId)) {
          map.current.setLayoutProperty(mapLayerId, "visibility", visibleLayers[id] ? "visible" : "none");
          // Add interactivity when layer is visible
          if (visibleLayers[id]) {
            addInteractivity(mapLayerId);
          }
        }
      });

      // Handle raster layers
      if (map.current.getLayer("twi-layer")) {
        map.current.setLayoutProperty("twi-layer", "visibility", visibleLayers["twi"] ? "visible" : "none");
      }
      if (map.current.getLayer("slope-layer")) {
        map.current.setLayoutProperty("slope-layer", "visibility", visibleLayers["slope"] ? "visible" : "none");
      }
      if (map.current.getLayer("hillshade-layer")) {
        map.current.setLayoutProperty("hillshade-layer", "visibility", visibleLayers["hillshade"] ? "visible" : "none");
      }

      // Handle special layers
      Object.entries(visibleLayers).forEach(([layerId, isVisible]) => {
        if (layerId.startsWith("POP_MAY202-") || layerId.startsWith("PopDensity-")) {
          const [dataType, region] = layerId.split("-");
          const layerIdToShow = `population-layer-${dataType}-${region}`;

          if (map.current.getLayer(layerIdToShow)) {
            map.current.setLayoutProperty(layerIdToShow, "visibility", isVisible ? "visible" : "none");
          }
        }

        if (layerId.includes("-") && layerId.split("-")[1].match(/^\d{4}$/)) {
          const [region, year] = layerId.split("-");
          const baseLayerId = `forest-loss-layer-${region}-${year}`;

          if (map.current.getLayer(baseLayerId)) {
            map.current.setLayoutProperty(baseLayerId, "visibility", isVisible ? "visible" : "none");
            map.current.setLayoutProperty(`${baseLayerId}-points`, "visibility", isVisible ? "visible" : "none");
            if (isVisible) {
              addInteractivity(baseLayerId);
              addInteractivity(`${baseLayerId}-points`);
            }
          }
        }
      });

      // Handle data loading for dataset table layers
      for (const { id, mapLayerId } of VECTOR_LAYERS) {
        console.log(DATASET_TABLES[id])
        if (DATASET_TABLES[id] && visibleLayers[id] && (!datasets[id] || datasets[id].features.length === 0)) {
          try {
            const data = await fetchDatasets(id);
            const sourceId = `${id}Source`;

            setDatasets((prev) => ({
              ...prev,
              [id]: data,
            }));

            if (map.current.getSource(sourceId)) {
              map.current.getSource(sourceId).setData(data);
            } else {
              map.current.addSource(sourceId, {
                type: "geojson",
                data: data,
              });
            }

            if (!map.current.getLayer(mapLayerId)) {
              map.current.addLayer({
                id: mapLayerId,
                type: VECTOR_LAYERS.find((l) => l.id === id)?.type || "circle",
                source: sourceId,
                layout: {
                  visibility: "visible",
                },
                paint: VECTOR_LAYERS.find((l) => l.id === id)?.paint || {},
              });
            }

            // Add interactivity after layer is added/updated
            addInteractivity(mapLayerId);
          } catch (error) {
            console.error(`Failed to load dataset table layer ${id}:`, error);
          }
        }
      }
    };

    updateLayers();

    // Cleanup function to remove event listeners
    return () => {
      if (map.current) {
        // Remove all interactivity event listeners
        VECTOR_LAYERS.forEach(({ mapLayerId }) => {
          map.current.off("click", mapLayerId);
          map.current.off("mouseenter", mapLayerId);
          map.current.off("mouseleave", mapLayerId);
        });

        // Remove special layer listeners
        Object.keys(visibleLayers).forEach((layerId) => {
          if (layerId.includes("-") && layerId.split("-")[1].match(/^\d{4}$/)) {
            const [region, year] = layerId.split("-");
            const baseLayerId = `forest-loss-layer-${region}-${year}`;
            map.current.off("click", baseLayerId);
            map.current.off("mouseenter", baseLayerId);
            map.current.off("mouseleave", baseLayerId);
            map.current.off("click", `${baseLayerId}-points`);
            map.current.off("mouseenter", `${baseLayerId}-points`);
            map.current.off("mouseleave", `${baseLayerId}-points`);
          }
        });
      }
    };
  }, [visibleLayers, datasets]);

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
  }, [populationData, datasets]);

  useEffect(() => {
    if (!map.current) return;

    // Update all dataset sources when datasets change
    Object.entries(datasets).forEach(([layerId, data]) => {
      const sourceId = `${layerId}Source`;

      if (map.current.getSource(sourceId)) {
        map.current.getSource(sourceId).setData(data);
      } else if (data.features && data.features.length > 0) {
        // Only add source if we have data
        map.current.addSource(sourceId, {
          type: "geojson",
          data: data,
        });

        // Add layer if it doesn't exist
        const layerConfig = VECTOR_LAYERS.find((l) => l.id === layerId);
        if (layerConfig && !map.current.getLayer(layerConfig.mapLayerId)) {
          map.current.addLayer({
            id: layerConfig.mapLayerId,
            type: layerConfig.type,
            source: sourceId,
            layout: {
              visibility: "none",
            },
            paint: layerConfig.paint,
          });
        }
      }
    });
  }, [datasets]);
  return (
    <>
      <div className="map-wrap">
        {isMapLoading && <LoadingIndicator />}
        <div ref={mapContainer} className="map" />
      </div>
      {showModal && <UploadModal />}
      {showModalEdit && <EditModal />}
    </>
  );
}
