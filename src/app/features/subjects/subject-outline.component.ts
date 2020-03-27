import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {filter, map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {Unit} from '../../common/model-types/unit';
import {LessonSchema} from '../../common/model-types/lesson-schema';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Subscription} from 'rxjs';
import {UnitBlock} from '../../common/model-types/unit-block';
import {LessonOutcome} from '../../common/model-types/lesson-outcome';
import {SubjectService} from '../../common/model-services/subject.service';
import {AppStateService} from '../../app-state.service';

type TopicNode = Unit | UnitBlock | LessonSchema;

function getTopicNodeChildren(node: TopicNode): TopicNode[] {
  switch (node.type) {
    case 'unit':
      return node.blocks;
    case 'unit-block':
      return node.lessons;
    case 'lesson':
      return [];
  }
}

function topicNodeHasChildren(node: TopicNode) {
  return !(node instanceof LessonSchema);
}

@Component({
  selector: 'app-admin-subject-details',
  template: `
    <ng-container *ngIf="(subject$ | async) as subject">
      {{subject.key}}

      <mat-tree [dataSource]="topicTreeDataSource" [treeControl]="topicTreeControl" class="topic-tree">
        <mat-tree-node *matTreeNodeDef="let node" matTreeNodeToggle>
          <li class="mat-tree-node">
            <button mat-icon-button disabled></button>
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <span class="lesson-code">{{node.code}}</span>&nbsp;
                <span class="lesson-name">{{node.name}}</span>
              </mat-expansion-panel-header>

              <div>
                <h3>Outcomes</h3>
                <ul>
                    <li *ngFor="let outcome of node.outcomes">
                    {{outcome.description}}
                    </li>
                </ul>
                <h3>Examples</h3>
                <ul>
                  <li *ngFor="let example of node.exampleDescriptions">
                    {{example}}
                  </li>
                </ul>
              </div>

            </mat-expansion-panel>
          </li>
        </mat-tree-node>

        <mat-nested-tree-node *matTreeNodeDef="let node; when: nodeHasChild">
          <li>
            <div class="mat-tree-node">
              <button mat-icon-button matTreeNodeToggle>
                <mat-icon class="mat-icon-rtl-mirror">
                    {{topicTreeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
                </mat-icon>
              </button>
              <ng-container [ngSwitch]="node.type">
                <span *ngSwitchCase="'unit'">{{node.name}}</span>
                <span *ngSwitchCase="'unit-block'">{{node.name}}</span>
              </ng-container>
            </div>
            <ul [class.example-tree-invisible]="!topicTreeControl.isExpanded(node)">
                <ng-container matTreeNodeOutlet></ng-container>
            </ul>
          </li>

        </mat-nested-tree-node>
      </mat-tree>
    </ng-container>
  `,
  styleUrls: ['./subject-outline.component.scss']
})
export class SubjectOutlineComponent implements OnInit, OnDestroy {
  readonly subject$ = this.appState.subject$.pipe(
    shareReplay(1)
  );

  readonly topicTreeControl = new NestedTreeControl<TopicNode>(getTopicNodeChildren);
  readonly topicTreeDataSource = new MatTreeNestedDataSource<TopicNode>();

  private subscriptions: Subscription[] = [];

  constructor(
    readonly appState: AppStateService
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(this.subject$.pipe(
      filter(subject => subject != null),
    ).subscribe(subject => {
      this.topicTreeDataSource.data = subject.units;
    }));
  }

  ngOnDestroy() {
    this.subscriptions
      .filter(subscription => !subscription.closed)
      .forEach(subscription => subscription.unsubscribe());
  }

  nodeHasChild(index: number, data: TopicNode) {
    return topicNodeHasChildren(data);
  }



}
