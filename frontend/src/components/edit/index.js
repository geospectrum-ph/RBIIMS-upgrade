import React, { useState, useEffect, useContext } from "react";
import "./index.css";
import { MapContext } from "../../context/MapContext";
import axios from "axios";

function EditModal() {
  const { uploadShapefile, LAYER_GROUPS, setShowModalEdit, showModalEdit } = useContext(MapContext);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/editables/tables`)
      .then((res) => setTables(res.data.tables))
      .catch((err) => console.error("Failed to load tables:", err));
  }, []);

  const filteredRows = rows.filter((row) => Object.values(row).some((val) => val?.toString().toLowerCase().includes(searchQuery.toLowerCase())));

  const fetchTableData = (table) => {
    setSelectedTable(table);
    axios
      .get(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/editables/${table}`)
      .then((res) => setRows(res.data.data))
      .catch((err) => console.error("Failed to load table data:", err));
  };

  const handleEditClick = (row) => {
    setEditingRowId(row.id);
    setEditedData(row);
  };

  const handleChange = (key, value) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/editables/${selectedTable}/${editingRowId}`, editedData);
      fetchTableData(selectedTable);
      setEditingRowId(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_DOMAIN}/datasets/editables/${selectedTable}/${id}`);
      fetchTableData(selectedTable);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className={`bottom-sidebar-edit ${showModalEdit ? "show" : ""}`}>
      <div className="edit-drawer">
        <div className="edit-sidebar">
          <h3>Tables</h3>
          <ul>
            {tables.map((tbl) => (
              <li key={tbl} onClick={() => fetchTableData(tbl)}>
                {tbl}
              </li>
            ))}
          </ul>
        </div>

        <div className="edit-content">
          <div className="edit-header">
            <h3>{selectedTable ? `Editing: ${selectedTable}` : "Select a table"}</h3>
            <div className="search-wrapper">
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="close-btn" onClick={() => setShowModalEdit(false)}>
              Close
            </button>
          </div>

          {selectedTable && (
            <div className="edit-table-wrapper">
              <table>
                <thead>
                  <tr>
                    {Object.keys(rows[0] || {}).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      {Object.entries(row).map(([key, val]) => (
                        <td key={key}>{editingRowId === row.id ? <input value={editedData[key] ?? ""} onChange={(e) => handleChange(key, e.target.value)} /> : val}</td>
                      ))}
                      <td>
                        {editingRowId === row.id ? (
                          <button className="save-btn" onClick={handleUpdate}>
                            Save
                          </button>
                        ) : (
                          <button className="edit-btn" onClick={() => handleEditClick(row)}>
                            Edit
                          </button>
                        )}
                        <button className="delete-btn" onClick={() => handleDelete(row.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditModal;
