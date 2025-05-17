import React, { useEffect, useState } from "react";
import { Category } from "../../types/category";
import { getCategoryTree } from "../../api/categoryApi";
import { getArtifactsByCategory } from "../../api/artifactApi";
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

  // Helper: recursively update a node by id
  const updateNodeById = (
    nodes: Category[],
    id: number,
    updater: (node: Category) => Category
  ): Category[] => {
    return nodes.map((n) =>
      n.id === id
        ? updater(n)
        : {
            ...n,
            subcategories: n.subcategories
              ? updateNodeById(n.subcategories, id, updater)
              : [],
          }
    );
  };

  const handleToggle = async (id: number) => {
    // Find the toggled node and see if it needs to load artifacts
    let nodeToToggle: Category | undefined;
    const findNode = (nodes: Category[]): void => {
      for (const n of nodes) {
        if (n.id === id) {
          nodeToToggle = n;
          return;
        }
        if (n.subcategories) findNode(n.subcategories);
      }
    };
    findNode(tree);

    // If node is being expanded and has not loaded artifacts yet, fetch them
    if (nodeToToggle && !nodeToToggle.isExpanded && nodeToToggle.artifacts === undefined) {
      try {
        const artifacts = await getArtifactsByCategory(id);
        setTree((prev) =>
          updateNodeById(prev, id, (node) => ({
            ...node,
            isExpanded: true,
            artifacts: artifacts,
          }))
        );
      } catch (err) {
        // still expand, but with artifacts as empty
        setTree((prev) =>
          updateNodeById(prev, id, (node) => ({
            ...node,
            isExpanded: true,
            artifacts: [],
          }))
        );
      }
    } else {
      // Just toggle expanded/collapsed
      setTree((prev) =>
        updateNodeById(prev, id, (node) => ({
          ...node,
          isExpanded: !node.isExpanded,
        }))
      );
    }
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