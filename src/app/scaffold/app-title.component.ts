import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppStateService} from '../app-state.service';
import {map, pluck, shareReplay} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {defer, Unsubscribable} from 'rxjs';

@Component({
  selector: 'app-title',
  template: `{{applicationTitle$ | async}}`,
  styles: [``]

})
export class AppTitleComponent implements OnInit, OnDestroy {
  private resources: Unsubscribable[] = [];
  readonly subject$ = this.appState.subject$.pipe(shareReplay(1));

  readonly applicationTitle$ = defer(() => this.subject$.pipe(
    map(subject => subject === undefined ? '...' : `${subject.name} Handbook`)
  ));

  constructor(
    readonly title: Title,
    readonly appState: AppStateService
  ) {}

  ngOnInit() {
    this.resources.push(this.applicationTitle$.subscribe(title => this.title.setTitle(title)));
  }

  ngOnDestroy() {
    this.resources.forEach(r => r.unsubscribe());
  }

}
