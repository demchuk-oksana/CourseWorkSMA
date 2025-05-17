import React from "react";
import TreeView from "../components/CategoryTree/TreeView";

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Categories</h1>
      <TreeView />
    </div>
  );
};

export default HomePage;