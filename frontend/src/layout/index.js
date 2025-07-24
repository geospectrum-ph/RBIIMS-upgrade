import React from "react";
import Header from "./header/index";
import Drawer from './drawer-db/index';
import MainContent from './main/index';
import "./index.css"; 
import { LayoutContext } from "../context/LayoutContext";
import DrawerA from "./drawer-a";

function Layout() {
  const {page} = React.useContext(LayoutContext)
    const [isLoading, setIsLoading] = React.useState(true);

   React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); 
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }


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