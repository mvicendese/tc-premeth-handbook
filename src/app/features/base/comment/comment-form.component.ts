import {v4 as uuidv4} from 'uuid';
import {Component, EventEmitter, Inject, InjectionToken, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Model} from '../../../common/model-base/model';

import {Comment, CommentableService} from './comment.model';
import {Attachable} from '../../../common/model-types/base-attachables';
import {BehaviorSubject, defer} from 'rxjs';

@Component({
  selector: 'base-comment-form',
  template: `
    <form [formGroup]="commentForm" (ngSubmit)="submit()">
      <mat-form-field appearance="outline">
        <mat-label hidden>Content</mat-label>
        <textarea matNativeControl formControlName="content" ></textarea>
        <mat-hint>
          Simple <a href="">markdown</a> can be used in comments
        </mat-hint>
        <mat-hint align="end">
          <a href="https://www.webfx.com/tools/emoji-cheat-sheet/">Emoji aliases</a>
        </mat-hint>
      </mat-form-field>

      <button mat-flat-button type="submit" [disabled]="!commentForm.valid">
        <ng-container *ngIf="(isSaving | async) === false; else loading">
          <mat-icon>save</mat-icon>
          <span>Save</span>
        </ng-container>
        <ng-template #loading>
          <app-loading></app-loading>
          <span>Saving...</span>
        </ng-template>
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }

    form {
      display: flex;
      align-items: flex-start;
    }

    mat-form-field {
      flex-grow: 1;
      margin-right: 1em;
    }

    /* Remove padding reserving space for label */
    :host ::ng-deep .mat-form-field-infix {
      padding-top: 0;
    }

    textarea {
      min-height: 80px;
    }

    button[type=submit] {
      /* Align with top of form-field */
      margin-top: 0.25em;
    }
  `],
})
export class CommentFormComponent implements OnInit, OnChanges, OnDestroy {
  protected readonly isSavingSubject = new BehaviorSubject(false);

  @Output()
  readonly isSaving = defer(() => this.isSavingSubject.asObservable());

  static generateCommentId() { return uuidv4(); }

  constructor(
    readonly formBuilder: FormBuilder,
    readonly commentableService: CommentableService<any>
  ) {}

  /** Some commentable model */
  @Input()
  attachTo: Attachable;

  @Output()
  readonly created = new EventEmitter<Comment>();

  readonly commentForm = this.formBuilder.group({
    content: ['', Validators.required]
  });

  ngOnInit() {
    if (this.attachTo === undefined) {
      throw new Error('A comment must be attached to a model');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.attachTo && !changes.attachTo.isFirstChange()) {
      throw new Error(`'attachTo' can not be set after initialization`);
    }
  }

  ngOnDestroy() {
    this.isSavingSubject.complete();
  }

  submit() {
    if (this.commentForm.valid) {
      this.isSavingSubject.next(true);
      const {content} = this.commentForm.value;

      this.commentableService.addComment(this.attachTo, { content }).subscribe(created => {
        this.isSavingSubject.next(false);
        this.created.next(created);
      });
    }

  }

}

