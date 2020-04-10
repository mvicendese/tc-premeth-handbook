import json from '../json';
import {BaseModel, Model, modelProperties} from '../model-base/model';
import {ModelRef, modelRefFromJson, modelRefId} from '../model-base/model-ref';


/********************************************
 *
 * UNITS
 *
 ********************************************/

export interface SubjectIndex extends Model {
  readonly type: 'subject';
  readonly name: string;
}

export function subjectIndexFromJson(obj: unknown): SubjectIndex {
  return json.object({
    ...modelProperties<Subject>('subject'),
    name: json.string
  }, obj);
}

export interface SubjectParams extends Model {
  readonly type: 'subject';
  readonly name: string;

  readonly units: UnitParams[];
}

function subjectParamsFromJson(obj: unknown): SubjectParams {
  return json.object<SubjectParams>({
    ...modelProperties<SubjectParams>('subject'),
    name: json.string,
    units: json.array(unitParamsFromJson)
  }, obj);
}

export class Subject extends BaseModel implements SubjectParams {
  readonly type = 'subject';

  readonly [k: string]: unknown;

  readonly name: string;

  readonly units: Unit[];

  constructor(params: SubjectParams) {
    super(params);

    this.name = params.name;
    this.units = params.units.map(unit => {
      const subjectId = modelRefId(unit.subject);
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
    return this.units.find(unit => unit.id === modelRefId(ref));
  }

  static fromJson(obj: unknown): Subject {
    return new Subject(subjectParamsFromJson(obj));
  }
}

/********************************************
 *
 * UNITS
 *
 ********************************************/

export interface UnitParams extends Model {
  readonly type: 'unit';
  readonly name: string;

  readonly subject: ModelRef<Subject>;
  readonly blocks: BlockParams[];
}

function unitParamsFromJson(obj: unknown): UnitParams {
  return json.object<UnitParams>({
    ...modelProperties<UnitParams>('unit'),
    name: json.string,
    subject: modelRefFromJson(Subject.fromJson),
    blocks: json.array(Block.fromJson)
  }, obj);
}

export class Unit extends BaseModel implements UnitParams {
  static fromJson(obj: unknown): Unit {
    return new Unit(unitParamsFromJson(obj));
  }

  readonly type = 'unit';

  readonly [k: string]: unknown;

  readonly name: string;
  readonly subject: ModelRef<Subject>;

  readonly blocks: Block[];

  constructor(params: UnitParams) {
    super(params);

    this.name = params.name;
    this.subject = params.subject;
    this.blocks = params.blocks.map(block => {
      const unitId = modelRefId(block.unit);
      if (unitId !== this.id) {
        throw new Error(`Invalid block in unit, expected unit ${this.id}`);
      }
      return new Block({...block, subject: this.subject, unit: this});
    });
  }

  getBlock(block: ModelRef<Block>) {
    const blockId = modelRefId(block);
    return this.blocks.find(b => b.id === blockId) || null;
  }

  getLesson(lesson: ModelRef<LessonSchema>) {
    return this.blocks.reduce((acc: LessonSchema | undefined, block: Block) => {
      return acc || block.getLesson(lesson);
    }, undefined);
  }

}

/********************************************
 *
 * BLOCKS
 *
 ********************************************/

export interface BlockParams extends Model {
  readonly unit: ModelRef<Unit>;

  readonly subject: ModelRef<Subject>;
  readonly name: string;
  readonly lessons: LessonSchemaParams[];
}

function blockParamsFromJson(obj: unknown): BlockParams {
  return json.object<BlockParams>({
    ...modelProperties('subject'),
    subject: modelRefFromJson(Subject.fromJson),
    unit: modelRefFromJson(Unit.fromJson),
    name: json.string,
    lessons: json.array(LessonSchema.fromJson)
  }, obj);
}


export class Block extends BaseModel implements BlockParams {
  static fromJson(obj: unknown): Block {
    return new Block(blockParamsFromJson(obj));
  }

  readonly type = 'unit-block';

  readonly subject: ModelRef<Subject>;
  readonly unit: ModelRef<Unit>;

  readonly name: string;
  readonly lessons: LessonSchema[];

  constructor(params: BlockParams) {
    super(params);
    this.subject = params.subject;
    this.unit = params.unit;

    this.name = params.name;
    this.lessons = params.lessons.map(lesson => {
      const unitId = modelRefId(lesson.block);
      if (unitId !== this.id) {
        throw new Error(`Unexpected lesson in unit block lessons.`);
      }

      return new LessonSchema({
        ...lesson,
        subject: this.subject,
        block: this
      });
    });

  }

  getLesson(lesson: ModelRef<LessonSchema>): LessonSchema | undefined {
    const lessonId = modelRefId(lesson);
    return this.lessons.find(item => item.id === lessonId);
  }

}

/********************************************
 *
 * LESSON SCHEMA
 *
 ********************************************/

export interface LessonSchemaParams extends Model {
  readonly subject: ModelRef<Subject>;
  readonly block: ModelRef<Block>;

  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcomeParams[];
  readonly exampleDescriptions: string[];
}

function lessonSchemaParamsFromJson(obj: unknown): LessonSchemaParams {
  return json.object<LessonSchemaParams>({
    ...modelProperties('subject'),
    subject: modelRefFromJson(Subject.fromJson),
    block: modelRefFromJson(Block.fromJson),
    code: json.string,
    name: json.string,
    number: json.number,
    outcomes: json.array(LessonOutcome.fromJson),
    exampleDescriptions: json.array(json.string)
  }, obj);
}

export class LessonSchema extends BaseModel implements LessonSchemaParams {
  static fromJson(obj: unknown): LessonSchema {
    return new LessonSchema(lessonSchemaParamsFromJson(obj));
  }

  readonly type = 'lesson';

  readonly [k: string]: unknown;

  readonly subject: ModelRef<Subject>;
  readonly block: ModelRef<Block>;

  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcome[];
  readonly exampleDescriptions: string[];

  constructor(params: LessonSchemaParams) {
    super(params);

    this.subject = params.subject;
    this.block = params.block;

    this.code = params.code;
    this.name = params.name;

    this.number = params.number;

    this.outcomes = params.outcomes.map(outcome => {
      const lessonId = modelRefId(outcome.lesson);
      if (lessonId !== this.id) {
        throw new Error(`Invalid outcome in lesson. All outcomes must have the same parent lesson`);
      }
      return new LessonOutcome({
        ...outcome,
        subject: this.subject,
        lesson: this
      });
    });
    this.exampleDescriptions = params.exampleDescriptions;
  }
}

/********************************************
 *
 * LESSON OUTCOME
 *
 ********************************************/


export interface LessonOutcomeParams extends Model {
  readonly type: 'lessonoutcome';
  readonly subject: ModelRef<Subject>;
  readonly lesson: ModelRef<LessonSchema>;

  readonly description: string;
}

function lessonOutcomeParamsFromJson(obj: unknown): LessonOutcomeParams {
  return json.object<LessonOutcomeParams>({
    ...modelProperties<LessonOutcome>('lessonoutcome'),
    subject: modelRefFromJson(Subject.fromJson),
    lesson: modelRefFromJson(LessonSchema.fromJson),
    description: json.string
  }, obj);
}

export class LessonOutcome extends BaseModel implements LessonOutcomeParams {
  static fromJson(obj: unknown): LessonOutcome {
    return new LessonOutcome(lessonOutcomeParamsFromJson(obj));
  }

  readonly type = 'lessonoutcome';

  readonly subject: ModelRef<Subject>;
  readonly lesson: ModelRef<LessonSchema>;

  readonly description: string;

  constructor(params: LessonOutcomeParams) {
    super(params);

    this.subject = params.subject;
    this.lesson = params.lesson;

    this.description = params.description;
  }
}


/********************************************
 *
 * SUBJECT NODE
 *
 ********************************************/

export type SubjectNode = Subject | Unit | Block | LessonSchema | LessonOutcome;

export function subjectNodeFromJson(obj: unknown): SubjectNode {
  function getNodeType(object: unknown) {
    return json.object({type: json.string}, object).type;
  }
  return json.union<SubjectNode>(
    getNodeType,
    {
      'subject': Subject.fromJson,
      'unit': Unit.fromJson,
      'block': Block.fromJson,
      'lesson': LessonSchema.fromJson,
      'lessonoutcome': LessonOutcome.fromJson
    },
    obj
  );
}



