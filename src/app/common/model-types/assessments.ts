import json, {Decoder, parseError} from '../json';

import {Comment} from '../../features/base/comment/comment.model';

import {School, Student} from './schools';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, Unit} from './subjects';
import {Model} from '../model-base/model';
import {modelEnum, ModelEnum, modelMeta} from '../model-base/model-meta';
import {Ref, refFromJson} from '../model-base/ref';

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

  readonly school: Ref<School>;

  readonly subject: Ref<Subject>;
  readonly student: Ref<Student>;

  readonly subjectNode: Ref<SubjectNode>;

  readonly isAttempted: boolean;
  readonly attemptedAt: Date | null;

  readonly comments: Comment[];
  readonly commentsCount: number;
}

export const Assessment = modelMeta<Assessment>({
  properties: {
    ...Model.properties,
    type: AssessmentType.fromJson,

    school: refFromJson('school', School.fromJson),
    subject: refFromJson('subject', Subject.fromJson),
    student: refFromJson('student', Student.fromJson),

    subjectNode: refFromJson<SubjectNode>('subject-node', SubjectNode.fromJson),

    isAttempted: json.bool,
    attemptedAt: json.nullable(json.date),

    comments: json.array(Comment.fromJson),
    commentsCount: json.number
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
      attemptedAt: null,
      comments: [],
      commentsCount: 0
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
  readonly maxAvailableRating: number | null;
  readonly rating: number | null;
  readonly ratingPercent: number | null;

  readonly grade: 'fail' | 'low-pass' | 'high-pass' | null;
}

export const RatingBasedAssessment = modelMeta<RatingBasedAssessment>({
  create(args: Partial<RatingBasedAssessment>) {
    return {
      ...Assessment.create(args),
      maxAvailableRating: 0,
      rating: 0,
      ratingPercent: 0,
      grade: null
    };
  },
  properties: {
    ...Assessment.properties,
    maxAvailableRating: json.nullable(json.number),
    rating: json.nullable(json.number),
    ratingPercent: json.nullable(json.number),
    grade: {
      get() {
        if (this.ratingPercent === null) {
          return null;
        } else if (this.ratingPercent < 50) {
          return 'fail';
        } else if (this.ratingPercent < 80) {
          return 'low-pass';
        } else {
          return 'high-pass';
        }
      }
    }
  }
});

export interface UnitAssessment extends RatingBasedAssessment {
  readonly type: 'unit-assessment';
  readonly unit: Ref<Unit>;
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
  readonly block: Ref<Block>;
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
  readonly lesson: Ref<LessonSchema>;
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
  readonly lessonOutcome: Ref<LessonOutcome>;
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
