import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {modelRefId, ModelRef} from '../../common/model-base/model-ref';
import {map, tap} from 'rxjs/operators';
import {SubjectsService} from '../../common/model-services/subjects.service';
import {Subject} from '../../common/model-types/subject';


@Injectable()
export class SubjectContextService {
  private subjects = new BehaviorSubject<{[contextId: string]: Subject}>({});

  getSubject(ref: ModelRef<Subject>) {
    const subjectId = modelRefId(ref);
    return this.subjects.pipe(
      map(subjects => subjects[subjectId]),
      tap(subject => {
        if (subject === undefined) {
          this.loadSubject(subject);
        }
      })
    );
  }

  constructor(
    readonly subjectService: SubjectsService
  ) {}

  private loadSubject(ref: ModelRef<Subject>) {
    return this.subjectService.fetch(ref).subscribe(subject => {
      this.subjects.next({...this.subjects.value, [subject.id]: subject});
    });
  }
}
