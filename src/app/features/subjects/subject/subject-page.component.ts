import {Component, OnDestroy, OnInit, Provider} from '@angular/core';
import {provideSubjectNodeState} from '../subject-node-state';
import {SubjectPageState} from './subject-page-state';
import {Unsubscribable} from 'rxjs';

export function provideSubjectPageState(): Provider[] {
  return [
    provideSubjectNodeState({assessmentType: 'unit-assessment', childAssessmentTypes: []}),
    SubjectPageState
  ];
}

@Component({
  template: ``,
  viewProviders: [
    ...provideSubjectPageState()
  ]
})
export class SubjectPageComponent implements OnInit, OnDestroy{
  private resources: Unsubscribable[] = [];

  constructor(
    readonly subjectPageState: SubjectPageState
  ) {}

  ngOnInit() {
    this.resources.push(this.subjectPageState.init());
  }

  ngOnDestroy(): void {
    this.resources.forEach(r => r.unsubscribe());
  }

}
