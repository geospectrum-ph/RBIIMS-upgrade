import React from "react";
import "./index.css";
import Logo from "../../assets/logo_rbiims.png";
import { LayoutContext } from "../../context/LayoutContext";

function Header() {

  const {page, setPage} = React.useContext(LayoutContext)

  return (
    <>
      <div className="header">
        <a href="#" className="logo">
          <img src={Logo} alt="Company Logo" width="220" />
        </a>
        <div className="header-right">
          <a className={page === "database" ? "active" : ""} href="#home" onClick={()=>setPage("database")}>
            Database
          </a>
          {/* <a className={page === "analytics" ? "active" : ""} onClick={()=>setPage("analytics")}>Analytics</a> */}
        </div>
      </div>
    </>
  );
}

export default Header;
