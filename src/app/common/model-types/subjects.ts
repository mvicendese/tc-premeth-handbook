import json, {JsonObjectProperties, parseError} from '../json';
import {BaseModel, Model} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';


/********************************************
 *
 * UNITS
 *
 ********************************************/

export interface SubjectIndex extends Model {
  readonly type: 'subject';
  readonly name: string;
}

export const subjectIndexProperties: JsonObjectProperties<SubjectIndex> = {
  ...Model.properties,
  type: { value: 'subject' },
  name: json.string
};

export function subjectIndexFromJson(obj: unknown): SubjectIndex {
  return json.object(subjectIndexProperties, obj);
}

export interface SubjectParams extends Model {
  readonly type: 'subject';
  readonly name: string;

  readonly units: UnitParams[];
}

function subjectParamsFromJson(obj: unknown): SubjectParams {
  return json.object<SubjectParams>({
    ...subjectIndexProperties,
    units: json.array(unitParamsFromJson)
  }, obj);
}

type SubjectNodeContext<T extends SubjectNode> =
  (T extends (Unit | Block | LessonSchema | LessonOutcome) ? { readonly subject: Subject } : {})
    & ( T extends (Block | LessonSchema | LessonOutcome)    ? { readonly unit: Unit} : {} )
    & ( T extends (LessonSchema | LessonOutcome)            ? { readonly block: Block } : {} )
    & ( T extends LessonOutcome                             ? { readonly lesson: LessonSchema} : {});

export class Subject extends BaseModel implements SubjectParams {
  readonly type = 'subject';
  readonly name: string;
  readonly units: Unit[];

  readonly context: SubjectNodeContext<Subject> = {};

  constructor(params: SubjectParams) {
    super(params);

    this.name = params.name;
    this.units = params.units.map(unit => new Unit(unit, {subject: this}));
  }

  getUnit(ref: ModelRef<Unit>): Unit | undefined {
    return this.units.find(unit => unit.id === ModelRef.id(ref));
  }

  getNode(type: SubjectNodeType, id: string): SubjectNode | undefined {
    if (type === 'subject') {
      return id === this.id ? this : undefined;
    }
    return this.units
      .map(unit => unit.getNode(type, id))
      .find(unit => unit !== undefined);
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

  readonly blocks: BlockParams[];
}

function unitParamsFromJson(obj: unknown): UnitParams {
  return json.object<UnitParams>({
    ...Model.properties,
    type: { value: 'unit' },
    name: json.string,
    blocks: json.array(blockParamsFromJson)
  }, obj);
}

export class Unit extends BaseModel implements UnitParams {

  readonly type = 'unit';

  readonly name: string;

  readonly blocks: Block[];

  constructor(params: UnitParams, readonly context: SubjectNodeContext<Unit>) {
    super(params);

    this.name = params.name;
    this.blocks = params.blocks.map(block => new Block(block, {...context, unit: this}));
  }

  getBlock(block: ModelRef<Block>) {
    const blockId = ModelRef.id(block);
    return this.blocks.find(b => b.id === blockId) || null;
  }


  getNode(type: SubjectNodeType, id: string) {
    if (type === 'unit') {
      return this.id === id ? this : undefined;
    }
    return this.blocks
      .map(block => block.getNode(type, id))
      .find(block => block !== undefined);
  }

}

/********************************************
 *
 * BLOCKS
 *
 ********************************************/

export interface BlockParams extends Model {
  readonly name: string;
  readonly lessons: LessonSchemaParams[];
}

function blockParamsFromJson(obj: unknown): BlockParams {
  return json.object<BlockParams>({
    ...Model.properties,
    type: { value: 'block' },
    name: json.string,
    lessons: json.array(lessonSchemaParamsFromJson)
  }, obj);
}

export class Block extends BaseModel implements BlockParams {

  readonly type = 'block';

  readonly name: string;
  readonly lessons: LessonSchema[];

  constructor(params: BlockParams, readonly context: SubjectNodeContext<Block>) {
    super(params);

    this.name = params.name;
    this.lessons = params.lessons.map(
      lesson => new LessonSchema(lesson, {...context, block: this})
    );
  }

