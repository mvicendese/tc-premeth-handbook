import {Injectable} from '@angular/core';
import {BehaviorSubject, defer, Unsubscribable} from 'rxjs';
import {Student} from '../../../common/model-types/schools';
import {ActivatedRoute} from '@angular/router';
import {filter, map, pluck, switchMap} from 'rxjs/operators';
import {AssessmentsService} from '../../../common/model-services/assessments.service';


@Injectable()
export class StudentState {
  private readonly studentSubject = new BehaviorSubject<Student | undefined>(undefined);

  readonly studentId$ = defer(() =>
    this.studentSubject.pipe(filter((s): s is Student => s != null))
  );

  /*
  readonly prelearningProgress$
    = this.studentId$.pipe(
      switchMap(studentId => this.assessments.fetchProgress(''))
    );
   */

  constructor(
    readonly route: ActivatedRoute,
    readonly assessments: AssessmentsService
  ) {}

  init(): Unsubscribable {
    this.route.data.pipe(map(data => data.student)).subscribe(this.studentSubject);

    return {
      unsubscribe: () => {
        this.studentSubject.complete();
      }
    }
  }
}
