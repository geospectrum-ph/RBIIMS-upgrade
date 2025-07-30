// drawer-a.js
import React, { useState } from "react";
import "./index.css";
import { MapContext } from "../../context/MapContext";

function DrawerA() {
  const [isOpen, setIsOpen] = useState(true);
  const { visibleLayers, setVisibleLayers, ANA_GROUPS, fetchForestData, fetchPopulationData } = React.useContext(MapContext);

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

  const renderSubGroups = (subGroups, level = 0, isTopLevel = false) => {
    return subGroups.map((subGroup, subIndex) => (
      <li key={`subgroup-${level}-${subIndex}`} className="dropdown">
        <details>
          <summary>{isTopLevel ? <b>{subGroup.title}</b> : subGroup.title}</summary>
          <ul className={`nested-checkboxes level-${level}`}>
            {subGroup.layers.map((layer) => renderLayerItem(layer, subGroup.value))}
            {subGroup.subGroups && renderSubGroups(subGroup.subGroups, level + 1)}
          </ul>
        </details>
      </li>
    ));
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <span className="sidebar-title">Analytics</span>
        <span className="toggle-icon">{isOpen ? "×" : "☰"}</span>
      </button>
      <div className="sidebar-content">
        {ANA_GROUPS.map((group, index) => (
          <React.Fragment key={index}>
            <p className="sub-category">{group.title}</p>
            <nav className="sidebar-nav">
              <ul>
                {group.layers.filter((layer) => !group.subGroups?.some((subGroup) => subGroup.layers.includes(typeof layer === "string" ? layer : layer.id))).map(renderLayerItem)}

                {group.subGroups && renderSubGroups(group.subGroups, 0, true)}
              </ul>
            </nav>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default DrawerA;
