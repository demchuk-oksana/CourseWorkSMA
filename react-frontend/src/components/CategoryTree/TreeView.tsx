import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Category } from "../../types/category";
import TreeNode from "./TreeNode";
import styles from "./TreeView.module.css";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { getCategoryTree, setCategoryDisplayPreference } from "../../api/categoryApi";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

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

const DEFAULT_INDENTATION = 24;

interface FlatEntry {
  type: "category" | "artifact";
  id: number;
  parentCategoryId: number | null;
  category: Category;
  artifact?: any;
  level: number;
}

const flattenTree = (
  nodes: Category[],
  level = 0,
  parentCategoryId: number | null = null
): FlatEntry[] => {
  let entries: FlatEntry[] = [];
  for (const node of nodes) {
    entries.push({
      type: "category",
      id: node.id,
      parentCategoryId,
      category: node,
      level,
    });
    if (node.isExpanded && node.subcategories) {
      entries = entries.concat(flattenTree(node.subcategories, level + 1, node.id));
    }
    if (node.isExpanded && node.artifacts) {
      for (const artifact of node.artifacts) {
        entries.push({
          type: "artifact",
          id: artifact.id,
          parentCategoryId: node.id,
          category: node,
          artifact,
          level: level + 1,
        });
      }
    }
  }
  return entries;
};

type ModalUndoRedoState = {
  modal: ModalType;
  modalData: any;
  artifactFields?: typeof DEFAULT_ARTIFACT_FIELDS;
  categoryInput?: string;
};

