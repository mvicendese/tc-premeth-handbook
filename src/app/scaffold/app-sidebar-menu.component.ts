import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from '../app-state.service';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {filter, first, map, shareReplay, skipWhile, withLatestFrom} from 'rxjs/operators';
import {ActivationStart, Router, UrlSegment} from '@angular/router';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {ModelRef, modelRefId} from '../common/model-base/model-ref';
import {FormControl, FormGroup} from '@angular/forms';
import {Block, Unit} from '../common/model-types/subjects';
import {SubjectClass} from '../common/model-types/schools';

export interface MenuNode {
  readonly name: string;
  readonly level: number;
  readonly children?: MenuNode[];
  readonly routerLink?: any[];
  readonly isActiveForUrl?: (segments: UrlSegment[]) => boolean;
}

export interface FlattenedMenuNode extends MenuNode {
  expandable: boolean;
}

export function isEqualNodes(a: MenuNode | FlattenedMenuNode, b?: MenuNode | FlattenedMenuNode) {
  return !!b
      && b.name === a.name
      && b.level === a.level;

}

export function flattenMenuNode(node: MenuNode, level: number): FlattenedMenuNode {
  return {
    expandable: Array.isArray(node.children),
    name: node.name,
    routerLink: node.routerLink,
    level
  };
}

function isActiveMenuNode(node: MenuNode, url: UrlSegment[]) {
  return node.isActiveForUrl && node.isActiveForUrl(url);
}

/**
 * Gets the path of nodes from the root of the tree which are active
 *
 * @param tree: MenuNode[]
 * @param url: UrlSegment[]
 * The absolute route from the root of the application
 */
function getActiveMenuNodes(tree: MenuNode[], url: UrlSegment[]): MenuNode[] {
  return tree.reduce((acc, node) => {
    if (acc.length > 0) {
      return acc;
    }
    if (node.children) {
      const activeChild = getActiveMenuNodes(node.children, url);
      if (activeChild.length > 0) {
        return [node, ...activeChild];
      }
    }
    return isActiveMenuNode(node, url) ? [node] : [];
  }, [] as MenuNode[]);
}

function unitsMenu(allUnits: readonly Unit[], level: number = 0): MenuNode {
  return {
    name: 'Units',
    level,
    children: allUnits.map(unit => unitMenuNode(unit, level + 1))
  };
}

function isUnitDetailsUrl(unit: ModelRef<Unit>, url: UrlSegment[]) {
  return url.length >= 2
      && url[0].path === 'units'
      && url[1].path === modelRefId(unit);
}

function isUnitBlockDetailsUrl(block: Block, url: UrlSegment[]) {
  return isUnitDetailsUrl(block.context.unit, url)
      && url.length >= 4
      && url[2].path === 'blocks'
      && url[3].path === block.id;
}

function isClassDetailsUrl(cls: SubjectClass, url: UrlSegment[]) {
  return url[0].path === 'classes'
      && url[1].path === cls.id;
}

function unitMenuNode(unit: Unit, level: number): MenuNode {
  return {
    name: unit.name,
    level,
    children: unit.blocks.map(block => unitBlockMenuNode(block, level + 1)),
    routerLink: ['/subjects/unit', unit.id],
    isActiveForUrl: (url) => isUnitDetailsUrl(unit, url)
  };
}

function unitBlockMenuNode(block: Block, level: number): MenuNode {
  return {
    name: block.name,
    level,
    routerLink: ['/subjects/block', block.id],
    isActiveForUrl: (url) => isUnitBlockDetailsUrl(block, url)
  };
}

function classesMenu(allClasses: readonly SubjectClass[], level: number = 0): MenuNode {
  return {
    name: 'Classes',
    level,
    children: allClasses.map(cls => classMenuNode(cls, level + 1)),
  };
}

function classMenuNode(subjectClass: SubjectClass, level: number): MenuNode {
  return {
    name: subjectClass.classCode,
    level,
    routerLink: ['/classes', subjectClass.id],
    isActiveForUrl: (url: UrlSegment[]) => isClassDetailsUrl(subjectClass, url)
  };
}

