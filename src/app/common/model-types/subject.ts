import {Model, ModelParams} from '../model-base/model';
import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {SubjectClass} from './subject-class';
import {Unit} from './unit';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {ResponsePage} from '../model-base/pagination';
import {LessonSchema} from './lesson-schema';
import {LessonOutcome} from './lesson-outcome';
import {UnitBlock} from './unit-block';

export type SubjectNode = Subject | Unit | UnitBlock | LessonSchema | LessonOutcome;
export function toParam(node: SubjectNode) {
  return node.id;
}

export interface SubjectIndex extends ModelParams {
  readonly type: 'subject';
  readonly name: string;
}

export interface SubjectParams extends ModelParams {
  readonly type: 'subject';
  readonly name: string;
  readonly yearLevel: number;

  readonly units: Unit[];
}

export class Subject extends Model implements SubjectParams {
  readonly type = 'subject';

  readonly name: string;
  readonly yearLevel: number;

  readonly units: Unit[];

  constructor(params: SubjectParams) {
    super(params);

    this.name = params.name;
    this.yearLevel = params.yearLevel;
    this.units = params.units.map(unit => {
      const subjectId = getModelRefId(unit.subject);
      if (subjectId !== this.id) {
        throw new Error(`Invalid unit in subject. All unit children must have a subject ${this.id}`);
      }
      return new Unit({...unit, subject: this});
    });
  }

  getLesson(ref: ModelRef<LessonSchema>): LessonSchema | undefined {
    return this.units.reduce((acc: LessonSchema | undefined, unit: Unit) => {
      return acc || unit.getLesson(ref);
    }, undefined);
  }

  getUnit(ref: ModelRef<Unit>): Unit | undefined {
    return this.units.find(unit => unit.id === getModelRefId(ref));
  }
}

