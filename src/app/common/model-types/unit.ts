import {Model, ModelParams} from '../model-base/model';
import {Injectable} from '@angular/core';
import {Subject} from './subject';
import {LessonSchema} from './lesson-schema';
import {UnitBlock, UnitBlockParams} from './unit-block';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';


export interface UnitParams extends ModelParams {
  readonly type: 'unit';
  readonly key: string;
  readonly name: string;

  readonly subject: ModelRef<Subject>;
  readonly blocks: UnitBlockParams[];
}

export class Unit extends Model implements UnitParams {
  readonly type = 'unit';

  readonly key: string;
  readonly name: string;
  readonly subject: ModelRef<Subject>;

  readonly blocks: UnitBlock[];

  constructor(params: UnitParams) {
    super(params);

    this.key = params.key;
    this.name = params.name;
    this.subject = params.subject;
    this.blocks = params.blocks.map(block => {
      const unitId = getModelRefId(block.unit);
      if (unitId !== this.id) {
        throw new Error(`Invalid block in unit, expected unit ${this.id}`);
      }
      return new UnitBlock({
        ...block,
        unit: this
      });
    });
  }

  getLesson(lesson: ModelRef<LessonSchema>) {
    return this.blocks.reduce((acc: LessonSchema | undefined, block: UnitBlock) => {
      return acc || block.getLesson(lesson);
    }, undefined);
  }

}