const TreeView: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [artifactMenu, setArtifactMenu] = useState<ArtifactContextMenuState | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);

  const [modal, setModal] = useState<ModalType>(null);

  const [categoryInput, setCategoryInput] = useState("");
  const [artifactFields, setArtifactFields] = useState({ ...DEFAULT_ARTIFACT_FIELDS });
  const [versionFields, setVersionFields] = useState({ ...DEFAULT_VERSION_FIELDS });

  const [modalData, setModalData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersion[] | null>(null);

  const { auth } = useAuth();

  const [focusedCategoryId, setFocusedCategoryId] = useState<number | null>(null);

  const [indentation, setIndentation] = useState<number>(DEFAULT_INDENTATION);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<number | null>(null);

  const [modalUndoStack, setModalUndoStack] = useState<ModalUndoRedoState[]>([]);
  const [modalRedoStack, setModalRedoStack] = useState<ModalUndoRedoState[]>([]);

  const treeRootRef = useRef<HTMLDivElement>(null);
  const createCategoryFirstInputRef = useRef<HTMLInputElement>(null);
  const addArtifactFirstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTree();
    if (treeRootRef.current) {
      treeRootRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (modal === "createCategory" && createCategoryFirstInputRef.current) {
      createCategoryFirstInputRef.current.focus();
    } else if (modal === "addArtifact" && addArtifactFirstInputRef.current) {
      addArtifactFirstInputRef.current.focus();
    }
  }, [modal]);

  const fetchTree = () => {
    setLoading(true);
    getCategoryTree(auth.accessToken ?? undefined)
      .then(setTree)
      .catch(() => setError("Failed to load category tree"))
      .finally(() => setLoading(false));
  };

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

  const findNodeById = (nodes: Category[], id: number): Category | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.subcategories && n.subcategories.length > 0) {
        const found = findNodeById(n.subcategories, id);
        if (found) return found;
      }
    }
    return null;
  };

  const buildBreadcrumbPath = (nodes: Category[], id: number): Category[] => {
    const path: Category[] = [];
    const traverse = (currentNodes: Category[], targetId: number): boolean => {
      for (const node of currentNodes) {
        if (node.id === targetId) {
          path.unshift(node);
          return true;
        }
        if (node.subcategories && node.subcategories.length > 0) {
          if (traverse(node.subcategories, targetId)) {
            path.unshift(node);
            return true;
          }
        }
      }
      return false;
    };
    traverse(nodes, id);
    return path;
  };

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

    if (
      currentParentId === newParentId &&
      currentIndex === newPosition
    ) {
      setDraggingNodeId(null);
      return;
    }

    if (
      currentParentId === newParentId &&
      currentIndex > -1 &&
      currentIndex < newPosition
    ) {
      newPosition = newPosition - 1;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/categories/rearrange`,
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

  const handleContextMenu = (
    event: React.MouseEvent,
    node: Category
  ) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
    setArtifactMenu(null);
  };

  const handleArtifactContextMenu = (
    event: React.MouseEvent,
    artifact: any,
    categoryId: number
  ) => {
    event.preventDefault();
    setArtifactMenu({ x: event.clientX, y: event.clientY, artifact, categoryId });
    setContextMenu(null);
  };

  const handleCreateCategory = () => {
    setModalUndoStack((stack) => [
      ...stack,
      {
        modal: "createCategory",
        modalData: { parentId: contextMenu?.node?.id ?? undefined },
        categoryInput: "",
      },
    ]);
    setModalRedoStack([]);
    setCategoryInput("");
    setModalData({ parentId: contextMenu?.node?.id ?? undefined });
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
        `${API_BASE_URL}/categories`,
        {
          name: categoryInput.trim(),
          parentCategoryId: modalData?.parentId ?? undefined
        },
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      fetchTree();
      setModal(null);
      setTimeout(() => treeRootRef.current?.focus(), 0);
    } catch (err: any) {
      setError("Failed to create category. " + (err?.response?.data || ""));
    }
  };

  const handleAddArtifact = () => {
    setModalUndoStack((stack) => [
      ...stack,
      {
        modal: "addArtifact",
        modalData: { parentId: contextMenu?.node?.id ?? undefined },
        artifactFields: { ...DEFAULT_ARTIFACT_FIELDS, categoryId: contextMenu?.node?.id ?? undefined },
      },
    ]);
    setModalRedoStack([]);
    setArtifactFields({
      ...DEFAULT_ARTIFACT_FIELDS,
      categoryId: contextMenu?.node?.id ?? undefined,
    });
    setModalData({ parentId: contextMenu?.node?.id ?? undefined });
    setModal("addArtifact");
    setContextMenu(null);
  };

  const validateUrl = (url: string) => {
    try {
      if (!url) return false;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateVersion = (ver: string) => /^[0-9]+\.[0-9]+\.[0-9]+$/.test(ver);

  const submitAddArtifact = async () => {
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
        `${API_BASE_URL}/artifacts`,
        artifactFields,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        }
      );
      fetchTree();
      setModal(null);
      setTimeout(() => treeRootRef.current?.focus(), 0);
    } catch (err: any) {
      setError("Failed to add artifact. " + (err?.response?.data || ""));
    }
  };

  const handleDeleteCategory = async () => {
    setContextMenu(null);
    if (!contextMenu?.node) return;

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
        `${API_BASE_URL}/categories/${contextMenu.node.id}`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      fetchTree();
    } catch (err: any) {
      setError("Failed to delete category. " + (err?.response?.data || ""));
    }
  };

  const handleDeleteArtifact = async () => {
    setArtifactMenu(null);
    if (!artifactMenu?.artifact?.id) return;
    if (!window.confirm("Are you sure you want to delete this artifact?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/artifacts/${artifactMenu.artifact.id}`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      fetchTree();
    } catch (err: any) {
      setError("Failed to delete artifact. " + (err?.response?.data || ""));
    }
  };

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
        `${API_BASE_URL}/artifacts/${modalData?.artifactId}/versions`,
        {
          versionNumber: versionFields.versionNumber,
          changes: versionFields.changes,
          downloadUrl: versionFields.downloadUrl,
        },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setModal(null);
      setTimeout(() => treeRootRef.current?.focus(), 0);
    } catch (err: any) {
      setError("Failed to add version. " + (err?.response?.data || ""));
    }
  };

  const handleShowVersions = useCallback(async (artifactIdArg?: number) => {
    setModal("showVersions");
    setArtifactMenu(null);
    setArtifactVersions(null);
    const artifactId = artifactIdArg ?? artifactMenu?.artifact?.id;
    if (!artifactId) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/artifacts/${artifactId}/versions`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      setArtifactVersions(res.data);
    } catch (err: any) {
      setError("Failed to fetch versions. " + (err?.response?.data || ""));
    }
  }, [artifactMenu, auth.accessToken]);

  const handleToggle = useCallback(async (id: number) => {
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

    const willExpand = nodeToToggle ? !nodeToToggle.isExpanded : true;

    if (auth.accessToken) {
      setCategoryDisplayPreference(id, willExpand, auth.accessToken).catch(console.error);
    } else {
      console.error("User is not authenticated");
    }

    setTree((prev) =>
      updateNodeById(prev, id, (node) => ({
        ...node,
        isExpanded: willExpand,
      }))
    );
  }, [tree, auth.accessToken]);

  const handleNodeClick = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedArtifactId(null);
    treeRootRef.current?.focus();
    setContextMenu(null);
    setArtifactMenu(null);
  };

  const handleArtifactClick = (artifactId: number, categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedArtifactId(artifactId);
    treeRootRef.current?.focus();
    setContextMenu(null);
    setArtifactMenu(null);
  };

  const handleDoubleClick = (node: Category) => {
    setFocusedCategoryId(node.id);
  };

  const handleBreadcrumbClick = (categoryId: number | null) => {
    setFocusedCategoryId(categoryId);
  };

  const getFlatEntries = useCallback(() => {
    let nodesToDisplay: Category[] = tree;
    if (focusedCategoryId !== null) {
      const focusedNode = findNodeById(tree, focusedCategoryId);
      if (focusedNode) nodesToDisplay = [focusedNode];
    }
    return flattenTree(nodesToDisplay);
  }, [tree, focusedCategoryId]);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      // If the modal is open and focus is in an input, ignore navigation/global keys except modal-specific keys
      if (
        modal &&
        document.activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement as HTMLElement).tagName)
      ) {
        return;
      }

      // Undo (Ctrl+Z) or Escape should close the modal (and focus tree)
      if (
        (modal === "createCategory" || modal === "addArtifact") &&
        (
          ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") ||
          e.key === "Escape"
        )
      ) {
        e.preventDefault();
        setModal(null);
        setTimeout(() => treeRootRef.current?.focus(), 0);
        return;
      }

      // Redo for createCategory/addArtifact modal
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key.toLowerCase() === "y")) {
        if (modalRedoStack.length > 0) {
          e.preventDefault();
          const last = modalRedoStack[modalRedoStack.length - 1];
          setModalUndoStack((stack) => [...stack, last]);
          setModalRedoStack((stack) => stack.slice(0, -1));
          if (last.modal === "createCategory") {
            setCategoryInput(last.categoryInput ?? "");
          }
          if (last.modal === "addArtifact") {
            setArtifactFields(last.artifactFields ?? { ...DEFAULT_ARTIFACT_FIELDS });
          }
          setModalData(last.modalData);
          setModal(last.modal);
        }
        return;
      }

      const flatEntries = getFlatEntries();
      const selectedIndex = flatEntries.findIndex(
        (entry) =>
          (entry.type === "category" && entry.id === selectedCategoryId && !selectedArtifactId) ||
          (entry.type === "artifact" && entry.id === selectedArtifactId)
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flatEntries.length === 0) return;
        const next = selectedIndex < flatEntries.length - 1 ? selectedIndex + 1 : 0;
        const entry = flatEntries[next];
        if (entry.type === "category") {
          setSelectedCategoryId(entry.id);
          setSelectedArtifactId(null);
        } else {
          setSelectedCategoryId(entry.parentCategoryId!);
          setSelectedArtifactId(entry.id);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flatEntries.length === 0) return;
        const prev = selectedIndex > 0 ? selectedIndex - 1 : flatEntries.length - 1;
        const entry = flatEntries[prev];
        if (entry.type === "category") {
          setSelectedCategoryId(entry.id);
          setSelectedArtifactId(null);
        } else {
          setSelectedCategoryId(entry.parentCategoryId!);
          setSelectedArtifactId(entry.id);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedArtifactId) return;
        const entry = flatEntries[selectedIndex];
        if (!entry || entry.type !== "category") return;
        const cat = entry.category;
        if (!cat.isExpanded && (cat.subcategories.length > 0 || (cat.artifacts && cat.artifacts.length > 0))) {
          handleToggle(cat.id);
        } else if (cat.isExpanded && cat.subcategories.length > 0) {
          setSelectedCategoryId(cat.subcategories[0].id);
          setSelectedArtifactId(null);
        } else if (cat.isExpanded && (!cat.subcategories.length) && (cat.artifacts && cat.artifacts.length > 0)) {
          setSelectedCategoryId(cat.id);
          setSelectedArtifactId(cat.artifacts[0].id);
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedArtifactId) {
          setSelectedArtifactId(null);
          return;
        }
        const entry = flatEntries[selectedIndex];
        if (!entry || entry.type !== "category") return;
        const cat = entry.category;
        if (cat.isExpanded && (cat.subcategories.length > 0 || (cat.artifacts && cat.artifacts.length > 0))) {
          handleToggle(cat.id);
        } else if (cat.parentCategoryId !== null) {
          setSelectedCategoryId(cat.parentCategoryId!);
          setSelectedArtifactId(null);
        }
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        if (modal === "createCategory") {
          e.preventDefault();
          submitCreateCategory();
          return;
        }
        if (modal === "addArtifact") {
          e.preventDefault();
          submitAddArtifact();
          return;
        }
        if (selectedCategoryId && !selectedArtifactId && !modal) {
          e.preventDefault();
          setFocusedCategoryId(selectedCategoryId);
          return;
        }
      }

      if (e.key === "Escape") {
        if (modal) {
          setModal(null);
          setError(null);
          setTimeout(() => treeRootRef.current?.focus(), 0);
          return;
        }
        if (focusedCategoryId !== null) {
          const path = buildBreadcrumbPath(tree, focusedCategoryId);
          if (path.length > 1) {
            setFocusedCategoryId(path[path.length - 2].id);
          } else {
            setFocusedCategoryId(null);
          }
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setFocusedCategoryId(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setModalUndoStack((stack) => [
          ...stack,
          {
            modal: "createCategory",
            modalData: { parentId: selectedCategoryId ?? undefined },
            categoryInput: "",
          },
        ]);
        setModalRedoStack([]);
        setCategoryInput("");
        setModalData({ parentId: selectedCategoryId ?? undefined });
        setModal("createCategory");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setModalUndoStack((stack) => [
          ...stack,
          {
            modal: "addArtifact",
            modalData: { parentId: selectedCategoryId ?? undefined },
            artifactFields: { ...DEFAULT_ARTIFACT_FIELDS, categoryId: selectedCategoryId ?? undefined },
          },
        ]);
        setModalRedoStack([]);
        setArtifactFields({
          ...DEFAULT_ARTIFACT_FIELDS,
          categoryId: selectedCategoryId ?? undefined,
        });
        setModalData({ parentId: selectedCategoryId ?? undefined });
        setModal("addArtifact");
        return;
      }

      if (e.key.toLowerCase() === "v" && selectedArtifactId) {
        e.preventDefault();
        handleShowVersions(selectedArtifactId);
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        if (selectedArtifactId && selectedCategoryId) {
          if (
            window.confirm("Are you sure you want to delete this artifact?")
          ) {
            axios
              .delete(
                `${API_BASE_URL}/artifacts/${selectedArtifactId}`,
                { headers: { Authorization: `Bearer ${auth.accessToken}` } }
              )
              .then(fetchTree)
              .catch((err) =>
                setError(
                  "Failed to delete artifact. " + (err?.response?.data || "")
                )
              );
          }
        } else if (selectedCategoryId) {
          const node = findNodeById(tree, selectedCategoryId);
          const isEmpty =
            (node?.subcategories?.length ?? 0) === 0 &&
            (node?.artifacts?.length ?? 0) === 0;
          if (!isEmpty) {
            setError("Category is not empty and cannot be deleted.");
            return;
          }
          if (
            window.confirm("Are you sure you want to delete this category?")
          ) {
            axios
              .delete(
                `${API_BASE_URL}/categories/${selectedCategoryId}`,
                { headers: { Authorization: `Bearer ${auth.accessToken}` } }
              )
              .then(fetchTree)
              .catch((err) =>
                setError(
                  "Failed to delete category. " + (err?.response?.data || "")
                )
              );
          }
        }
        return;
      }
    },
    [
      modal,
      modalRedoStack,
      modalUndoStack,
      artifactFields,
      categoryInput,
      selectedCategoryId,
      selectedArtifactId,
      tree,
      getFlatEntries,
      handleShowVersions,
      handleToggle,
      submitAddArtifact,
      submitCreateCategory,
      setModal,
      setModalUndoStack,
      setModalRedoStack,
      setModalData,
      setArtifactFields,
      setCategoryInput,
      setFocusedCategoryId,
      setSelectedCategoryId,
      setSelectedArtifactId,
      setError,
      fetchTree,
      treeRootRef,
      auth.accessToken,
    ]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleKeyDown]);

  const renderBreadcrumb = () => {
    if (focusedCategoryId === null) return null;
    const breadcrumbPath = buildBreadcrumbPath(tree, focusedCategoryId);
    return (
      <div className={styles.breadcrumbBar}>
        <span
          className={styles.breadcrumbSegment}
          onClick={() => handleBreadcrumbClick(null)}
        >
          Root
        </span>
        {breadcrumbPath.map((cat, idx) => (
          <React.Fragment key={cat.id}>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span
              className={styles.breadcrumbSegment}
              onClick={() => handleBreadcrumbClick(cat.id)}
              style={idx === breadcrumbPath.length - 1 ? { fontWeight: "bold" } : undefined}
            >
              {cat.name}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderIndentationInput = () => (
    <div className={styles.indentationControlWrapper}>
      <div className={styles.indentationControl}>
        <label htmlFor="indentationInput">
          Indentation:
          <input
            id="indentationInput"
            type="number"
            min={0}
            max={80}
            step={1}
            value={indentation}
            onChange={e => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 0 && value <= 80) setIndentation(value);
            }}
            className={styles.indentationInput}
            style={{ marginLeft: 8, width: 60 }}
          />{" "}
          <span style={{ fontSize: "90%", color: "#888" }}>px/level</span>
        </label>
      </div>
    </div>
  );

  let nodesToDisplay: Category[] = tree;
  if (focusedCategoryId !== null) {
    const focusedNode = findNodeById(tree, focusedCategoryId);
    if (focusedNode) {
      nodesToDisplay = [focusedNode];
    }
  }

  const renderModal = () => {
    if (modal === "createCategory") {
      return (
        <div className={styles.modalBackdrop}>
          <form
            className={`${styles.modal} ${styles.addMenuModal} ${styles.addMenuModalSmall}`}
            onSubmit={e => {
              e.preventDefault();
              submitCreateCategory();
            }}
            tabIndex={-1}
            onKeyDown={event => {
              if (
                ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") ||
                event.key === "Escape"
              ) {
                event.preventDefault();
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }
            }}
          >
            <h3 className={styles.modalTitle}>Create Category</h3>
            <input
              type="text"
              placeholder="Category name"
              value={categoryInput}
              ref={createCategoryFirstInputRef}
              onChange={e => setCategoryInput(e.target.value)}
              className={styles.modalInput}
              autoFocus
            />
            <div className={styles.modalButtons}>
              <button type="submit" className={styles.modalButton}>
                Create
              </button>
              <button type="button" className={styles.modalButton} onClick={() => {
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      );
    }
    if (modal === "addArtifact") {
      return (
        <div className={styles.modalBackdrop}>
          <form
            className={`${styles.modal} ${styles.addMenuModal} ${styles.addMenuModalSmall}`}
            onSubmit={e => {
              e.preventDefault();
              submitAddArtifact();
            }}
            tabIndex={-1}
            onKeyDown={event => {
              if (
                ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") ||
                event.key === "Escape"
              ) {
                event.preventDefault();
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }
            }}
          >
            <h3 className={styles.modalTitle}>Add Software Dev Artifact</h3>
            <input
              type="text"
              placeholder="Title"
              value={artifactFields.title}
              ref={addArtifactFirstInputRef}
              onChange={e => setArtifactFields({ ...artifactFields, title: e.target.value })}
              className={styles.modalInput}
              autoFocus
            />
            <input
              type="text"
              placeholder="Description"
              value={artifactFields.description}
              onChange={e => setArtifactFields({ ...artifactFields, description: e.target.value })}
              className={styles.modalInput}
            />
            <input
              type="url"
              placeholder="URL"
              value={artifactFields.url}
              onChange={e => setArtifactFields({ ...artifactFields, url: e.target.value })}
              className={styles.modalInput}
            />
            <input
              type="number"
              placeholder="Type"
              value={artifactFields.type}
              onChange={e => setArtifactFields({ ...artifactFields, type: Number(e.target.value) })}
              className={styles.modalInput}
            />
            <input
              type="text"
              placeholder="Version (x.x.x)"
              value={artifactFields.version}
              onChange={e => setArtifactFields({ ...artifactFields, version: e.target.value })}
              className={styles.modalInput}
            />
            <input
              type="text"
              placeholder="Programming Language"
              value={artifactFields.programmingLanguage}
              onChange={e => setArtifactFields({ ...artifactFields, programmingLanguage: e.target.value })}
              className={styles.modalInput}
            />
            <input
              type="text"
              placeholder="Framework"
              value={artifactFields.framework}
              onChange={e => setArtifactFields({ ...artifactFields, framework: e.target.value })}
              className={styles.modalInput}
            />
            <input
              type="text"
              placeholder="License Type"
              value={artifactFields.licenseType}
              onChange={e => setArtifactFields({ ...artifactFields, licenseType: e.target.value })}
              className={styles.modalInput}
            />
            <div className={styles.modalButtons}>
              <button type="submit" className={styles.modalButton}>
                Add
              </button>
              <button type="button" className={styles.modalButton} onClick={() => {
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      );
    }
    if (modal === "addVersion") {
      return (
        <div className={styles.modalBackdrop}>
          <form
            className={styles.modal}
            onSubmit={e => {
              e.preventDefault();
              submitAddVersion();
            }}
            tabIndex={-1}
            onKeyDown={event => {
              if (
                ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") ||
                event.key === "Escape"
              ) {
                event.preventDefault();
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }
            }}
          >
            <h3 className={styles.modalTitle}>Add Version</h3>
            <input
              type="text"
              placeholder="Version (x.x.x)"
              value={versionFields.versionNumber}
              onChange={e => setVersionFields({ ...versionFields, versionNumber: e.target.value })}
              className={styles.modalInput}
              autoFocus
            />
            <input
              type="text"
              placeholder="Changes"
              value={versionFields.changes}
              onChange={e => setVersionFields({ ...versionFields, changes: e.target.value })}
              className={styles.modalInput}
            />
            <input
              type="url"
              placeholder="Download URL"
              value={versionFields.downloadUrl}
              onChange={e => setVersionFields({ ...versionFields, downloadUrl: e.target.value })}
              className={styles.modalInput}
            />
            <div className={styles.modalButtons}>
              <button type="submit" className={styles.modalButton}>
                Add
              </button>
              <button type="button" className={styles.modalButton} onClick={() => {
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      );
    }
    if (modal === "showVersions") {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Artifact Versions</h3>
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
              <button className={styles.modalButton} onClick={() => {
                setModal(null);
                setTimeout(() => treeRootRef.current?.focus(), 0);
              }}>Close</button>
            </div>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div style={{ color: "red" }}>{error}</div>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButton}
                onClick={() => {
                  setError(null);
                  setModal(null);
                  setTimeout(() => treeRootRef.current?.focus(), 0);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div
      className={styles.treeWrapper}
      tabIndex={0}
      ref={treeRootRef}
      style={{ outline: "none" }}
    >
      {renderIndentationInput()}
      {renderBreadcrumb()}
      {nodesToDisplay.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          indentation={indentation}
          onToggle={handleToggle}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          draggingNodeId={draggingNodeId}
          dragOver={dragOver}
          onArtifactContextMenu={handleArtifactContextMenu}
          onDoubleClick={handleDoubleClick}
          selectedCategoryId={selectedCategoryId}
          selectedArtifactId={selectedArtifactId}
          onNodeClick={handleNodeClick}
          onArtifactClick={handleArtifactClick}
        />
      ))}

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
          <div className={styles.contextMenuItem} onClick={() => handleShowVersions(artifactMenu.artifact?.id)}>
            Display all versions
          </div>
        </div>
      )}

      {(modal || error) && createPortal(renderModal(), document.body)}
    </div>
  );
};

export default TreeView;