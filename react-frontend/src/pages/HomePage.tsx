import React from "react";
import { useNavigate } from "react-router-dom";
import TreeView from "../components/CategoryTree/TreeView";
import "./HomePage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate("/search");
  };

  return (
    <div className="home-page">
      <div className="home-header-bar">
        <button
          className="home-search-btn"
          onClick={handleSearchClick}
          type="button"
        >
          🔍 Search Artifacts
        </button>
      </div>
      <TreeView />
    </div>
  );
};

export default HomePage;