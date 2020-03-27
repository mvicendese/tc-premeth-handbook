import {Component} from '@angular/core';
import {map, pluck, shareReplay, switchMap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Observable} from 'rxjs';
import {LessonSchema} from '../../common/model-types/lesson-schema';
import {Student} from '../../common/model-types/student';
import {LessonResultsService} from '../../common/model-services/lesson-results.service';
import {AppStateService} from '../../app-state.service';


@Component({
  selector: 'app-lessons-page',
  template: `
    <ng-container *ngIf="(lesson$ | async) as lesson">
      <h1>{{lesson.name}}</h1>

      <div *ngIf="(lessonResult$ | async) as result">
        <h3>Outcomes</h3>
        <ul>
          <li *ngFor="let outcome of lesson.outcomes">
            <span>{{outcome.description}}</span>
            <app-star-rating
              [value]="result.outcomeSelfAssessments[outcome.id]?.rating"
              (valueChange)="selfAssessmentChange($event)"
            >
            </app-star-rating>
          </li>
        </ul>
      </div>
    </ng-container>
    `
})
export class LessonPageComponent {
  readonly student$: Observable<Student> = this.route.parent.parent.data.pipe(
    pluck('student'),
    shareReplay(1)
  );

  readonly lesson$ = combineLatest([
    this.appState.subject$,
    this.route.paramMap.pipe(map(params => params.get('lesson_id')))
  ]).pipe(
    map(([subject, lessonId]) => subject && subject.getLesson(lessonId)),
    shareReplay(1)
  );

  readonly lessonResult$ = combineLatest([this.student$, this.lesson$]).pipe(
    switchMap(([student, lesson]) => this.lessonResultService.forStudentLesson(student, lesson)),
    shareReplay(1)
  );

  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute,
    readonly lessonResultService: LessonResultsService
  ) {}

  selfAssessmentChange(rating: number) {
    console.log(`self assessment changed to ${rating}`);
  }

}
