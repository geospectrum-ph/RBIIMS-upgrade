import React from "react";
import "./index.css";
import Logo from "../../assets/logo_rbiims.png";

function Header() {
  return (
    <>
      <div className="header">
        <a href="http://localhost:49928/" className="logo">
          <img src={Logo} alt="Company Logo" width="220" />
        </a>
        <div className="header-right">
          <a className="active" href="#home">
            Database
          </a>
          <a href="#">Analytics</a>
        </div>
      </div>
    </>
  );
}

export default Header;
