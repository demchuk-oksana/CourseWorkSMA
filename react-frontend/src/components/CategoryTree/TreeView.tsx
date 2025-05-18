import React, { useEffect, useState } from "react";
import { Category } from "../../types/category";
import TreeNode from "./TreeNode";
import styles from "./TreeView.module.css";
import { getCategoryTree } from "../../api/categoryApi";
import { getArtifactsByCategory } from "../../api/artifactApi";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

interface ContextMenuState {
  x: number;
  y: number;
  node: Category | null;
}

type DropPosition = "above" | "below" | "inside" | null;

interface DragOverState {
  nodeId: number;
  position: DropPosition;
}

const TreeView: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const { auth } = useAuth();

  useEffect(() => {
    getCategoryTree()
      .then(setTree)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Recursively update a node by id
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

  // Find a node and its parent
  const findNodeAndParent = (
    nodes: Category[],
    id: number,
    parent: Category | null = null
  ): { node: Category | null; parent: Category | null } => {
    for (const n of nodes) {
      if (n.id === id) return { node: n, parent };
      if (n.subcategories && n.subcategories.length > 0) {
        const found = findNodeAndParent(n.subcategories, id, n);
        if (found.node) return found;
      }
    }
    return { node: null, parent: null };
  };

  // Check if potentialParentId is a descendant of nodeId
  const isDescendant = (
    nodes: Category[],
    nodeId: number,
    potentialParentId: number
  ): boolean => {
    const { node } = findNodeAndParent(nodes, nodeId);
    if (!node || !node.subcategories) return false;
    for (const sub of node.subcategories) {
      if (sub.id === potentialParentId) return true;
      if (isDescendant([sub], sub.id, potentialParentId)) return true;
    }
    return false;
  };

  // Remove a node by id and return the new tree and the removed node
  const removeNodeById = (
    nodes: Category[],
    id: number
  ): { newTree: Category[]; removedNode: Category | null } => {
    let removedNode: Category | null = null;
    const newTree = nodes
      .map((n) => {
        if (n.id === id) {
          removedNode = n;
          return null;
        }
        if (n.subcategories && n.subcategories.length > 0) {
          const { newTree: newSubs, removedNode: removed } = removeNodeById(
            n.subcategories,
            id
          );
          if (removed) removedNode = removed;
          return { ...n, subcategories: newSubs };
        }
        return n;
      })
      .filter(Boolean) as Category[];
    return { newTree, removedNode };
  };

  // Insert a node under parentId at a specific position
  const insertNode = (
    nodes: Category[],
    parentId: number,
    node: Category,
    position: number
  ): Category[] => {
    return nodes.map((n) => {
      if (n.id === parentId) {
        const newSubs = [...(n.subcategories || [])];
        newSubs.splice(position, 0, node);
        return { ...n, subcategories: newSubs };
      }
      if (n.subcategories && n.subcategories.length > 0) {
        return {
          ...n,
          subcategories: insertNode(n.subcategories, parentId, node, position),
        };
      }
      return n;
    });
  };

  // Insert node at root (shouldn't be used but utility provided)
  const insertAtRoot = (
    nodes: Category[],
    node: Category,
    position: number
  ): Category[] => {
    const newNodes = [...nodes];
    newNodes.splice(position, 0, node);
    return newNodes;
  };

  // Find index of childId among parent's subcategories
  const findChildIndex = (parent: Category, childId: number): number => {
    return parent.subcategories
      ? parent.subcategories.findIndex((c) => c.id === childId)
      : -1;
  };

  // Helper to clear dragOver state
  const clearDragOver = () => setDragOver(null);

  // Drag and drop logic
  const handleDragStart = (event: React.DragEvent, node: Category) => {
    setDraggingNodeId(node.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.name);
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    clearDragOver();
  };

  /**
   * Determines drop position based on mouse Y coordinate
   * relative to the target node's bounding rect.
   */
  const getDropPosition = (
    event: React.DragEvent,
    nodeElement: HTMLElement
  ): DropPosition => {
    const { top, height } = nodeElement.getBoundingClientRect();
    const offsetY = event.clientY - top;
    if (offsetY < height / 3) return "above";
    if (offsetY > (2 * height) / 3) return "below";
    return "inside";
  };

  // Main drag over handler
  const handleDragOver = (
    event: React.DragEvent,
    node: Category,
    nodeElement: HTMLElement
  ) => {
    if (draggingNodeId === null) return;

    // Disallow drop onto itself/descendants
    if (draggingNodeId === node.id) return;
    if (isDescendant(tree, draggingNodeId, node.id)) return;

    // Disallow moving to root
    if (node.parentCategoryId === null) return;

    event.preventDefault();

    // Visual cue: highlight above, below, or inside
    const pos = getDropPosition(event, nodeElement);
    setDragOver({ nodeId: node.id, position: pos });
  };

  const handleDrop = async (
  event: React.DragEvent,
  node: Category,
  nodeElement: HTMLElement
) => {
  if (draggingNodeId === null) return;
  clearDragOver();

  // Disallow drop onto itself/descendants/root
  if (draggingNodeId === node.id) return;
  if (isDescendant(tree, draggingNodeId, node.id)) return;
  if (node.parentCategoryId === null) return;

  const pos = getDropPosition(event, nodeElement);

  // Find dragged node and its current parent
  const { node: draggedNode, parent: oldParent } = findNodeAndParent(
    tree,
    draggingNodeId
  );
  if (!draggedNode) return;

  let newParentId: number;
  let newPosition: number;

  if (pos === "inside") {
    newParentId = node.id;
    newPosition = node.subcategories ? node.subcategories.length : 0;
  } else {
    const { parent: targetParent } = findNodeAndParent(tree, node.id);
    if (!targetParent) return;

    newParentId = targetParent.id;
    const siblingIndex = findChildIndex(targetParent, node.id);

    newPosition = pos === "above" ? siblingIndex : siblingIndex + 1;
  }

  if (!newParentId) return;

  // Find the current parent and the index of the dragged node under that parent
  const { parent: currentParent } = findNodeAndParent(tree, draggedNode.id);
  let currentParentId = currentParent ? currentParent.id : null;
  let currentIndex = -1;
  if (currentParent && currentParent.subcategories) {
    currentIndex = currentParent.subcategories.findIndex(
      (c) => c.id === draggedNode.id
    );
  }

  // If the parent and position are the same, do nothing
  if (
    currentParentId === newParentId &&
    currentIndex === newPosition
  ) {
    setDraggingNodeId(null);
    return;
  }

  // ---- FIX: Adjust index if moving down within same parent ----
  if (
    currentParentId === newParentId &&
    currentIndex > -1 &&
    currentIndex < newPosition
  ) {
    newPosition = newPosition - 1;
  }
  // ------------------------------------------------------------

  try {
    await axios.post(
      "http://localhost:5064/api/categories/rearrange",
      {
        categoryId: draggedNode.id,
        newParentId,
        newPosition,
      },
      {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    // Remove node from old location and insert at new position
    let updatedTree = tree;
    const { newTree, removedNode } = removeNodeById(updatedTree, draggedNode.id);
    if (removedNode) {
      updatedTree = insertNode(newTree, newParentId, removedNode, newPosition);
      setTree(updatedTree);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setDraggingNodeId(null);
  }
};

  const handleContextMenu = (
    event: React.MouseEvent,
    node: Category
  ) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  };

  const handleToggle = async (id: number) => {
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

    if (
      nodeToToggle &&
      !nodeToToggle.isExpanded &&
      nodeToToggle.artifacts === undefined
    ) {
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
        setTree((prev) =>
          updateNodeById(prev, id, (node) => ({
            ...node,
            isExpanded: true,
            artifacts: [],
          }))
        );
      }
    } else {
      setTree((prev) =>
        updateNodeById(prev, id, (node) => ({
          ...node,
          isExpanded: !node.isExpanded,
        }))
      );
    }
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
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          draggingNodeId={draggingNodeId}
          dragOver={dragOver}
        />
      ))}
      {contextMenu && contextMenu.node && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div
            className={styles.contextMenuItem}
            onClick={() => {
              setContextMenu(null);
            }}
          >
            Create category
          </div>
          <div
            className={styles.contextMenuItem}
            onClick={() => {
              setContextMenu(null);
            }}
          >
            Add software dev artifact
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeView;