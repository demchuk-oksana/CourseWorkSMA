import React, { useState, useRef } from "react";
import { Category, Artifact } from "../../types/category";
import styles from "./TreeView.module.css";
import clsx from "clsx";

interface TreeNodeProps {
  node: Category;
  level: number;
  onToggle: (id: number) => void;
  onContextMenu: (event: React.MouseEvent, node: Category) => void;
  onDragStart: (event: React.DragEvent, node: Category) => void;
  onDragOver: (event: React.DragEvent, node: Category) => void;
  onDrop: (event: React.DragEvent, node: Category) => void;
  draggingNodeId: number | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onToggle,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  draggingNodeId,
}) => {
  const isDragging = draggingNodeId === node.id;
  const indent = { marginLeft: `${level * 24}px` };

  return (
    <div>
      <div
        className={clsx(styles.nodeHeader, styles[`level${level}`], {
          [styles.dragging]: isDragging,
        })}
        style={indent}
        onContextMenu={(e) => onContextMenu(e, node)}
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDrop={(e) => onDrop(e, node)}
      >
        {node.subcategories && node.subcategories.length > 0 ? (
          <span className={styles.expandIcon} onClick={() => onToggle(node.id)}>
            {node.isExpanded ? "▼" : "▶"}
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
                onToggle={onToggle}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                draggingNodeId={draggingNodeId}
              />
            ))}
          {node.artifacts &&
            node.artifacts.map((artifact: Artifact) => (
              <div
                key={artifact.id}
                className={styles.artifactRow}
                style={{ marginLeft: (level + 1) * 24 }}
              >
                <span className={styles.artifactIcon}>📄</span>
                {artifact.name}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;