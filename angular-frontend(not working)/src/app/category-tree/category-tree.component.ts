import { Component, Input, OnInit } from '@angular/core';
import { CategoryTreeService } from '../services/category-tree.service';

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent implements OnInit {
  @Input() treeData: any[] = []; // Input for hierarchical data

  // Context menu state
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedNode: any = null;

  constructor(private categoryService: CategoryTreeService) {}

  ngOnInit(): void {}

  // Toggle expand/collapse state
  toggleExpand(node: any): void {
    node.isExpanded = !node.isExpanded;
  }

  // Drag-and-drop: Handle drag start
  onDragStart(event: DragEvent, node: any): void {
    event.dataTransfer?.setData('text/plain', JSON.stringify(node));
    event.dataTransfer?.setDragImage(event.target as HTMLElement, 0, 0);
  }

  // Drag-and-drop: Allow drop
  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  // Drag-and-drop: Handle drop
  onDrop(event: DragEvent, targetNode: any): void {
    event.preventDefault();
    const draggedNode = JSON.parse(event.dataTransfer?.getData('text/plain') || '{}');

    if (draggedNode.id !== targetNode.id) {
      // Update backend with the new hierarchy
      this.categoryService.rearrangeCategory(draggedNode.id, targetNode.id).subscribe(
        () => {
          // Update tree structure locally
          targetNode.subcategories = targetNode.subcategories || [];
          targetNode.subcategories.push(draggedNode);
          draggedNode.parentCategoryId = targetNode.id;
        },
        (error) => {
          console.error('Error rearranging category:', error);
        }
      );
    }
  }

  // Context menu: Open
  onContextMenu(event: MouseEvent, node: any): void {
    event.preventDefault();
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedNode = node;
    this.contextMenuVisible = true;
  }

  // Context menu: Close
  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  // Context menu: Add subcategory
  addSubcategory(): void {
    const subcategoryName = prompt('Enter a name for the new subcategory:');
    if (subcategoryName) {
      this.categoryService.createCategory(subcategoryName, this.selectedNode.id).subscribe(
        (newCategory) => {
          this.selectedNode.subcategories = this.selectedNode.subcategories || [];
          this.selectedNode.subcategories.push(newCategory);
        },
        (error) => {
          console.error('Error creating subcategory:', error);
        }
      );
    }
    this.closeContextMenu();
  }

  // Context menu: Rename category
  renameCategory(): void {
    const newName = prompt('Enter a new name for this category:', this.selectedNode.name);
    if (newName) {
      this.categoryService.renameCategory(this.selectedNode.id, newName).subscribe(
        () => {
          this.selectedNode.name = newName;
        },
        (error) => {
          console.error('Error renaming category:', error);
        }
      );
    }
    this.closeContextMenu();
  }

  // Context menu: Delete category
  deleteCategory(): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(this.selectedNode.id).subscribe(
        () => {
          const parent = this.findParentNode(this.selectedNode, this.treeData);
          if (parent) {
            parent.subcategories = parent.subcategories.filter((c: any) => c.id !== this.selectedNode.id);
          }
        },
        (error) => {
          console.error('Error deleting category:', error);
        }
      );
    }
    this.closeContextMenu();
  }

  // Helper: Find the parent of a node
  private findParentNode(targetNode: any, nodes: any[]): any {
    for (const node of nodes) {
      if (node.subcategories?.some((c: any) => c.id === targetNode.id)) {
        return node;
      }
      const parent = this.findParentNode(targetNode, node.subcategories || []);
      if (parent) {
        return parent;
      }
    }
    return null;
  }
}