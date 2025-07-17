import React from "react";
import Header from "./header/index";
import Drawer from './drawer-db/index';
import MainContent from './main/index';
import "./index.css"; 
import { LayoutContext } from "../context/LayoutContext";
import DrawerA from "./drawer-a";

function Layout() {
  const {page} = React.useContext(LayoutContext)
  return (
    <div className="app-container">
      <Header />
      <div className="content-wrapper">
        {page === "database" ? <Drawer />: <DrawerA/> }
        <MainContent />
      </div>
    </div>
  );
}

export default Layout;