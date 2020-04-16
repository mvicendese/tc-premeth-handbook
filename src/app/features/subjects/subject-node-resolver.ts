import {Injectable} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, ParamMap, Resolve, RouterStateSnapshot} from '@angular/router';
import {SubjectNode, SubjectNodeType, Unit} from '../../common/model-types/subjects';
import {SubjectState} from './subject-state';
import {Observable, of} from 'rxjs';
import {filter, first, map, skipWhile} from 'rxjs/operators';

@Injectable()
export class SubjectNodeResolver implements Resolve<SubjectNode> {
  constructor(
    readonly subjectState: SubjectState
  ) {}

  protected nodeTypeFromRoute(route: ActivatedRouteSnapshot): SubjectNodeType {
    const type = route.url[0] && route.url[0].path;
    if (type) {
      return type as SubjectNodeType;
    }
    throw new Error(`Expected a subject route type at route segment 0`);
  }

  protected nodeIdFromRoute(route: ActivatedRouteSnapshot): string {
    return route.paramMap.get('node_id');
  }

  protected subjectNodeFromParams(nodeType: SubjectNodeType, id: string): Observable<SubjectNode> {
    return this.subjectState.subject$.pipe(
      filter(subject => subject != null),
      map(subject => {
        const node = subject.getNode(nodeType, id);
        if (node == null) {
          throw new Error(`Could not find node ${nodeType} ${id} in current subject`);
        }
        return node;
      }),
      first(),
    );
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SubjectNode> {
    return this.subjectNodeFromParams(
      this.nodeTypeFromRoute(route),
      this.nodeIdFromRoute(route)
    );
  }
}
