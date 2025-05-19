import React, { useState } from "react";
import "./index.css";

function Drawer() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle("sidebar-open", !isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <span className="sidebar-title">Database</span>
        <span className="toggle-icon">{isOpen ? "×" : "☰"}</span>
      </button>
      
      <div className="sidebar-content">
        <p className="sub-category">Hydrological Data</p>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <input type="checkbox" id="watershed-critical" name="watershed" value="critical" />
              <label htmlFor="watershed-critical">Critical Watershed</label>
            </li>
            <li>
              <input type="checkbox" id="watershed-proclaimed" name="watershed" value="proclaimed" />
              <label htmlFor="watershed-proclaimed">Proclaimed Watershed</label>
            </li>
            <li>
              <input type="checkbox" id="river-basin" name="watershed" value="river-basin" />
              <label htmlFor="river-basin">Major River Basin</label>
            </li>
          </ul>
        </nav>

        <p className="sub-category">Administrative Boundaries</p>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <input type="checkbox" id="boundary-national" name="boundary" value="national" />
              <label htmlFor="boundary-national">National Boundaries</label>
            </li>
            <li>
              <input type="checkbox" id="boundary-regional" name="boundary" value="regional" />
              <label htmlFor="boundary-regional">Regional Boundaries</label>
            </li>
            <li>
              <input type="checkbox" id="boundary-provincial" name="boundary" value="provincial" />
              <label htmlFor="boundary-provincial">Provincial Boundaries</label>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Drawer;