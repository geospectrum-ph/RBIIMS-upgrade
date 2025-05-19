import React from "react";
import Header from "./header/index";
import Drawer from './drawer/index';
import MainContent from './main/index';
import "./index.css"; 

function Layout() {
  return (
    <div className="app-container">
      <Header />
      <div className="content-wrapper">
        <Drawer />
        <MainContent />
      </div>
    </div>
  );
}

export default Layout;