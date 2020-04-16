import {Injectable} from '@angular/core';
import {AppStateService} from '../../app-state.service';
import {defer, Unsubscribable} from 'rxjs';

@Injectable()
export class SubjectState {
  readonly subject$ = defer(() => this.appStateService.subject$);

  constructor(
    readonly appStateService: AppStateService
  ) {}
}
