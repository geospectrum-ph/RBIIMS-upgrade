import React, { useState, useEffect } from "react";
import "./index.css";
import { MapContext } from "../../context/MapContext";

function Drawer() {
  const [isOpen, setIsOpen] = useState(true);
  const { 
    uploadedLayers, 
    fetchUploadedLayers, 
    visibleLayers, 
    setVisibleLayers, 
    LAYER_GROUPS, 
    moveLayerUp, 
    moveLayerDown, 
    VECTOR_LAYERS 
  } = React.useContext(MapContext);

  // Fetch uploaded layers on component mount
  useEffect(() => {
    fetchUploadedLayers();
  }, []);

  // Group uploaded layers by their group name
  const groupedUploadedLayers = uploadedLayers.reduce((acc, layer) => {
    if (!acc[layer.group]) {
      acc[layer.group] = [];
    }
    acc[layer.group].push(layer);
    return acc;
  }, {});

  // Get all visible layers with their metadata
  const visibleLayersList = React.useMemo(() => {
    const baseLayers = Object.entries(visibleLayers)
      .filter(([_, isVisible]) => isVisible)
      .map(([layerId]) => {
        const vectorLayer = VECTOR_LAYERS.find((l) => l.id === layerId);
        if (vectorLayer) return { id: layerId, label: vectorLayer.label || layerId };

        const [prefix, suffix] = layerId.split("-");
        const baseLayer = VECTOR_LAYERS.find((l) => l.id === prefix);
        if (baseLayer) return { id: layerId, label: `${baseLayer.label || prefix} - ${suffix}` };

        return { id: layerId, label: layerId };
      });

    // Include uploaded layers that are visible
    const uploadedVisible = uploadedLayers
      .filter(layer => visibleLayers[layer.id])
      .map(layer => ({ id: layer.id, label: layer.label }));

    return [...baseLayers, ...uploadedVisible];
  }, [visibleLayers, VECTOR_LAYERS, uploadedLayers]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("sidebar-open", !isOpen);
  };

  const handleLayerToggle = (layerId, isChecked) => {
    console.log(layerId, isChecked)
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
        <input 
          type="checkbox" 
          id={layerId} 
          checked={visibleLayers[layerId] || false} 
          onChange={(e) => handleLayerToggle(layerId, e.target.checked)} 
        />
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
                          <ul className="nested-subgroup-content">
                            {nestedSubGroup.layers?.map((layer) => renderLayerItem(layer, nestedSubGroup.value))}
                          </ul>
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

  const renderUploadedLayersSection = () => {
    if (uploadedLayers.length === 0) return null;

    return (
      <div className="uploaded-layers-section">
        <h3>Uploaded Data</h3>
        {Object.entries(groupedUploadedLayers).map(([groupName, layers]) => (
          <div key={`uploaded-${groupName}`} className="group-container">
            <details>
              <summary className="group-title">{groupName} (Uploaded)</summary>
              <ul className="group-content">
                {layers.map(layer => (
                  <li key={layer.id}>
                    <input
                      type="checkbox"
                      id={layer.id}
                      checked={visibleLayers[layer.id] || false}
                      onChange={(e) => handleLayerToggle(layer.id, e.target.checked)}
                    />
                    <label htmlFor={layer.id}>{layer.label}</label>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
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
        {LAYER_GROUPS.map(renderGroup)}
        {renderUploadedLayersSection()}
        
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