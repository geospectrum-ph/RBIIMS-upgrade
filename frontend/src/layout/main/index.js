import React, { useState } from "react";
import "./index.css";
import axios from "axios";
import Map from "../../components/map";

function Main() {
  // test
  const [data, setData] = useState(null);
  React.useEffect(() => {
    const fetchData = async () => {
      try {
      const response = await axios.get('http://localhost:4000/test/getTest', {
          withCredentials: true // Crucial for sending cookies (add this to every request or create a global axios)
        });
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency

  return (
    <main className="main-content">
      {/* <h1>RBIIMS</h1>
      <p>Test: Retrieved from the database </p>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>} */}
      <Map/>
    </main>
  );
}

export default Main;
