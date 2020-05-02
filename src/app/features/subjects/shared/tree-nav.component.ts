import {
  AfterContentInit,
  AfterViewInit, ChangeDetectorRef,
  Component,
  Directive, forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit, Optional, QueryList,
  SimpleChanges, SkipSelf,
  TemplateRef,
  ViewChild, ViewChildren,
  ViewContainerRef
} from '@angular/core';
import {SubjectNode, subjectNodeChildren, SubjectNodeType} from '../../../common/model-types/subjects';
import {CdkTreeNodeOutlet, FlatTreeControl, NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeNestedDataSource, MatTreeNodeOutlet} from '@angular/material/tree';
import {asyncScheduler, AsyncSubject, BehaviorSubject, defer, Observable, of, timer} from 'rxjs';
import {map, observeOn, switchMapTo, switchMap, shareReplay, startWith, withLatestFrom, tap} from 'rxjs/operators';
import {CdkPortal, CdkPortalOutlet, Portal, PortalOutlet, TemplatePortal} from '@angular/cdk/portal';
import {OrderedMap} from 'immutable';

type LayoutStrategy = 'nested' | 'expand';

@Directive({
  selector: '[subjectsTreeNavExtendLayout]'
})
export class TreeNavExtendLayoutDirective extends TemplatePortal<EmbeddedSubjectNodeView> {

  /**
   * The offset of the parent (in pixels) from the top of the tree nav.
   */
    // tslint:disable-next-line:no-input-rename
  @Input('subjectsTreeNavExtendLayoutViewContext')
  viewAttributes: {
    isActive: boolean;
    isExpanded: boolean;
    parentOffset: number;
  } | undefined;

  @Input('subjectsTreeNavExtendLayout')
  viewContext: SubjectNodeView | undefined;

  set context(value: EmbeddedSubjectNodeView) {
    this.viewContext = this.viewAttributes = value;
  }
  get context() {
    if (this.viewContext === undefined || this.viewAttributes === undefined) {
      throw new Error('No node view available');
    }

    return embeddedSubjectNodeView(this.viewContext, this.viewAttributes);
  }

  constructor(
    readonly templateRef: TemplateRef<any>,
    readonly viewContainerRef: ViewContainerRef,
    readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super(templateRef, viewContainerRef);
  }

  ngOnDestroy() {
    console.log('destroying', this.context.subjectNode);
  }
}


interface SubjectNodeView {
  readonly parentView?: SubjectNodeView;

  readonly subjectNode: SubjectNode;

  readonly name: string;
  readonly children: SubjectNodeView[];
  readonly routerLink: any[];
}

export interface EmbeddedSubjectNodeView extends SubjectNodeView {
  readonly isActive: boolean;
  readonly isExpanded: boolean;
  readonly parentOffset: number;
}

function fromSubjectNode(node: SubjectNode, parentView?: SubjectNodeView) {
  const view: any = {
    parentView,
    subjectNode: node,
    name: node.name,
    routerLink: ['/subjects', node.type, node.id],
  };
  const nodeChildren = ['lesson', 'lesson-outcome'].includes(node.type) ? [] : subjectNodeChildren(node);
  view.children = nodeChildren.map((n) => fromSubjectNode(n, view));
  return view;
}

function embeddedSubjectNodeView(view: SubjectNodeView, viewAttributes: {
  isActive: boolean;
  isExpanded: boolean;
  parentOffset: number;
}): EmbeddedSubjectNodeView {
  return {
    ...view,
    ...viewAttributes
  };
}


