import {ChangeDetectionStrategy, Component, InjectionToken, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

import {Comment} from './comment.model';
import {Person} from '../person/person.model';
import {BehaviorSubject, defer, ObservableInput} from 'rxjs';
import {UserModelLoader} from '../auth/user.model-loader-service';
import {map} from 'rxjs/operators';


@Component({
  selector: 'base-comment-card',
  template: `
    <mat-card *ngIf="comment" class="mat-elevation-z4">

      <mat-card-content>
        <span [innerHTML]="sanitizer.bypassSecurityTrustHtml(comment.htmlContent)"></span>
      </mat-card-content>
      
      <mat-card-footer>
        <base-person-info [person]="author$ | async">
        </base-person-info>
        <div class="date">
          On: {{comment.createdAt | date}}
        </div>
      </mat-card-footer>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
    }

    :host mat-card {
      background-color: aliceblue;
      margin: 0.5rem;
    }
    
    :host mat-card-footer {
      margin: 0 0.5rem;
    }
    
    base-person-info {
      display: inline-flex
    }
    
    .date {
      
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentCardComponent implements OnChanges, OnDestroy {
  @Input() comment: Comment | null = null;

  protected readonly authorSubject = new BehaviorSubject<Person | null>(null);

  readonly author$ = defer(() => this.authorSubject.asObservable());

  constructor(
    readonly sanitizer: DomSanitizer,
    readonly users: UserModelLoader
  ) {
  }

  ngOnChanges({comment}: SimpleChanges) {
    if (this.comment == null) {
      this.authorSubject.next(null);
    } else {
      this.users.load(this.comment.createdBy).pipe(map(user => user.person)).subscribe(this.authorSubject);
    }
  }

  ngOnDestroy() {
    this.authorSubject.complete();
  }


}
