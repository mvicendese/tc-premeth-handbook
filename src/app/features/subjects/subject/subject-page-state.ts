import {Injectable} from '@angular/core';
import {SubjectNodePageContainerState} from '../subject-node-page-container-state';
import {SubjectNodeRouteData} from '../subject-node-route-data';
import {Unsubscribable} from 'rxjs';


@Injectable()
export class SubjectPageState {
  constructor(
    readonly containerState: SubjectNodePageContainerState,
    readonly routeData: SubjectNodeRouteData
  ) {}

  init(): Unsubscribable {
    return this.containerState.addSubjectNodeSource(this.routeData.subjectNode$);
  }

}
