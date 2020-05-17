import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';

import {Comment, Commentable, CommentableService} from './comment.model';
import {Attachable} from '../../../common/model-types/base-attachables';
import {BehaviorSubject, defer, Observable, Subject, throwError} from 'rxjs';
import {catchError, filter, map, mapTo, shareReplay, switchMap, tap, withLatestFrom} from 'rxjs/operators';

@Component({
  selector: 'base-comment-section',
  template: `
    <ng-container *ngIf="comments$ | async as comments">
    <base-comment-card *ngFor="let comment of comments"
                       [comment]="comment">
    </base-comment-card>
    </ng-container>
    <base-comment-form
        [attachTo]="commentableSubject | async"
        (created)="created.next($event)"></base-comment-form>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]

})
export class CommentSectionComponent implements OnInit, OnDestroy {
  readonly commentableSubject = new BehaviorSubject<Commentable | null>(null);
  // Comments created by view children go here rather than refreshing list from server.
  // appended.
  // If a comment in this array appears in the comments fetched from remote, it is removed.
  protected createdComments = new BehaviorSubject<Comment[]>([]);

  readonly comments$: Observable<Comment[]> = defer(() => this.commentableSubject.pipe(
    filter((commentable): commentable is Commentable => commentable != null),
    switchMap(obj => this.commentableService.comments(obj)),
    tap(serverComments => {

      // For the moment, only one page of results.
       const serverIds = serverComments.results.map(c => c.id);
       const newlyCreatedComments = this.createdComments.value.filter(c => !serverIds.includes(c.id));
       this.createdComments.next(newlyCreatedComments);
    }),
    map(serverComments => serverComments.results.concat(this.createdComments.value)),
    shareReplay(1)
  ));

  @Input()
  set commentable(commentable: Attachable) {
    this.commentableSubject.next(commentable);
  }

  @Output()
  readonly created = new EventEmitter<Comment>();

  constructor(
    readonly commentableService: CommentableService<any>
  ) {}

  ngOnInit() {
    this.created.pipe(
      withLatestFrom(this.createdComments),
      map(([created, currentCreated]) => [...currentCreated, created])
    ).subscribe(this.createdComments);

    this.comments$.subscribe(console.log);
  }

  ngOnDestroy() {
    this.commentableSubject.complete();
    this.createdComments.complete();
  }

}
