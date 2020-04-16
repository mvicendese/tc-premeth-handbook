import {Block, LessonOutcome, LessonSchema, SubjectNode, SubjectNodeType, Unit} from '../../common/model-types/subjects';
import {ActivatedRoute, ActivatedRouteSnapshot, ParamMap, Resolve, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {combineLatest, defer, Observable, of, Unsubscribable} from 'rxjs';
import {SubjectState} from './subject-state';
import {map, pluck, skipWhile} from 'rxjs/operators';


@Injectable()
export class SubjectNodeRouteContext {
  readonly routeNode$: Observable<SubjectNode> = defer(() =>
    this.route.data.pipe(pluck('node'))
  );

  readonly unit$: Observable<Unit | null> = defer(() => this.routeNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'unit':
          return node;
        case 'block':
        case 'lesson':
        case 'lessonoutcome':
          return node.context.unit;
        default:
          return null;
      }
    })
  ));

  readonly block$: Observable<Block | null> = defer(() => this.routeNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'block':
          return node;
        case 'lesson':
        case 'lessonoutcome':
          return node.context.block;
        default:
          return null;
      }
    })
  ));

  readonly lesson$: Observable<LessonSchema | null> = defer(() => this.routeNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'lesson':
          return node;
        case 'lessonoutcome':
          return node.context.lesson;
        default:
          return null;
      }
    })
  ));

  readonly lessonOutcome$: Observable<LessonOutcome | null> = defer(() => this.routeNode$.pipe(
    map(node => {
      switch (node.type) {
        case 'lessonoutcome':
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

