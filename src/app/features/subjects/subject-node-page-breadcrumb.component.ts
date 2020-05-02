import {Component, HostBinding, Input, OnDestroy, OnInit} from '@angular/core';
import {SubjectNode, subjectNodeChildren, subjectNodePath} from '../../common/model-types/subjects';
import {Router} from '@angular/router';
import {ThemePalette} from '@angular/material/core';
import {SubjectNodePageContainerState} from './subject-node-page-container-state';
import {map, shareReplay, tap, distinctUntilChanged, distinctUntilKeyChanged, mapTo} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, Unsubscribable} from 'rxjs';

interface CrumbElement {
  readonly subjectNode: SubjectNode;
  readonly color: ThemePalette;
  readonly routerLink: any[];
}

function crumbElementFromSubjectNode(subjectNode: SubjectNode, options: {
  isActive?: boolean;
  isMenuTreeChild?: boolean;
} = {isActive: false, isMenuTreeChild: false}): CrumbElement {
  return {
    subjectNode,
    color: options.isActive ? 'primary' : undefined,
    routerLink: ['/subjects', subjectNode.type, subjectNode.id]
  };
}

interface BreadcrumbState {
  readonly pathElements: CrumbElement[];

  readonly menuTreeRootNode: SubjectNode;
  readonly menuTreeElements: CrumbElement[];

  readonly isMenuTreeOpen: boolean;
}

@Component({
  selector: 'subjects-node-page-breadcrumb',
  template: `
    <ng-container *ngIf="state$ | async as state">
      <div *ngFor="let element of state.pathElements"
           class="element-container">
        <a mat-stroked-button
           [color]="element.color"
           (mouseenter)="hoverNode(element.subjectNode)"
           [routerLink]="element.routerLink">
          <mat-icon inline>chevron_right</mat-icon>
          <ng-container [ngSwitch]="element.subjectNode.type">
            <span *ngSwitchCase="'subject'" class="element-details">
              $
            </span>

            <span *ngSwitchDefault class="element-details">
              <span class="element-type">{{element.subjectNode.type.toLocaleUpperCase()}}</span>
              <span>{{element.subjectNode.name}}</span>
            </span>
          </ng-container>
        </a>
      </div>

      <ng-container *ngIf="state.isMenuTreeOpen">
        <subjects-tree-nav [root]="state.menuTreeRootNode"
                           layoutStrategy="expand"
                           [nodeTemplate]="menuTreeNodeTemplate">
        </subjects-tree-nav>
     </ng-container>
    </ng-container>

    <ng-template #menuTreeNodeTemplate let-subjectNode="subjectNode" let-routerLink="routerLink">
      <div class="element-container">
        <a mat-stroked-button [routerLink]="routerLink">
          <span class="element-details">
            <span class="element-type">{{subjectNode.type.toLocaleUpperCase()}}</span>
            <span class="element-name">{{subjectNode.name}}</span>
          </span>
        </a>
      </div>
    </ng-template>
  `,
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    '(mouseleave)': 'hoverNode(null)'
  },
  styles: [`
    :host {
      display: flex;
      align-items: start;
    }

    :host ::ng-deep .element-container {
      padding-left: 1em;
      margin-bottom: 1em;
      text-align: start;
    }

    :host ::ng-deep subjects-tree-nav .element-container,
    :host ::ng-deep subjects-tree-nav .element-container a {
      width: 100%;
    }

    :host ::ng-deep .element-container mat-icon,
    :host ::ng-deep .element-container .element-details {
      font-weight: 500;
      font-size: 24px;
      line-height: 48px;
    }

    :host ::ng-deep .element-details {
      display: inline-block;
      position: relative;
      margin-top: 6px;
      width: 100%;
      text-align: start;
    }

    :host ::ng-deep .element-details > .element-type {
      position: absolute;
      font-size: 10px;
      line-height: 10px;
      color: #4f4f4f;
      top: 4px;
    }
  `]
})
export class SubjectNodePageBreadcrumbComponent implements OnInit, OnDestroy {
private resources: Unsubscribable[] = [];
  protected readonly hoverNodeSubject = new BehaviorSubject<SubjectNode | null>(null);
  protected readonly isMenuTreeOpenSubject = new BehaviorSubject<boolean>(false);

  readonly pageNode$: Observable<SubjectNode> = this.subjectNodePageState.subjectNode$.pipe(
    shareReplay(1)
  );

  readonly state$: Observable<BreadcrumbState> = combineLatest([
    this.pageNode$,
    this.hoverNodeSubject.pipe(distinctUntilChanged()),
    this.isMenuTreeOpenSubject.pipe(distinctUntilChanged())
  ]).pipe(
    map(([pageNode, hoverNode, isMenuTreeOpen]) => {
      const menuTreeRootNode = hoverNode || pageNode;
      const hasChildren = isMenuTreeOpen && (!['lesson', 'lesson-outcome'].includes(menuTreeRootNode.type));

      return {
        menuTreeRootNode,
        pathElements: subjectNodePath(menuTreeRootNode).map(
          pathNode => crumbElementFromSubjectNode(
            pathNode,
            {isActive: (pathNode === pageNode) || isMenuTreeOpen}
          )
        ),
        menuTreeElements: (hasChildren ? subjectNodeChildren(menuTreeRootNode) : []).map(
          childNode => crumbElementFromSubjectNode(childNode, {
            isMenuTreeChild: true
          })
        ),
        isMenuTreeOpen
      };
    }),
    shareReplay(1)
  );

  constructor(
    readonly subjectNodePageState: SubjectNodePageContainerState
  ) {
  }

  ngOnInit() {
    this.resources.push(
      this.subjectNodePageState.subjectNode$.pipe(
        tap(subjectNode => console.log('new subject node', subjectNode)),
        mapTo(false)
      ).subscribe(this.isMenuTreeOpenSubject)
    ) ;

    this.resources.push(this.state$.subscribe());
  }

  ngOnDestroy(): void {
    this.isMenuTreeOpenSubject.complete();
    this.hoverNodeSubject.complete();
    this.resources.forEach(r => r.unsubscribe());
  }

  hoverNode(node: SubjectNode | null) {
    this.hoverNodeSubject.next(node);
    this.isMenuTreeOpenSubject.next(node != null);
  }
}
