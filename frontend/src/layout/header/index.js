import React, { useState } from "react";
import "./index.css";
import Logo from "../../assets/logo_rbiims.png";
import { LayoutContext } from "../../context/LayoutContext";
import { MapContext } from "../../context/MapContext";

function Header() {
  const { page, setPage } = React.useContext(LayoutContext);
  const { uploadShapefile, LAYER_GROUPS, selectedGroup, setSelectedGroup } = React.useContext(MapContext);
  const [files, setFiles] = useState(null);
  const [layerName, setLayerName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const shpFile = selectedFiles.find((f) => f.name.endsWith(".shp"));

    if (!shpFile) {
      setMessage({ text: "Please include a .shp file", type: "error" });
      return;
    }

    setFiles(selectedFiles);
    setLayerName(shpFile.name.replace(".shp", ""));
    setMessage({ text: `${selectedFiles.length} files selected`, type: "info" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files || !layerName || !groupName) {
      setMessage({ text: "Please fill all fields", type: "error" });
      return;
    }

    setIsUploading(true);
    setMessage({ text: "Uploading...", type: "info" });

    try {
      const result = await uploadShapefile(files, layerName, groupName);
      if (result.success) {
        setMessage({ text: "Upload successful!", type: "success" });
        setFiles(null);
        setLayerName("");
        document.getElementById("shapefile-upload").value = "";
      } else {
        setMessage({ text: `Upload failed: ${result.error}`, type: "error" });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };
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
  <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Shapefile (.shp, .dbf, .prj)</label>
          <input
            type="file"
            id="shapefile-upload"
            multiple
            accept=".shp,.dbf,.prj"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        
        <div className="form-group">
          <label>Layer Name</label>
          <input
            type="text"
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
            disabled={isUploading}
            required
          />

          <label>Group</label>
          <select
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={isUploading}
            required
          >
            <option value="">Select a group</option>
            {LAYER_GROUPS.map(group => (
              <option key={group.title} value={group.title}>{group.title}</option>
            ))}
          </select>
                  <button type="submit" disabled={isUploading || !files || !layerName || !groupName}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
        </div>
        

      </form>
      </div>
    </>
  );
}

export default Header;
