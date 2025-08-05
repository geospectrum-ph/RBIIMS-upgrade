import React, { useState } from "react";
import "./index.css";
import { MapContext } from "../../context/MapContext";

function Drawer() {
  const [isOpen, setIsOpen] = useState(true);
  const { visibleLayers, setVisibleLayers, LAYER_GROUPS, fetchForestData, fetchPopulationData } = React.useContext(MapContext);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("sidebar-open", !isOpen);
  };

  const handleLayerToggle = (layerId, isChecked, parentValue = null) => {
    const fullLayerId = parentValue ? `${parentValue}-${layerId}` : layerId;
    
    // Handle special cases
    if (parentValue === "FOREST_LOSS") {
      fetchForestData(layerId, "2022"); // Default year or let user select
    } else if (parentValue === "POP_MAY202" || parentValue === "PopDensity") {
      fetchPopulationData(parentValue, layerId);
    }

    setVisibleLayers((prev) => ({
      ...prev,
      [fullLayerId]: isChecked,
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
          onChange={(e) => handleLayerToggle(layerObj.id, e.target.checked, parentValue)} 
        />
        <label htmlFor={layerId}>{layerObj.label}</label>
      </li>
    );
  };

  const renderGroup = (group, level = 0) => {
    return (
      <div key={group.title} className="group-container">
        <details open={level === 0}>
          <summary className="group-title">{group.title}</summary>
          <ul className="group-content">
            {/* Render layers that are directly in the group */}
            {group.layers?.map(layer => renderLayerItem(layer))}
            
            {/* Render subgroups */}
            {group.subGroups?.map((subGroup) => (
              <li key={subGroup.title} className="subgroup">
                <details>
                  <summary className="subgroup-title">{subGroup.title}</summary>
                  <ul className="subgroup-content">
                    {/* Render layers in subgroup */}
                    {subGroup.layers?.map(layer => 
                      renderLayerItem(layer, subGroup.value || subGroup.title)
                    )}
                    
                    {/* Render nested subgroups */}
                    {subGroup.subGroups?.map((nestedSubGroup) => (
                      <li key={nestedSubGroup.title} className="nested-subgroup">
                        <details>
                          <summary className="nested-subgroup-title">{nestedSubGroup.title}</summary>
                          <ul className="nested-subgroup-content">
                            {nestedSubGroup.layers?.map(layer => 
                              renderLayerItem(layer, subGroup.value || subGroup.title)
                            )}
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

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <span className="sidebar-title">Layers</span>
        <span className="toggle-icon">{isOpen ? "×" : "☰"}</span>
      </button>
      <div className="sidebar-content">
        {LAYER_GROUPS.map(group => renderGroup(group))}
      </div>
    </div>
  );
}

export default Drawer;