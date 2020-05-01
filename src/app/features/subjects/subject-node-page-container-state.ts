import {Injectable} from '@angular/core';
import {SubjectNode} from '../../common/model-types/subjects';
import {BehaviorSubject, ConnectableObservable, defer, Observable, Subject, Unsubscribable} from 'rxjs';
import {distinctUntilChanged, tap} from 'rxjs/operators';


@Injectable()
export class SubjectNodePageContainerState {
  readonly pageNodeSubject = new Subject<SubjectNode>();
  protected readonly isMenuTreeOpenSubject = new BehaviorSubject(false);

  readonly subjectNode$ = defer(() =>
    this.pageNodeSubject.pipe(
      tap(() => this.isMenuTreeOpenSubject.next(false)),
      distinctUntilChanged()
    )
  );

  readonly isMenuTreeOpen = defer(() => this.isMenuTreeOpenSubject);

  init(): Unsubscribable {
    return {
      unsubscribe(): void {
        this.pageNodeSubject.complete();
        this.isMenuTreeOpenSubject.complete();
      }
    };
  }

  addSubjectNodeSource(nodeSource: Observable<SubjectNode>): Unsubscribable {
    return nodeSource.subscribe(this.pageNodeSubject);
  }

  toggleMenuTreeOpen(isOpen?: boolean) {
    const currentIsOpen = this.isMenuTreeOpenSubject.value;
    isOpen = isOpen || !currentIsOpen;

    if (currentIsOpen !== isOpen) {
      this.isMenuTreeOpenSubject.next(isOpen);
    }
  }
}
