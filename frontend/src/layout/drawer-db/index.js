import React, { useState } from "react";
import "./index.css";
import { MapContext } from "../../context/MapContext";

function Drawer() {
  const [isOpen, setIsOpen] = useState(true);
  const { visibleLayers, setVisibleLayers, LAYER_GROUPS, fetchForestData, fetchPopulationData, moveLayerUp, moveLayerDown, VECTOR_LAYERS } = React.useContext(MapContext);

  // Get all visible layers with their metadata
  const visibleLayersList = React.useMemo(() => {
    return Object.entries(visibleLayers)
      .filter(([_, isVisible]) => isVisible)
      .map(([layerId]) => {
        // Find layer details from VECTOR_LAYERS or LAYER_GROUPS
        const vectorLayer = VECTOR_LAYERS.find((l) => l.id === layerId);
        if (vectorLayer) return { id: layerId, label: vectorLayer.label || layerId };

        // Check if it's a composite ID (like "POP_MAY202-REGION I")
        const [prefix, suffix] = layerId.split("-");
        const baseLayer = VECTOR_LAYERS.find((l) => l.id === prefix);
        if (baseLayer) return { id: layerId, label: `${baseLayer.label || prefix} - ${suffix}` };

        return { id: layerId, label: layerId };
      });
  }, [visibleLayers, VECTOR_LAYERS]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("sidebar-open", !isOpen);
  };

  const handleLayerToggle = (layerIdRaw, isChecked, parentValue = null) => {
    const layerId = parentValue ? `${parentValue}-${layerIdRaw}` : layerIdRaw;

    // Handle forest data
    if (layerIdRaw.match(/^\d{4}$/) && parentValue) {
      fetchForestData(parentValue, layerIdRaw);
    } else if (parentValue && (parentValue === "POP_MAY202" || parentValue === "PopDensity")) {
      fetchPopulationData(parentValue, layerIdRaw);
    }

    setVisibleLayers((prev) => ({
      ...prev,
      [layerId]: isChecked,
    }));
  };

  const renderLayerItem = (layer, parentValue = null) => {
    const layerObj = typeof layer === "string" ? { id: layer, label: layer } : layer;
    const layerId = parentValue ? `${parentValue}-${layerObj.id}` : layerObj.id;

    return (
      <li key={layerId}>
        <input type="checkbox" id={layerId} checked={visibleLayers[layerId] || false} onChange={(e) => handleLayerToggle(layerObj.id, e.target.checked, parentValue)} />
        <label htmlFor={layerId}>{layerObj.label}</label>
      </li>
    );
  };

  const renderSubGroups = (subGroups, level = 0) => {
    return subGroups.map((subGroup, subIndex) => (
      <li key={`subgroup-${level}-${subIndex}`} className="dropdown">
        <details>
          <summary>{subGroup.title}</summary>
          <ul className={`nested-checkboxes level-${level}`}>
            {subGroup.layers?.map((layer) => renderLayerItem(layer, subGroup.value))}
            {subGroup.subGroups && renderSubGroups(subGroup.subGroups, level + 1)}
          </ul>
        </details>
      </li>
    ));
  };

  const renderGroup = (group) => {
    return (
      <div key={group.title} className="group-container">
        <details>
          <summary className="group-title">{group.title}</summary>
          <ul className="group-content">
            {group.layers?.map((layer) => renderLayerItem(layer))}

            {/* Render subgroups */}
            {group.subGroups?.map((subGroup) => (
              <li key={subGroup.title} className="subgroup">
                <details>
                  <summary className="subgroup-title">{subGroup.title}</summary>
                  <ul className="subgroup-content">
                    {subGroup.layers?.map((layer) => renderLayerItem(layer, subGroup.value))}

                    {subGroup.subGroups?.map((nestedSubGroup) => (
                      <li key={nestedSubGroup.title} className="nested-subgroup">
                        <details>
                          <summary className="nested-subgroup-title">{nestedSubGroup.title}</summary>
                          <ul className="nested-subgroup-content">{nestedSubGroup.layers?.map((layer) => renderLayerItem(layer, nestedSubGroup.value))}</ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <span className="sidebar-title">Database & Analytics</span>
        <span className="toggle-icon">{isOpen ? "×" : "☰"}</span>
      </button>
      <div className="sidebar-content">
        {/* Existing layer groups */}
        {LAYER_GROUPS.map(renderGroup)}
        
        {/* Visible layers section */}
        <div className="visible-layers-section">
          <h3>Visible Layers</h3>
          <ul className="visible-layers-list">
            {visibleLayersList.length > 0 ? (
              visibleLayersList.map((layer, index) => (
                <li key={layer.id} className="visible-layer-item">
                  <span>{layer.label}</span>
                  <div className="layer-controls">
                    <button 
                      onClick={() => moveLayerUp(layer.id)}
                      disabled={index === 0}
                      title="Move layer up"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveLayerDown(layer.id)}
                      disabled={index === visibleLayersList.length - 1}
                      title="Move layer down"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => handleLayerToggle(layer.id, false)}
                      title="Hide layer"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="no-layers-message">No visible layers</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Drawer;
