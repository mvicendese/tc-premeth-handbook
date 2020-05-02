import {Injectable} from '@angular/core';
import {SubjectNode} from '../../common/model-types/subjects';
import {BehaviorSubject, ConnectableObservable, defer, Observable, Subject, Unsubscribable} from 'rxjs';
import {distinctUntilChanged, tap} from 'rxjs/operators';


@Injectable()
export class SubjectNodePageContainerState {
  readonly pageNodeSubject = new Subject<SubjectNode>();

  readonly subjectNode$ = defer(() =>
    this.pageNodeSubject.pipe(
      distinctUntilChanged()
    )
  );

  init(): Unsubscribable {
    return {
      unsubscribe(): void {
        this.pageNodeSubject.complete();
      }
    };
  }

  addSubjectNodeSource(nodeSource: Observable<SubjectNode>): Unsubscribable {
    return nodeSource.subscribe(this.pageNodeSubject);
  }
}
