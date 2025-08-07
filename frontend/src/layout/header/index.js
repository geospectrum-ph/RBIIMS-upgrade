import React, { useState } from "react";
import "./index.css";
import Logo from "../../assets/logo_rbiims.png";
import { LayoutContext } from "../../context/LayoutContext";
import { MapContext } from "../../context/MapContext";

function Header() {
  const { page, setPage } = React.useContext(LayoutContext);

  return (
    <>
      <div className="header">
        <a href="#" className="logo">
          <img src={Logo} alt="Company Logo" width="220" />
        </a>
        <div className="header-right">
          <a className={page === "database" ? "active" : ""} href="#home" onClick={() => setPage("database")}>
            Database
          </a>

          {/* <a className={page === "analytics" ? "active" : ""} onClick={console.log(visibleLayers)}>Analytics</a> */}
        </div>
      </div>
    </>
  );
}

export default Header;
