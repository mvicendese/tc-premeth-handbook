import json, {Decoder, parseError} from '../json';
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
    ...modelProperties('subject'),
    name: json.string
  }, obj);
}

export interface SubjectParams extends Model {
  readonly type: 'subject';
  readonly name: string;
  readonly yearLevel: number;

  readonly units: Unit[];
}

function subjectParamsFromJson(obj: unknown): SubjectParams {
  return json.object<SubjectParams>({
    ...modelProperties('subject'),
    name: json.string,
    yearLevel: json.number,
    units: json.array(modelRefFromJson(Unit.fromJson))
  }, obj);
}

export class Subject extends BaseModel implements SubjectParams {
  readonly type = 'subject';
  readonly [k: string]: unknown;

  readonly name: string;
  readonly yearLevel: number;

  readonly units: Unit[];

  constructor(params: SubjectParams) {
    super(params);

    this.name = params.name;
    this.yearLevel = params.yearLevel;
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
    return json.object(object => {
      const params = subjectParamsFromJson(object);
      return new Subject(params);
    }, obj);
  }
}

/********************************************
 *
 * UNITS
 *
 ********************************************/

export interface UnitParams extends Model {
  readonly type: 'unit';
  readonly key: string;
  readonly name: string;

  readonly subject: ModelRef<Subject>;
  readonly blocks: BlockParams[];
}

function unitParamsFromJson(obj: unknown): UnitParams {
  return json.object<UnitParams>({
    ...modelProperties('subject'),
    key: json.string,
    name: json.string,
    subject: modelRefFromJson(Block.fromJson),
    yearLevel: json.number,
    blocks: json.array(Block.fromJson)
  }, obj);
}

export class Unit extends BaseModel implements UnitParams {
  static fromJson(obj: unknown): Unit {
    return json.object(object => {
      const params = unitParamsFromJson(object);
      return new Unit(params);
    }, obj);
  }

  readonly type = 'unit';
  readonly [k: string]: unknown;

  readonly key: string;
  readonly name: string;
  readonly subject: ModelRef<Subject>;

  readonly blocks: Block[];

  constructor(params: UnitParams) {
    super(params);

    this.key = params.key;
    this.name = params.name;
    this.subject = params.subject;
    this.blocks = params.blocks.map(block => {
      const unitId = modelRefId(block.unit);
      if (unitId !== this.id) {
        throw new Error(`Invalid block in unit, expected unit ${this.id}`);
      }
      return new Block({ ...block, unit: this});
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

  readonly name: string;
  readonly lessons: LessonSchemaParams[];
}

function blockParamsFromJson(obj: unknown): BlockParams {
  return json.object<BlockParams>({
    ...modelProperties('subject'),
    unit: modelRefFromJson(Unit.fromJson),
    name: json.string,
    yearLevel: json.number,
    lessons: json.array(LessonSchema.fromJson)
  }, obj);
}


export class Block extends BaseModel implements BlockParams {
  static fromJson(obj: unknown): Block {
    return json.object(object => {
      const params = blockParamsFromJson(object);
      return new Block(params);
    }, obj);
  }

  readonly type = 'unit-block';
  readonly [k: string]: unknown;

  readonly unit: ModelRef<Unit>;

  readonly name: string;
  readonly lessons: LessonSchema[];

  constructor(params: BlockParams) {
    super(params);
    this.unit = params.unit;

    this.name = params.name;
    this.lessons = params.lessons.map(lesson => {
      const unitId = modelRefId(lesson.block);
      if (unitId !== this.id) {
        throw new Error(`Unexpected lesson in unit block lessons.`);
      }

      return new LessonSchema({
        ...lesson,
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
    return json.object(object => {
      const params = lessonSchemaParamsFromJson(object);
      return new LessonSchema(params);
    }, obj);
  }

  readonly type = 'lesson';
  readonly [k: string]: unknown;

  readonly block: ModelRef<Block>;

  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcome[];
  readonly exampleDescriptions: string[];

  constructor(params: LessonSchemaParams) {
    super(params);

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
        block: this.block,
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
  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<Block>;
  readonly lesson: ModelRef<LessonSchema>;

  readonly description: string;
}

function lessonOutcomeParamsFromJson(obj: unknown): LessonOutcomeParams {
  return json.object<LessonOutcomeParams>({
    ...modelProperties('lessonoutcome'),
    subject: modelRefFromJson(Subject.fromJson),
    unit: modelRefFromJson(Unit.fromJson),
    block: modelRefFromJson(Block.fromJson),
    lesson: modelRefFromJson(LessonSchema.fromJson),
    description: json.string
  }, obj);
}

export class LessonOutcome extends BaseModel implements LessonOutcomeParams {
  static fromJson(obj: unknown): LessonOutcome {
    return json.object(object => {
      const params = lessonOutcomeParamsFromJson(object);
      return new LessonOutcome(params);
    }, obj);
  }

  readonly type = 'lessonoutcome';

  readonly subject: ModelRef<Subject>;
  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<Block>;
  readonly lesson: ModelRef<LessonSchema>;

  readonly description: string;

  constructor(params: LessonOutcomeParams) {
    super(params);

    this.subject = params.subject;
    this.unit = params.unit;
    this.block = params.block;
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

export function subjectNodeFromJson(node: unknown): SubjectNode {
  return json.object<SubjectNode>((props) => {
    switch (props.type) {
      case 'subject':
        return Subject.fromJson(props);
      case 'unit':
        return Unit.fromJson(props);
      case 'block':
        return Block.fromJson(props);
      case 'lesson':
        return LessonSchema.fromJson(props);
      case 'lessonoutcome':
        return LessonOutcome.fromJson(props);
      default:
        throw parseError(`Invalid subject node type: ${props.type}`);
    }
  }, node);
}

export function toParam(node: SubjectNode) {
  return node.id;
}


