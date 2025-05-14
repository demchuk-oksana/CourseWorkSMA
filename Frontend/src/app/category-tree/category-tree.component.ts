import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-category-tree',
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent {
  @Input() treeData: any[] = []; // Accept tree data as input from the parent component

  // Toggle the expanded state of a node
  toggleExpand(node: any): void {
    node.isExpanded = !node.isExpanded;
    console.log(`Toggled node (${node.name}) to ${node.isExpanded ? 'expanded' : 'collapsed'}`);
  }
}