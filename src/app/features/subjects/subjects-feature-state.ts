import {Injectable} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {Subject, SubjectNode, SubjectNodeType} from '../../common/model-types/subjects';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';


@Injectable()
export class SubjectsFeatureState {
  readonly subject$ = this.appStateService.subject$;

  getNode(nodeType: SubjectNodeType, nodeId: string): Observable<SubjectNode> {
    return this.subject$.pipe(
      filter((s): s is Subject => s != null),
      map(subject => {
        const node = subject.getNode(nodeType, nodeId);
        if (node == null) {
          throw new Error(`No such node: ${node}`);
        }
        return node;
      })
    );
  }

  constructor(
    readonly appStateService: AppStateService
  ) {
  }
}


