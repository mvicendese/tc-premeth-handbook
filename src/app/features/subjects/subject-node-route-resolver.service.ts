import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {SubjectNode, SubjectNodeType} from '../../common/model-types/subjects';
import {Observable} from 'rxjs';
import {filter, first, map} from 'rxjs/operators';
import {SubjectsFeatureState} from './subjects-feature-state';

@Injectable()
export class SubjectNodeRouteResolver implements Resolve<SubjectNode> {
  constructor(
    readonly subjectsFeature: SubjectsFeatureState
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
    return this.subjectsFeature.subject$.pipe(
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
