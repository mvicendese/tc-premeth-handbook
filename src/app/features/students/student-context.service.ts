import {Inject, Injectable, Optional, SkipSelf} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {BehaviorSubject, forkJoin, Observable, Observer, Unsubscribable} from 'rxjs';
import {Student} from '../../common/model-types/student';
import {getModelRefId, ModelRef} from '../../common/model-base/model-ref';
import {SubjectClass} from '../../common/model-types/subject-class';
import {filter, first, map, shareReplay, tap} from 'rxjs/operators';
import {ResponsePage} from '../../common/model-base/pagination';
import {StudentService} from '../../common/model-services/students.service';
import {ModelFetchQueue} from '../../common/model-base/fetch-queue';
import {scanIntoModelMap} from '../../common/model-base/model';

@Injectable()
export class StudentContextService {
  constructor(
    readonly appState: AppStateService,
    readonly studentService: StudentService
  ) {}

  readonly fetchQueue = new ModelFetchQueue(this.studentService);

  readonly allStudents$: Observable<{[student: string]: Student}> = this.fetchQueue.modelResolve.pipe(
    scanIntoModelMap<Student>(),
    shareReplay(1)
  );

  fetch(student: ModelRef<Student>) {
    return this.fetchQueue.queueFetch(student);
  }

  init(): Unsubscribable {
    const allStudentSubscription = this.allStudents$.subscribe();
    const fetchQueue = this.fetchQueue.init();

    return {
      unsubscribe: () => {
        allStudentSubscription.unsubscribe();
        fetchQueue.unsubscribe();
      }
    };
  }
}
