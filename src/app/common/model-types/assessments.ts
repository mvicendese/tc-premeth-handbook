import json, {Decoder, parseError} from '../json';

import {ModelRef} from '../model-base/model-ref';
import {School, schoolFromJson, Student} from './schools';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, Unit} from './subjects';
import {Model} from '../model-base/model';
import {modelEnum, ModelEnum, modelMeta} from '../model-base/model-meta';

export type AssessmentType
  = 'unit-assessment'
  | 'block-assessment'
  | 'lesson-prelearning-assessment'
  | 'lesson-outcome-self-assessment';

export const AssessmentType = modelEnum<AssessmentType>({
  name: 'AssessmentType',
  values: [
    'unit-assessment',
    'block-assessment',
    'lesson-prelearning-assessment',
    'lesson-outcome-self-assessment'
  ]
});

export interface Assessment extends Model {
  readonly type: AssessmentType;

  readonly school: ModelRef<School>;
  readonly subject: ModelRef<Subject>;
  readonly student: ModelRef<Student>;

  readonly subjectNode: ModelRef<SubjectNode>;

  readonly isAttempted: boolean;
  readonly attemptedAt: Date | null;
}

export const Assessment = modelMeta<Assessment>({
  properties: {
    ...Model.properties,
    type: AssessmentType.fromJson,

    school: ModelRef.fromJson(schoolFromJson),
    subject: ModelRef.fromJson(Subject.fromJson),
    student: ModelRef.fromJson(Student.fromJson),

    subjectNode: ModelRef.fromJson<SubjectNode>(SubjectNode.fromJson),

    isAttempted: json.bool,
    attemptedAt: json.nullable(json.date)
  },

  create: (options: Partial<Assessment>) => {
    if (options.subject == null) {
      throw new Error(`A subject is required`);
    }
    if (options.subjectNode == null) {
      throw new Error(`A subjectNode is required`);
    }
    if (options.student == null) {
      throw new Error(`A student is required`);
    }
    if (options.school == null) {
      throw new Error(`A school is required`);
    }
    return {
      ...Model.create(options),
      type: options.type as AssessmentType,

      school: options.school,
      subject: options.subject,
      student: options.student,
      subjectNode: options.subjectNode,
      isAttempted: false,
      attemptedAt: null
    };
  }
});

export type CompletionState = 'none' | 'partially-complete' | 'complete';
export const CompletionState = modelEnum<CompletionState>({
  name: 'CompletionState',
  values: ['none', 'partially-complete', 'complete']
});


export interface CompletionBasedAssessment extends Assessment {
  readonly completionState: CompletionState | null;
  readonly isPartiallyComplete: boolean;
  readonly isComplete: boolean;
}

export const CompletionBasedAssessment = modelMeta({
  create: (options: Partial<CompletionBasedAssessment>): CompletionBasedAssessment => {
    const assessment = Assessment.create(options);

    return {
      ...Assessment.create(options),
      completionState: options.completionState || null,
      isPartiallyComplete: options.completionState === 'partially-complete',
      isComplete: options.completionState === 'complete'
    };
  },
  properties: {
    ...Assessment.properties,
    isComplete: json.bool,
    isPartiallyComplete: json.bool,
    completionState: json.nullable(CompletionState.fromJson)
  }
});

export interface RatingBasedAssessment extends Assessment {
  readonly rating: number;
}

export const RatingBasedAssessment = modelMeta<RatingBasedAssessment>({
  create(args: Partial<RatingBasedAssessment>) {
    return {
      ...Assessment.create(args),
      rating: 0
    };
  },
  properties: {
    ...Assessment.properties,
    rating: json.number
  }
});

export interface UnitAssessment extends RatingBasedAssessment {
  readonly type: 'unit-assessment';
  readonly unit: ModelRef<Unit>;
}

