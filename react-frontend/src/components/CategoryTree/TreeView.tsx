import React, { useEffect, useState } from "react";
import { Category } from "../../types/category";
import TreeNode from "./TreeNode";
import styles from "./TreeView.module.css";
import { getArtifactsByCategory } from "../../api/artifactApi";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { getCategoryTree, setCategoryDisplayPreference } from "../../api/categoryApi";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

// --- Types for category and artifact context menu state ---
interface ContextMenuState {
  x: number;
  y: number;
  node: Category | null;
}

interface ArtifactContextMenuState {
  x: number;
  y: number;
  artifact: any | null;
  categoryId: number | null;
}

type DropPosition = "above" | "below" | "inside" | null;

interface DragOverState {
  nodeId: number;
  position: DropPosition;
}

// --- Modal types ---
type ModalType =
  | null
  | "createCategory"
  | "addArtifact"
  | "error"
  | "addVersion"
  | "showVersions";

interface ArtifactVersion {
  id: number;
  versionNumber: string;
  uploadDate: string;
  changes: string;
  downloadUrl: string;
  softwareDevArtifactId: number;
}

const DEFAULT_ARTIFACT_FIELDS = {
  title: "",
  description: "",
  url: "",
  type: 0,
  version: "1.0.0",
  programmingLanguage: "",
  framework: "",
  licenseType: "",
  categoryId: undefined as number | undefined,
};

const DEFAULT_VERSION_FIELDS = {
  versionNumber: "",
  changes: "",
  downloadUrl: "",
};

