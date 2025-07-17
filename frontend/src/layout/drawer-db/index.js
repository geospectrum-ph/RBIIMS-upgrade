import React, { useState } from "react";
import "./index.css";
import { MapContext } from "../../context/MapContext";

function Drawer() {
  const [isOpen, setIsOpen] = useState(true);
  const {visibleLayers, setVisibleLayers, LAYER_GROUPS} = React.useContext(MapContext)

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("sidebar-open", !isOpen);
  };

  const handleLayerToggle = (layerId, isChecked) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerId]: isChecked,
    }));
  };

  const renderLayerItem = (layer) => {
    const layerObj = typeof layer === "string" ? { id: layer, label: layer } : layer;

    return (
      <li key={layerObj.id}>
        <input type="checkbox" id={layerObj.id} checked={visibleLayers[layerObj.id]} onChange={(e) => handleLayerToggle(layerObj.id, e.target.checked)} />
        <label htmlFor={layerObj.id}>{layerObj.label}</label>
      </li>
    );
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <span className="sidebar-title">Database</span>
        <span className="toggle-icon">{isOpen ? "×" : "☰"}</span>
      </button>
      <div className="sidebar-content">
            {LAYER_GROUPS.map((group, index) => (
              <React.Fragment key={index}>
                <p className="sub-category">{group.title}</p>
                <nav className="sidebar-nav">
                  <ul>
                    {group.layers.filter((layer) => !group.subGroups?.some((subGroup) => subGroup.layers.includes(typeof layer === "string" ? layer : layer.id))).map(renderLayerItem)}

                    {group.subGroups?.map((subGroup, subIndex) => (
                      <li key={`subgroup-${subIndex}`} className="dropdown">
                        <details>
                          <summary><b>{subGroup.title}</b></summary>
                          <ul className="nested-checkboxes">
                            {subGroup.layers.map((layerId) => {
                              const layer = group.layers.find((l) => (typeof l === "string" ? l === layerId : l.id === layerId));
                              return renderLayerItem(layer || layerId);
                            })}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </nav>
              </React.Fragment>
            ))}
          </div>

    </div>
  );
}

export default Drawer;