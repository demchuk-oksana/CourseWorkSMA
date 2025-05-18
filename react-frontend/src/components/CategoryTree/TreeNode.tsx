import React, { useRef } from "react";
import { Category } from "../../types/category";
import { Artifact } from "../../types/artifact";
import styles from "./TreeView.module.css";
import clsx from "clsx";

interface TreeNodeProps {
  node: Category;
  level: number;
  indentation?: number;
  onToggle: (id: number) => void;
  onContextMenu: (event: React.MouseEvent, node: Category) => void;
  onDragStart: (event: React.DragEvent, node: Category) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDragOver: (
    event: React.DragEvent,
    node: Category,
    nodeElement: HTMLElement
  ) => void;
  onDrop: (
    event: React.DragEvent,
    node: Category,
    nodeElement: HTMLElement
  ) => void;
  draggingNodeId: number | null;
  dragOver?: { nodeId: number; position: "above" | "below" | "inside" | null } | null;
  onArtifactContextMenu?: (event: React.MouseEvent, artifact: Artifact, categoryId: number) => void;
  onDoubleClick?: (node: Category) => void;
  // Selection
  selectedCategoryId?: number | null;
  selectedArtifactId?: number | null;
  onNodeClick?: (categoryId: number) => void;
  onArtifactClick?: (artifactId: number, categoryId: number) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  indentation = 24,
  onToggle,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggingNodeId,
  dragOver,
  onArtifactContextMenu,
  onDoubleClick,
  selectedCategoryId,
  selectedArtifactId,
  onNodeClick,
  onArtifactClick,
}) => {
  const isDragging = draggingNodeId === node.id;
  const indent = { marginLeft: `${level * indentation}px` };
  const ref = useRef<HTMLDivElement>(null);

  let dragOverStyle: React.CSSProperties = {};
  if (dragOver && dragOver.nodeId === node.id) {
    if (dragOver.position === "above") {
      dragOverStyle = { borderTop: "2px solid #2196f3" };
    } else if (dragOver.position === "below") {
      dragOverStyle = { borderBottom: "2px solid #2196f3" };
    } else if (dragOver.position === "inside") {
      dragOverStyle = { background: "#e3f2fd" };
    }
  }

  const isExpandable = true;
  const isSelected = selectedCategoryId === node.id && !selectedArtifactId;

  return (
    <div>
      <div
        ref={ref}
        className={clsx(styles.nodeHeader, styles[`level${level}`], {
          [styles.dragging]: isDragging,
          [styles.selected]: isSelected,
        })}
        style={{ ...indent, ...dragOverStyle }}
        onContextMenu={(e) => onContextMenu(e, node)}
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragEnd={onDragEnd}
        onDragOver={
          (e) => {
            if (ref.current) onDragOver(e, node, ref.current);
          }
        }
        onDrop={
          (e) => {
            if (ref.current) onDrop(e, node, ref.current);
          }
        }
        onDoubleClick={() => onDoubleClick && onDoubleClick(node)}
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick && onNodeClick(node.id);
        }}
        tabIndex={-1}
      >
        {isExpandable ? (
          <span className={styles.expandIcon} onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}>
            {node.isExpanded ? "\u25bc" : "\u25b6"}
          </span>
        ) : (
          <span className={styles.expandSpacer} />
        )}
        <span className={styles.folderIcon}>📁</span>
        <span className={styles.nodeName}>{node.name}</span>
      </div>
      {node.isExpanded && (
        <div>
          {node.subcategories &&
            node.subcategories.map((sub) => (
              <TreeNode
                key={sub.id}
                node={sub}
                level={level + 1}
                indentation={indentation}
                onToggle={onToggle}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                draggingNodeId={draggingNodeId}
                dragOver={dragOver}
                onArtifactContextMenu={onArtifactContextMenu}
                onDoubleClick={onDoubleClick}
                selectedCategoryId={selectedCategoryId}
                selectedArtifactId={selectedArtifactId}
                onNodeClick={onNodeClick}
                onArtifactClick={onArtifactClick}
              />
            ))}
          {node.artifacts &&
            node.artifacts.map((artifact: Artifact) => {
              const isArtifactSelected = selectedArtifactId === artifact.id && selectedCategoryId === node.id;
              return (
                <div
                  key={artifact.id}
                  className={clsx(styles.artifactRow, { [styles.selected]: isArtifactSelected })}
                  style={{ marginLeft: ((level + 1) * indentation) }}
                  onContextMenu={onArtifactContextMenu
                    ? (e) => {
                        e.stopPropagation();
                        onArtifactContextMenu(e, artifact, node.id);
                      }
                    : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onArtifactClick && onArtifactClick(artifact.id, node.id);
                  }}
                  tabIndex={-1}
                >
                  <span className={styles.artifactIcon}>📄</span>
                  {artifact.title}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default TreeNode;