export const UnitAssessment = modelMeta<UnitAssessment>({
  create: (options: {
    unit: Unit;
    student: Student;
  }) => ({
    ...RatingBasedAssessment.create({
      school: options.student.school,
      subject: options.unit.context.subject,
    }),
    type: 'unit-assessment',
    unit: options.unit
  }),

  properties: {
    ...RatingBasedAssessment.properties,
    type: { value: 'unit-assessment' },
    unit: { get() { return this.subjectNode as Unit; } }
  },
});

export interface BlockAssessment extends RatingBasedAssessment {
  readonly type: 'block-assessment';
  readonly block: ModelRef<Block>;
}

export const BlockAssessment = modelMeta<BlockAssessment>({
  create: (options: {
    block: Block;
    student: Student
  }) => ({
    ...RatingBasedAssessment.create({
      school: options.student.school,
      subject: options.block.context.subject
    }),
    type: 'block-assessment',
    block: options.block
  }),

  properties: {
    ...RatingBasedAssessment.properties,
    type: { value: 'block-assessment' },
    block: { get() { return this.subjectNode; } }
  }
});

export interface LessonPrelearningAssessment extends CompletionBasedAssessment {
  readonly type: 'lesson-prelearning-assessment';
  readonly lesson: ModelRef<LessonSchema>;
}

export const LessonPrelearningAssessment = modelMeta<LessonPrelearningAssessment>({
  create: (options: {
    lesson: LessonSchema;
    student: Student;
    completionState: CompletionState | null;
  }) => ({
    ...CompletionBasedAssessment.create({
      type: 'lesson-prelearning-assessment',
      school: options.student.school,
      subject: options.lesson.context.subject,
      subjectNode: options.lesson,
      student: options.student,
      completionState: options.completionState
    }),
    type: 'lesson-prelearning-assessment',
    lesson: options.lesson
  }),

  properties: {
    ...CompletionBasedAssessment.properties,
    type: { value: 'lesson-prelearning-assessment' },
    lesson: {
      get: () => this.subjectNode as LessonSchema
    }
  },
});

export interface LessonOutcomeSelfAssessment extends RatingBasedAssessment {
  readonly type: 'lesson-outcome-self-assessment';
  readonly lessonOutcome: ModelRef<LessonOutcome>;
}

export const LessonOutcomeSelfAssessment = modelMeta<LessonOutcomeSelfAssessment>({
  create: (options: {
    lessonOutcome: LessonOutcome;
    student: Student;
  }) => ({
    ...RatingBasedAssessment.create({
      type: 'lesson-outcome-self-assessment',
      school: options.student.school,
      subject: options.lessonOutcome.context.subject,
      subjectNode: options.lessonOutcome
    }),
    type: 'lesson-outcome-self-assessment',
    lessonOutcome: options.lessonOutcome
  }),

  properties: {
    ...RatingBasedAssessment.properties,
    type: { value: 'lesson-outcome-self-assessment' },
    lessonOutcome: { get() { return this.subjectNode; } }
  }
});

export type TypedAssessment<T extends AssessmentType>
  = T extends 'unit-assessment' ? UnitAssessment
    : T extends 'block-assessment' ? BlockAssessment
      : T extends 'lesson-prelearning-assessment' ? LessonPrelearningAssessment
        : T extends 'lesson-outcome-self-assessment' ? LessonOutcomeSelfAssessment
          : never;


export type AnyAssessment
  = UnitAssessment
  | BlockAssessment
  | LessonPrelearningAssessment
  | LessonOutcomeSelfAssessment;

export const AnyAssessment = {
  fromJson: <T extends Assessment>(obj: unknown) => {
    function getAssessmentType(object: unknown): AssessmentType {
      return json.object({type: AssessmentType.fromJson}, object).type;
    }

    return json.union<any>(
      getAssessmentType,
      {
        'unit-assessment': UnitAssessment.fromJson,
        'block-assessment': BlockAssessment.fromJson,
        'lesson-prelearning-assessment': LessonPrelearningAssessment.fromJson,
        'lesson-outcome-self-assessment': LessonOutcomeSelfAssessment.fromJson
      },
      obj
    );
  }
};