@Component({
  selector: 'subjects-tree-nav',
  template: `
    <mat-tree [dataSource]="treeData" [treeControl]="treeControl">
      <mat-tree-node *matTreeNodeDef="let view"
                     matTreeNodePadding
                     [class.active]="view.isActive">
        <li class="mat-tree-node">
          <ng-container *ngTemplateOutlet="(nodeTemplate || _defaultNodeTemplate); context: view"></ng-container>
        </li>
      </mat-tree-node>

      <mat-nested-tree-node #treeNode
                            *matTreeNodeDef="let view; when: nodeHasChild">
                            <!-- (mouseleave)="collapseExpandedViewIfNoChildSelected(view)"-->
        <ng-container [ngSwitch]="layoutStrategy">
          <!-- Nested layout strategy -->
          <div class="mat-tree-node layout-nested" *ngSwitchCase="'nested'">
            <button mat-icon-button matTreeNodeToggle>
              <mat-icon class="mat-icon-rtl-mirror">{{treeControl.isExpanded(view) ? 'expand_more' : 'chevron_right'}}</mat-icon>
            </button>
            <ng-container *ngTemplateOutlet="(nodeTemplate || _defaultNodeTemplate); context: view"></ng-container>
            <div class="node-children">
              <ng-container matTreeNodeOutlet></ng-container>
            </div>
          </div>

          <!-- expand layout strategy -->
          <div class="mat-tree-node layout-expand" *ngSwitchCase="'expand'"
               (mouseenter)="expandView(view)">
            <ng-container *ngTemplateOutlet="(nodeTemplate || _defaultNodeTemplate); context: view"></ng-container>

            <ng-container *ngIf="treeControl.isExpanded(view)">
              <div class="node-children" *subjectsTreeNavExtendLayout="view; viewContext: {
                isActive: isActiveNode(view),
                isExpanded: treeControl.isExpanded(view),
                parentOffset: treeNode.offsetTop
              }">
                <ng-container matTreeNodeOutlet></ng-container>
              </div>
            </ng-container>
          </div>
        </ng-container>
      </mat-nested-tree-node>
    </mat-tree>

    <ng-container *ngIf="portalsSubject | async as portals">
      <ng-container *ngFor="let portal of portals">
        <div [style.marginTop.px]="portal.context.parentOffset">
          <ng-template [cdkPortalOutlet]="portal"></ng-template>
        </div>
      </ng-container>
    </ng-container>

    <ng-template #defaultNodeTemplate let-subjectNode="subjectNode" let-routerLink="routerLink">
      <a [routerLink]="routerLink">{{subjectNode.name}}</a>
    </ng-template>
  `,
  styles: [`
    :host {
      display: flex;
      position: relative;
    }
    .expansion {
      display: flex;
    }
  `]
})
export class SubjectsTreeNavComponent implements OnChanges, AfterViewInit {
  static readonly NODE_LEVELS = ['subject', 'unit', 'block', 'lesson', 'lesson-outcome'];

  @Input() root: SubjectNode | undefined;

  @ViewChild('defaultNodeTemplate', {static: true})
  // tslint:disable-next-line:variable-name
  readonly _defaultNodeTemplate: TemplateRef<SubjectNodeView> | undefined;
  @Input() nodeTemplate: TemplateRef<SubjectNodeView & { readonly isExpanded: boolean; }>;

  /**
   * These are relevant to the 'expansion' layout strategy.
   *
   * The children of a tree node are associated with a CdkTemplatePortal, and an
   * outlet is placed in the host container, projecting the nested children outside
   * the node, and allowing them to be positioned as siblings of the tree.
   *
   */
  @ViewChildren(TreeNavExtendLayoutDirective)
  // tslint:disable-next-line:variable-name
  protected readonly _childElementPortals: QueryList<TemplatePortal<EmbeddedSubjectNodeView>>;
  readonly portalsSubject = new BehaviorSubject<TemplatePortal<EmbeddedSubjectNodeView>[]>([]);

  @ViewChildren(CdkPortalOutlet)
  // tslint:disable-next-line:variable-name
  protected readonly _portalOutlets: QueryList<PortalOutlet>;

  getNodeDepth(node: SubjectNode): number {
    const nodeLevels = SubjectsTreeNavComponent.NODE_LEVELS;
    if (this.root == null) {
      throw new Error('Root was null');
    }
    return nodeLevels.indexOf(node.type) - nodeLevels.indexOf(this.root.type);
  }

  @Input() layoutStrategy: LayoutStrategy = 'nested';

  readonly treeControl = new NestedTreeControl<SubjectNodeView>(view => view.children);
  readonly treeData = new MatTreeNestedDataSource<SubjectNodeView>();

  ngAfterViewInit() {
    this._childElementPortals.changes.pipe(
      map(queryList => queryList.toArray()),
      tap(portals =>
        // Since we're updating these in a lifecycle hook, trigger change detection manually
        // on all of the portals.
        portals.forEach(portal => {
          const cd = (portal as TreeNavExtendLayoutDirective).changeDetectorRef;
          if (cd) { cd.detectChanges(); }
        })
      ),
      // And observe on the async scheduler in order to push mutations to `portalsSubject`
      // out of the current hook.
      observeOn(asyncScheduler),
    ).subscribe(this.portalsSubject);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.layoutStrategy) {
      console.log('layout strategy', changes.layoutStrategy);
    }

    if (changes.root && changes.root.currentValue) {
      const root = changes.root.currentValue;
      const rootView = fromSubjectNode(root);
      this.treeData.data = rootView.children;
    }
  }

  isActiveNode(node: SubjectNode) {
    return false;
  }

  nodeHasChild(_, node: SubjectNodeView) {
    return node.children.length > 0;
  }

  expandView(view: SubjectNodeView) {
    console.log('expanding view', view);
    this.treeControl.collapseAll();
    this.treeControl.expand(view);
    while (view.parentView != null) {
      this.treeControl.expand(view.parentView);
      view = view.parentView;
    }
  }
}


