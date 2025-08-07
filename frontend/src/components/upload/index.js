import React, { useState, useContext } from "react";
import { MapContext } from "../../context/MapContext";
import "./index.css";

function UploadModal() {
  const { uploadShapefile, LAYER_GROUPS, setShowModal } = useContext(MapContext);

  const [files, setFiles] = useState(null);
  const [layerName, setLayerName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [customGroup, setCustomGroup] = useState("");
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
    const finalGroup = customGroup || groupName;

    if (!files || !layerName || !finalGroup) {
      setMessage({ text: "Please fill all fields", type: "error" });
      return;
    }

    setIsUploading(true);
    setMessage({ text: "Uploading...", type: "info" });

    try {
      const result = await uploadShapefile(files, layerName, finalGroup);

      if (result.success) {
        setMessage({ text: "Upload successful!", type: "success" });
        setFiles(null);
        setLayerName("");
        setGroupName("");
        setCustomGroup("");
        document.getElementById("shapefile-upload").value = "";
      } else {
        console.error("Upload error:", result.error);
        setMessage({ text: `Upload failed: ${result.error}`, type: "error" });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ text: `Unexpected error: ${error.message}`, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Upload Shapefile</h2>

        {message.text && <div className={`modal-message ${message.type}`}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Shapefile (.shp, .dbf, .prj)</label>
            <input type="file" id="shapefile-upload" multiple accept=".shp,.dbf,.prj" onChange={handleFileChange} disabled={isUploading} />
          </div>

          <div className="form-group">
            <label>Layer Name</label>
            <input type="text" value={layerName} onChange={(e) => setLayerName(e.target.value)} disabled={isUploading} required />
          </div>

          <div className="form-group">
            <label>Group</label>
            <select value={groupName} onChange={(e) => setGroupName(e.target.value)} disabled={isUploading}>
              <option value="">Select a group</option>
              {LAYER_GROUPS.map((group) => (
                <option key={group.title} value={group.title}>
                  {group.title}
                </option>
              ))}
            </select>
            <div className="or">OR</div>
            <input type="text" placeholder="Enter custom group" value={customGroup} onChange={(e) => setCustomGroup(e.target.value)} disabled={isUploading} />
          </div>

          <div className="modal-actions">
            <button type="submit" disabled={isUploading || !files || !layerName || !(groupName || customGroup)}>
              {isUploading ? "Uploading..." : "Upload"}
            </button>
            <button type="button" onClick={() => setShowModal(false)} disabled={isUploading}>
              Cancel
            </button>
          </div>
        </form>

        {isUploading && (
          <div className="modal-loading-overlay">
            <div className="loader" />
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadModal;
