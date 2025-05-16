import React, { useEffect, useState } from "react";
import { Category } from "../../types/category";
import { getCategoryTree } from "../../api/categoryApi";
import TreeNode from "./TreeNode";
import styles from "./TreeView.module.css";

// Context menu implementation (basic)
const ContextMenu = ({
  x,
  y,
  onClose,
  onCreateCategory,
  onAddArtifact,
  onDragCategory,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onCreateCategory: () => void;
  onAddArtifact: () => void;
  onDragCategory: () => void;
}) => (
  <div
    className={styles.contextMenu}
    style={{ top: y, left: x, position: "fixed", zIndex: 1000 }}
    onMouseLeave={onClose}
  >
    <div className={styles.contextMenuItem} onClick={onCreateCategory}>
      Create a new category
    </div>
    <div className={styles.contextMenuItem} onClick={onDragCategory}>
      Drag and Drop category
    </div>
    <div className={styles.contextMenuItem} onClick={onAddArtifact}>
      Add software dev artifact
    </div>
  </div>
);

const TreeView: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: Category | null;
  } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);

  useEffect(() => {
    getCategoryTree()
      .then(setTree)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (id: number) => {
    // Recursively toggle isExpanded
    const toggle = (nodes: Category[]): Category[] =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, isExpanded: !n.isExpanded }
          : { ...n, subcategories: toggle(n.subcategories || []) }
      );
    setTree((prev) => toggle(prev));
  };

  const handleContextMenu = (
    event: React.MouseEvent,
    node: Category
  ) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  };

  // Drag and drop handlers (basic, can be expanded)
  const handleDragStart = (event: React.DragEvent, node: Category) => {
    setDraggingNodeId(node.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent, node: Category) => {
    event.preventDefault();
    // Can highlight drop target here if desired
  };

  const handleDrop = (event: React.DragEvent, node: Category) => {
    setDraggingNodeId(null);
    // Implement reordering logic here
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.treeWrapper}>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onToggle={handleToggle}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          draggingNodeId={draggingNodeId}
        />
      ))}
      {contextMenu && contextMenu.node && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCreateCategory={() => {
            // Implement create logic
            setContextMenu(null);
          }}
          onAddArtifact={() => {
            // Implement add artifact logic
            setContextMenu(null);
          }}
          onDragCategory={() => {
            // Drag logic can be handled elsewhere
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};

export default TreeView;