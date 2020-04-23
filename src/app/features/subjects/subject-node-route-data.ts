import {Block, LessonOutcome, LessonSchema, SubjectNode, SubjectNodeType, Unit} from '../../common/model-types/subjects';
import {ActivatedRoute, ActivatedRouteSnapshot, ParamMap, Resolve, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {combineLatest, defer, Observable, of, Unsubscribable} from 'rxjs';
import {filter, map, pluck, skipWhile} from 'rxjs/operators';


@Injectable()
export class SubjectNodeRouteData {
  readonly subjectNode$: Observable<SubjectNode> = defer(() =>
    this.route.data.pipe(
      pluck('node'),
      filter(node => node != null)
    )
  );

  readonly unit$: Observable<Unit | null> = defer(() => this.subjectNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'unit':
          return node;
        case 'block':
        case 'lesson':
        case 'lesson-outcome':
          return node.context.unit;
        default:
          return null;
      }
    })
  ));

  readonly block$: Observable<Block | null> = defer(() => this.subjectNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'block':
          return node;
        case 'lesson':
        case 'lesson-outcome':
          return node.context.block;
        default:
          return null;
      }
    })
  ));

  readonly lesson$: Observable<LessonSchema | null> = defer(() => this.subjectNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'lesson':
          return node;
        case 'lesson-outcome':
          return node.context.lesson;
        default:
          return null;
      }
    })
  ));

  readonly lessonOutcome$: Observable<LessonOutcome | null> = defer(() => this.subjectNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'lesson-outcome':
          return node;
        default:
          return null;
      }
    })
  ));

  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute
  ) {
  }

  destroy(): void {

  }
}

