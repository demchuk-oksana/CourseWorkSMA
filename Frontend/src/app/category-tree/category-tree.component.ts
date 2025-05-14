import { Component, Input, OnInit } from '@angular/core';
import { CategoryTreeService } from '../../services/category-tree.service';

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent implements OnInit {
  @Input() treeData: any[] = [];

  constructor(private categoryService: CategoryTreeService) {}

  ngOnInit(): void {
    if (this.treeData.length === 0) {
      this.fetchTreeData();
    }
  }

  fetchTreeData(): void {
    this.categoryService.getCategoryTree().subscribe(
      (data) => {
        this.treeData = data;
      },
      (error) => {
        console.error('Error fetching category tree:', error);
      }
    );
  }

  toggleExpand(node: any): void {
    node.isExpanded = !node.isExpanded;
  }

  onDragStart(event: DragEvent, node: any): void {
    event.dataTransfer?.setData('text/plain', JSON.stringify(node));
  }

  onDrop(event: DragEvent, parentNode: any): void {
    event.preventDefault();
    const draggedNode = JSON.parse(event.dataTransfer?.getData('text/plain') || '{}');
    this.categoryService.rearrangeCategory(draggedNode.id, parentNode.id).subscribe(
      () => {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(draggedNode);
      },
      (error) => {
        console.error('Error rearranging category:', error);
      }
    );
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onContextMenu(event: MouseEvent, node: any): void {
    event.preventDefault();
    alert(`Context menu for ${node.name}`);
  }
}