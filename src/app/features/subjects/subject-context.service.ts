import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {getModelRefId, ModelRef} from '../../common/model-base/model-ref';
import {map, tap} from 'rxjs/operators';
import {SubjectService} from '../../common/model-services/subject.service';
import {Subject} from '../../common/model-types/subject';


@Injectable()
export class SubjectContextService {
  private subjects = new BehaviorSubject<{[contextId: string]: Subject}>({});

  getSubject(ref: ModelRef<Subject>) {
    const subjectId = getModelRefId(ref);
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
    readonly subjectService: SubjectService
  ) {}

  private loadSubject(ref: ModelRef<Subject>) {
    return this.subjectService.fetch(ref).subscribe(subject => {
      this.subjects.next({...this.subjects.value, [subject.id]: subject});
    });
  }
}