@Component({
  selector: 'app-sidebar-menu',
  template: `
    <header>
      <button mat-button [matMenuTriggerFor]="menu">Menu</button>

      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="openSubjectModal()">Set subject...</button>
      </mat-menu>
    </header>
    <main>
      <form [formGroup]="form">
        <mat-form-field>
          <mat-label>Class group</mat-label>
          <mat-select formControlName="subjectClass">
            <mat-option [value]="null">All students</mat-option>
            <mat-option *ngFor="let cls of (allSubjectClasses$ | async)" [value]="cls.id">
              {{cls.classCode}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      <mat-tree [dataSource]="treeData" [treeControl]="treeControl">
        <mat-tree-node *matTreeNodeDef="let node"
                       matTreeNodePadding
                       [class.active]="isActiveNode(node) | async">
          <button mat-icon-button disabled></button>
          <ng-container *ngTemplateOutlet="maybeLink; context: {node: node}"></ng-container>
        </mat-tree-node>

        <mat-tree-node *matTreeNodeDef="let node; when: menuNodeHasChild" matTreeNodePadding
                       [class.active]="isActiveNode(node) | async">
          <button mat-icon-button matTreeNodeToggle [attr.aria-label]="'toggle ' + node.name">
            <mat-icon class="mat-icon-rtl-mirror">
              {{treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
            </mat-icon>
          </button>
          <ng-container *ngTemplateOutlet="maybeLink; context: {node: node}"></ng-container>
        </mat-tree-node>
      </mat-tree>
    </main>

    <ng-template #maybeLink let-node="node">
      <ng-container [ngSwitch]="node.routerLink != null">
        <a *ngSwitchCase="true" [routerLink]="node.routerLink">{{node.name}}</a>
        <ng-container *ngSwitchDefault>{{node.name}}</ng-container>
      </ng-container>
    </ng-template>
  `,
  styleUrls: [
    './app-sidebar-menu.component.scss'
  ]
})
export class AppSidebarMenuComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  readonly form = new FormGroup({
    selectedSubject: new FormControl(null),
    subjectClass: new FormControl({value: 'all'})
  });

  readonly allSubjectClasses$ = this.appState.allSubjectClasses$.pipe(
    shareReplay(1)
  );

  readonly allUnits$ = this.appState.subject$.pipe(
    skipWhile(subject => subject == null),
    map(subject => subject.units),
    shareReplay(1)
  );

  readonly menuData$ = combineLatest([this.allSubjectClasses$, this.allUnits$]).pipe(
    map(([allClasses, allUnits]) => [
      classesMenu(allClasses),
      unitsMenu(allUnits)
    ]),
    shareReplay(1)
  );

  readonly activeNodes$ = combineLatest([
    this.router.events.pipe(
      filter((event): event is ActivationStart => event instanceof ActivationStart)
    ),
    this.menuData$
  ]).pipe(
    map(([activationStart, menuData]) => {
      const snapshot = activationStart.snapshot;
      const url = [].concat(
        ...snapshot.pathFromRoot.map(path => path.url)
      );
      return getActiveMenuNodes(menuData, url);
    }),
    shareReplay(1)
  );

  readonly treeControl = new FlatTreeControl<MenuNode>(
    node => node.level,
    (node) => Array.isArray(node.children) && node.children.length > 0
  );

  readonly treeFlattener = new MatTreeFlattener(
    flattenMenuNode,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  readonly treeData = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    readonly router: Router,
    readonly appState: AppStateService,
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this.menuData$.subscribe(menuData => {
        this.treeData.data = menuData;
      })
    );
    this.subscriptions.push(
      this.activeNodes$.subscribe(activeNodes => {
        this.treeControl.collapseAll();
        activeNodes.forEach(activeNode => {
          const node = this.treeControl.dataNodes.find(n => isEqualNodes(activeNode, n));
          this.treeControl.expand(node);
        });
      })
    );

    this.subscriptions.push(
      this.form.valueChanges.pipe(
        map(values => values.subjectClass),
        withLatestFrom(this.allSubjectClasses$),
        map(([selectedId, allClasses]) => {
          return allClasses.find(cls => cls.id === selectedId) || null;
        })
      ).subscribe(
        subjectCls => {
          this.appState.setState('selectedClass', subjectCls);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions
      .filter(subscription => !subscription.closed)
      .forEach(subscription => subscription.unsubscribe());
  }

  openSubjectModal() {
    throw new Error('not implemented');
  }

  menuNodeHasChild = (index: number, node: { expandable: boolean }) => node.expandable;

  isActiveNode(node: MenuNode): Observable<boolean> {
    return this.activeNodes$.pipe(
      map(activeNodes => activeNodes.some(activeNode => isEqualNodes(activeNode, node))),
      first()
    );
  }
}
