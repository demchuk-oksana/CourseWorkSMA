import React from "react";
import { useNavigate } from "react-router-dom";
import TreeView from "../components/CategoryTree/TreeView";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate("/search");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1>Categories</h1>
        <button onClick={handleSearchClick} style={{ padding: "8px 16px", fontSize: "16px" }}>
          Search Artifacts
        </button>
      </div>
      <TreeView />
    </div>
  );
};

export default HomePage;