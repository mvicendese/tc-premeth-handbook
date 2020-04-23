import {Component, Input, SimpleChanges} from '@angular/core';
import {SubjectNode, subjectNodeChildren, SubjectNodeType} from '../../../common/model-types/subjects';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {Observable, of} from 'rxjs';


interface SubjectNodeView {
  readonly subjectNodeType: SubjectNodeType;
  readonly subjectNodeId: string;

  readonly name: string;
  readonly children: SubjectNodeView[];
  readonly routerLink?: any[];

  readonly isActive: Observable<boolean>;
}
function fromSubjectNode(node: SubjectNode, isActive: (node: SubjectNode) => Observable<boolean>): SubjectNodeView {
  return {
    subjectNodeType: node.type,
    subjectNodeId: node.id,
    name: node.name,
    children: subjectNodeChildren(node).map((n) => fromSubjectNode(n, isActive)),
    isActive: isActive(node)
  };
}


interface FlattenedSubjectNodeView extends SubjectNodeView {
  readonly level: number;
  readonly isExpandable: boolean;
}
function flattenNode<T extends SubjectNodeView>(node: SubjectNodeView, level: number): FlattenedSubjectNodeView {
  return {...node, level, isExpandable: node.children.length > 0};
}

function isEqualNodes(a: SubjectNodeView, b?: SubjectNodeView | null) {
  return b && (a.subjectNodeId == b.subjectNodeId);
}


@Component({
  selector: 'subjects-tree-nav',
  template: `
    <mat-tree [dataSource]="treeData" [treeControl]="treeControl">
      <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding [class.active]="node.isActive | async">
        <button mat-icon-button disabled></button>
        {{node.name}}}
      </mat-tree-node>

      <mat-tree-node *matTreeNodeDef="let node; when: nodeHasChild"
                     matTreeNodePadding
                     [class.active]="node.isActive | async">
        <button mat-icon-button matTreeNodeToggle>
          <mat-icon class="mat-icon-rtl-mirror">
            {{treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
          </mat-icon>
          <a [routerLink]="['/subjects', node.subjectNodeType, node.subjectNodeId]">{{node.name}}</a>
        </button>
      </mat-tree-node>
    </mat-tree>
  `
})
export class SubjectsTreeNavComponent {
  static readonly NODE_LEVELS = ['subject', 'unit', 'block', 'lesson', 'lesson-outcome'];

  @Input() root: SubjectNode | undefined;

  readonly treeControl = new FlatTreeControl<SubjectNodeView>(
    node => this.getNodeLevel(node),
    node => node.children.length > 0
  );

  readonly treeFlattener = new MatTreeFlattener<SubjectNodeView, FlattenedSubjectNodeView>(
    flattenNode,
    node => node.level,
    node => node.isExpandable,
    node => node.children
  );
  readonly treeData = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  ngOnChanges(changes: SimpleChanges) {
    if (changes.root && changes.root.currentValue) {
      const root = changes.root.currentValue;
      const rootView = fromSubjectNode(root, (node) => this.isActiveNode(node));
      this.treeData.data = rootView.children;
    }
  }

  protected getNodeLevel(node: SubjectNodeView) {
    if (this.root == null) {
      return 0;
    }
    const nodeLevel = SubjectsTreeNavComponent.NODE_LEVELS.indexOf(node.subjectNodeType);
    const rootLevel = SubjectsTreeNavComponent.NODE_LEVELS.indexOf(this.root.type);
    return nodeLevel - rootLevel;
  }

  protected isActiveNode(node: SubjectNode) {
    return of(false);
  }

  nodeHasChild(_, node: SubjectNodeView) {
    return node.children.length > 0;
  }
}