  getLesson(lesson: ModelRef<LessonSchema>): LessonSchema | undefined {
    const lessonId = ModelRef.id(lesson);
    return this.lessons.find(item => item.id === lessonId);
  }

  getNode(type: SubjectNodeType, id: string): SubjectNode | undefined {
    if (type === 'block') {
      return this.id === id ? this : undefined;
    }
    return this.lessons
      .map(lesson => lesson.getNode(type, id))
      .find(node => node !== undefined);
  }

}

/********************************************
 *
 * LESSON SCHEMA
 *
 ********************************************/

export interface LessonSchemaParams extends Model {
  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcomeParams[];
  readonly exampleDescriptions: string[];
}

function lessonSchemaParamsFromJson(obj: unknown): LessonSchemaParams {
  return json.object<LessonSchemaParams>({
    ...Model.properties,
    type: { value: 'lesson' },
    code: json.string,
    name: json.string,
    number: json.number,
    outcomes: json.array(lessonOutcomeParamsFromJson),
    exampleDescriptions: json.array(json.string)
  }, obj);
}

export class LessonSchema extends BaseModel implements LessonSchemaParams {

  readonly type = 'lesson';

  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcome[];
  readonly exampleDescriptions: string[];

  constructor(
    params: LessonSchemaParams,
    readonly context: SubjectNodeContext<LessonSchema>
  ) {
    super(params);

    this.code = params.code;
    this.name = params.name;

    this.number = params.number;

    this.outcomes = params.outcomes.map(outcome => {
      return new LessonOutcome(outcome, { ...context, lesson: this });
    });
    this.exampleDescriptions = params.exampleDescriptions;
  }

  getNode(type: SubjectNodeType, id: string) {
    if (type === 'lesson') {
      return id === this.id ? this : undefined;
    }
    return this.outcomes.map(outcome => outcome.getNode(type, id)).find(node => node !== undefined);
  }
}

/********************************************
 *
 * LESSON OUTCOME
 *
 ********************************************/


export interface LessonOutcomeParams extends Model {
  readonly type: 'lesson-outcome';
  readonly name: string;
  readonly description: string;
}

function lessonOutcomeParamsFromJson(obj: unknown): LessonOutcomeParams {
  return json.object<LessonOutcomeParams>({
    ...Model.properties,
    type: { value: 'lesson-outcome' },
    name: json.string,
    description: json.string
  }, obj);
}

export class LessonOutcome extends BaseModel implements LessonOutcomeParams {
  readonly type = 'lesson-outcome';

  readonly name: string;
  readonly description: string;

  constructor(
      params: LessonOutcomeParams,
      readonly context: SubjectNodeContext<LessonOutcome>
  ) {
    super(params);

    this.name = params.name;
    this.description = params.description;
  }

  getNode(type: SubjectNodeType, id: string) {
    if (type === 'lesson-outcome') {
      return id === this.id ? this : undefined;
    }
    return undefined;
  }
}


/********************************************
 *
 * SUBJECT NODE
 *
 ********************************************/

export type SubjectNode = Subject | Unit | Block | LessonSchema | LessonOutcome;
export type SubjectNodeType = SubjectNode['type'];

export const SubjectNode = {
  fromJson: (obj: unknown): SubjectNode => {
    // The subject is always available, no need to ever pass it as a nested association.
    throw parseError('subject node is always encoded as a string');
  }
};

export function subjectNodeChildren(node: SubjectNode): SubjectNode[] {
  switch (node.type) {
    case 'subject':
      return node.units;
    case 'unit':
      return node.blocks;
    case 'block':
      return node.lessons;
    case 'lesson':
      return node.outcomes;
    default:
      return [];
  }
}

export function subjectNodeParent(node: SubjectNode): SubjectNode | undefined {
  switch (node.type) {
    case 'unit':
      return node.context.subject;
    case 'block':
      return node.context.unit;
    case 'lesson':
      return node.context.block;
    case 'lesson-outcome':
      return node.context.lesson;
  }
}

export function subjectNodePath(node: SubjectNode | undefined): SubjectNode[]  {
  if (node === undefined) {
    return [];
  }

  const pathToParent = subjectNodePath(subjectNodeParent(node));
  return [...pathToParent, node];
}


