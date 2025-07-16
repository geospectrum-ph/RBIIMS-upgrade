import React, { useState } from "react";
import "./index.css";
import axios from "axios";
import Map from "../../components/map";
import { MapContext } from "../../context/MapContext";

function Main() {
  const {visibleLayers} = React.useContext(MapContext)
   return (
    <main className="main-content">
      {/* <h1>RBIIMS</h1>
      <p>Test: Retrieved from the database </p>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
      <Map visibleLayers={visibleLayers}/>
    </main>
  );
}

export default Main;
