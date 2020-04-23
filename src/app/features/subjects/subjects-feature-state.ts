import {Injectable} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {SubjectNode, SubjectNodeType} from '../../common/model-types/subjects';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


@Injectable()
export class SubjectsFeatureState {
  readonly subject$ = this.appStateService.subject$;

  getNode(nodeType: SubjectNodeType, nodeId: string): Observable<SubjectNode> {
    return this.subject$.pipe(map(subject => subject.getNode(nodeType, nodeId)));
  }

  constructor(
    readonly appStateService: AppStateService
  ) {
  }
}