const TreeView: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [artifactMenu, setArtifactMenu] = useState<ArtifactContextMenuState | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);

  const [modal, setModal] = useState<ModalType>(null);

  // Modal fields
  const [categoryInput, setCategoryInput] = useState("");
  const [artifactFields, setArtifactFields] = useState({ ...DEFAULT_ARTIFACT_FIELDS });
  const [versionFields, setVersionFields] = useState({ ...DEFAULT_VERSION_FIELDS });

  const [modalData, setModalData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersion[] | null>(null);

  const { auth } = useAuth();

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = () => {
  setLoading(true);
  getCategoryTree(auth.accessToken ?? undefined)
    .then(setTree)
    .catch((err) => setError("Failed to load category tree"))
    .finally(() => setLoading(false));
};

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

  const findChildIndex = (parent: Category, childId: number): number => {
    return parent.subcategories
      ? parent.subcategories.findIndex((c) => c.id === childId)
      : -1;
  };

  const clearDragOver = () => setDragOver(null);

  // --- Drag and drop logic for categories (not artifacts) ---
  const handleDragStart = (event: React.DragEvent, node: Category) => {
    setDraggingNodeId(node.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.name);
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    clearDragOver();
  };

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

  const handleDragOver = (
    event: React.DragEvent,
    node: Category,
    nodeElement: HTMLElement
  ) => {
    if (draggingNodeId === null) return;
    if (draggingNodeId === node.id) return;
    if (node.parentCategoryId === null) return;
    event.preventDefault();

    const pos = getDropPosition(event, nodeElement);
    setDragOver({ nodeId: node.id, position: pos });
  };

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

  const handleDrop = async (
    event: React.DragEvent,
    node: Category,
    nodeElement: HTMLElement
  ) => {
    if (draggingNodeId === null) return;
    clearDragOver();

    if (draggingNodeId === node.id) return;
    if (isDescendant(tree, draggingNodeId, node.id)) return;
    if (node.parentCategoryId === null) return;

    const pos = getDropPosition(event, nodeElement);

    const { node: draggedNode } = findNodeAndParent(
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

    const { parent: currentParent } = findNodeAndParent(tree, draggedNode.id);
    let currentParentId = currentParent ? currentParent.id : null;
    let currentIndex = -1;
    if (currentParent && currentParent.subcategories) {
      currentIndex = currentParent.subcategories.findIndex(
        (c) => c.id === draggedNode.id
      );
    }

    // No-op move
    if (
      currentParentId === newParentId &&
      currentIndex === newPosition
    ) {
      setDraggingNodeId(null);
      return;
    }

    // Adjust index if moving down within the same parent
    if (
      currentParentId === newParentId &&
      currentIndex > -1 &&
      currentIndex < newPosition
    ) {
      newPosition = newPosition - 1;
    }

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
      let updatedTree = tree;
      const { newTree, removedNode } = removeNodeById(updatedTree, draggedNode.id);
      if (removedNode) {
        updatedTree = insertNode(newTree, newParentId, removedNode, newPosition);
        setTree(updatedTree);
      }
    } catch (err) {
      setError("Failed to rearrange category");
    } finally {
      setDraggingNodeId(null);
    }
  };

  // --- Context menu logic for categories ---
  const handleContextMenu = (
    event: React.MouseEvent,
    node: Category
  ) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
    setArtifactMenu(null);
  };

  // --- Context menu logic for artifacts ---
  const handleArtifactContextMenu = (
    event: React.MouseEvent,
    artifact: any,
    categoryId: number
  ) => {
    event.preventDefault();
    setArtifactMenu({ x: event.clientX, y: event.clientY, artifact, categoryId });
    setContextMenu(null);
  };

  // --- CATEGORY OPTION: Create Category ---
  const handleCreateCategory = () => {
    setCategoryInput("");
    setModalData({ parentId: contextMenu?.node?.id });
    setModal("createCategory");
    setContextMenu(null);
  };

  const submitCreateCategory = async () => {
    if (!categoryInput.trim()) {
      setError("Category name is required.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:5064/api/categories",
        {
          name: categoryInput.trim(),
          parentCategoryId: modalData?.parentId
        },
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      fetchTree();
      setModal(null);
    } catch (err: any) {
      setError("Failed to create category. " + (err?.response?.data || ""));
    }
  };

  // --- CATEGORY OPTION: Add Artifact ---
  const handleAddArtifact = () => {
    setArtifactFields({
      ...DEFAULT_ARTIFACT_FIELDS,
      categoryId: contextMenu?.node?.id,
    });
    setModalData({ parentId: contextMenu?.node?.id });
    setModal("addArtifact");
    setContextMenu(null);
  };

  const validateUrl = (url: string) => {
    try {
      // Accept empty string as invalid
      if (!url) return false;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateVersion = (ver: string) => /^[0-9]+\.[0-9]+\.[0-9]+$/.test(ver);

  const submitAddArtifact = async () => {
    // Validate input
    if (!artifactFields.title) {
      setError("Title is required.");
      return;
    }
    if (!validateUrl(artifactFields.url)) {
      setError("URL is invalid.");
      return;
    }
    if (!validateVersion(artifactFields.version)) {
      setError("Version must be in x.x.x format.");
      return;
    }
    if (!artifactFields.categoryId) {
      setError("Category ID is required.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:5064/api/artifacts",
        artifactFields,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      fetchTree();
      setModal(null);
    } catch (err: any) {
      setError("Failed to add artifact. " + (err?.response?.data || ""));
    }
  };

  // --- CATEGORY OPTION: Delete Category ---
  const handleDeleteCategory = async () => {
    setContextMenu(null);
    if (!contextMenu?.node) return;

    // Check if empty: no subcategories, no artifacts
    const isEmpty =
      (!contextMenu.node.subcategories || contextMenu.node.subcategories.length === 0) &&
      (!contextMenu.node.artifacts || contextMenu.node.artifacts.length === 0);

    if (!isEmpty) {
      setError("Category is not empty and cannot be deleted.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await axios.delete(
        `http://localhost:5064/api/categories/${contextMenu.node.id}`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      fetchTree();
    } catch (err: any) {
      setError("Failed to delete category. " + (err?.response?.data || ""));
    }
  };

  // --- ARTIFACT OPTION: Delete Artifact ---
  const handleDeleteArtifact = async () => {
    setArtifactMenu(null);
    if (!artifactMenu?.artifact?.id) return;
    if (!window.confirm("Are you sure you want to delete this artifact?")) return;
    try {
      await axios.delete(
        `http://localhost:5064/api/artifacts/${artifactMenu.artifact.id}`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      fetchTree();
    } catch (err: any) {
      setError("Failed to delete artifact. " + (err?.response?.data || ""));
    }
  };

  // --- ARTIFACT OPTION: Add Version ---
  const handleAddVersion = () => {
    setVersionFields({ ...DEFAULT_VERSION_FIELDS });
    setModalData({ artifactId: artifactMenu?.artifact?.id });
    setModal("addVersion");
    setArtifactMenu(null);
  };

  const submitAddVersion = async () => {
    if (!validateVersion(versionFields.versionNumber)) {
      setError("Version must be in x.x.x format.");
      return;
    }
    if (!validateUrl(versionFields.downloadUrl)) {
      setError("Download URL is invalid.");
      return;
    }
    try {
      await axios.post(
        `http://localhost:5064/api/artifacts/${modalData?.artifactId}/versions`,
        {
          versionNumber: versionFields.versionNumber,
          changes: versionFields.changes,
          downloadUrl: versionFields.downloadUrl,
        },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setModal(null);
    } catch (err: any) {
      setError("Failed to add version. " + (err?.response?.data || ""));
    }
  };

  // --- ARTIFACT OPTION: Show Versions ---
  const handleShowVersions = async () => {
    setModal("showVersions");
    setArtifactMenu(null);
    setArtifactVersions(null);
    try {
      const res = await axios.get(
        `http://localhost:5064/api/artifacts/${artifactMenu?.artifact?.id}/versions`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setArtifactVersions(res.data);
    } catch (err: any) {
      setError("Failed to fetch versions. " + (err?.response?.data || ""));
    }
  };

    // --- CATEGORY NODE TOGGLE (expand/collapse) ---
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

    // What state will it become after toggle?
    const willExpand = nodeToToggle ? !nodeToToggle.isExpanded : true;

    if (auth.accessToken) {
    setCategoryDisplayPreference(id, willExpand, auth.accessToken).catch(console.error);
    } else {
    // Optionally handle the case where the user is not authenticated
    console.error("User is not authenticated");
    }


    setTree((prev) =>
  updateNodeById(prev, id, (node) => ({
    ...node,
    isExpanded: willExpand,
  }))
);}


  // --- RENDER ---
  if (loading) return <div>Loading...</div>;

  // --- Modals ---
  const renderModal = () => {
    if (modal === "createCategory") {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Create Category</h3>
            <input
              type="text"
              placeholder="Category name"
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button onClick={submitCreateCategory}>
                Create
              </button>
              <button onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      );
    }
    if (modal === "addArtifact") {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Add Software Dev Artifact</h3>
            <input
              type="text"
              placeholder="Title"
              value={artifactFields.title}
              onChange={e => setArtifactFields({ ...artifactFields, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              value={artifactFields.description}
              onChange={e => setArtifactFields({ ...artifactFields, description: e.target.value })}
            />
            <input
              type="url"
              placeholder="URL"
              value={artifactFields.url}
              onChange={e => setArtifactFields({ ...artifactFields, url: e.target.value })}
            />
            <input
              type="number"
              placeholder="Type"
              value={artifactFields.type}
              onChange={e => setArtifactFields({ ...artifactFields, type: Number(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Version (x.x.x)"
              value={artifactFields.version}
              onChange={e => setArtifactFields({ ...artifactFields, version: e.target.value })}
            />
            <input
              type="text"
              placeholder="Programming Language"
              value={artifactFields.programmingLanguage}
              onChange={e => setArtifactFields({ ...artifactFields, programmingLanguage: e.target.value })}
            />
            <input
              type="text"
              placeholder="Framework"
              value={artifactFields.framework}
              onChange={e => setArtifactFields({ ...artifactFields, framework: e.target.value })}
            />
            <input
              type="text"
              placeholder="License Type"
              value={artifactFields.licenseType}
              onChange={e => setArtifactFields({ ...artifactFields, licenseType: e.target.value })}
            />
            <div className={styles.modalButtons}>
              <button onClick={submitAddArtifact}>Add</button>
              <button onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      );
    }
    if (modal === "addVersion") {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Add Version</h3>
            <input
              type="text"
              placeholder="Version (x.x.x)"
              value={versionFields.versionNumber}
              onChange={e => setVersionFields({ ...versionFields, versionNumber: e.target.value })}
            />
            <input
              type="text"
              placeholder="Changes"
              value={versionFields.changes}
              onChange={e => setVersionFields({ ...versionFields, changes: e.target.value })}
            />
            <input
              type="url"
              placeholder="Download URL"
              value={versionFields.downloadUrl}
              onChange={e => setVersionFields({ ...versionFields, downloadUrl: e.target.value })}
            />
            <div className={styles.modalButtons}>
              <button onClick={submitAddVersion}>Add</button>
              <button onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      );
    }
    if (modal === "showVersions") {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Artifact Versions</h3>
            {artifactVersions === null ? (
              <div>Loading...</div>
            ) : (
              <ul>
                {artifactVersions.length === 0 && <li>No versions found.</li>}
                {artifactVersions.map(ver => (
                  <li key={ver.id}>
                    <b>{ver.versionNumber}</b> - {ver.changes} <br />
                    <a href={ver.downloadUrl} target="_blank" rel="noopener noreferrer">
                      Download
                    </a>
                    <br />
                    <span>
                      Uploaded: {new Date(ver.uploadDate).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.modalButtons}>
              <button onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      );
    }
    // Error modal
    if (error) {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div style={{ color: "red" }}>{error}</div>
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setError(null);
                  setModal(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- Main render ---
  return (
    <div className={styles.treeWrapper} tabIndex={-1}
      onClick={() => {
        setContextMenu(null);
        setArtifactMenu(null);
      }}
    >
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
          onArtifactContextMenu={handleArtifactContextMenu}
        />
      ))}

      {/* --- Category Context Menu --- */}
      {contextMenu && contextMenu.node && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className={styles.contextMenuItem} onClick={handleCreateCategory}>
            Create category
          </div>
          <div className={styles.contextMenuItem} onClick={handleAddArtifact}>
            Add software dev artifact
          </div>
          <div
            className={styles.contextMenuItem}
            onClick={handleDeleteCategory}
          >
            Delete category
          </div>
        </div>
      )}

      {/* --- Artifact Context Menu --- */}
      {artifactMenu && artifactMenu.artifact && (
        <div
          className={styles.contextMenu}
          style={{ left: artifactMenu.x, top: artifactMenu.y }}
        >
          <div className={styles.contextMenuItem} onClick={handleDeleteArtifact}>
            Delete artifact
          </div>
          <div className={styles.contextMenuItem} onClick={handleAddVersion}>
            Add version
          </div>
          <div className={styles.contextMenuItem} onClick={handleShowVersions}>
            Display all versions
          </div>
        </div>
      )}

      {/* --- Modals for all actions/errors --- */}
      {(modal || error) && renderModal()}
    </div>
  );
};

export default TreeView;