import json, {parseError} from '../json';

import {ModelRef} from '../model-base/model-ref';
import {School, schoolFromJson, Student} from './schools';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, Unit} from './subjects';
import {createModel, Model, modelProperties} from '../model-base/model';

export type AssessmentType
  = 'unit-assessment'
  | 'block-assessment'
  | 'lesson-prelearning-assessment'
  | 'lesson-outcome-self-assessment';

const allAssessmentTypes = [
  'unit-assessment',
  'block-assessment',
  'lesson-prelearning-assessment',
  'lesson-outcome-self-assessment'
];

export const AssessmentType = {
  fromJson: (obj: unknown) => {
    const str = json.string(obj);
    if (allAssessmentTypes.includes(str)) {
      return str as AssessmentType;
    }
    throw parseError(`Expected an assessment type`);
  }
};

export interface Assessment extends Model {
  readonly type: AssessmentType;

  readonly school: ModelRef<School>;
  readonly subject: ModelRef<Subject>;
  readonly student: ModelRef<Student>;

  readonly subjectNode: ModelRef<SubjectNode>;

  readonly isAttempted: boolean;
  readonly attemptedAt: Date | null;
}

export const Assessment = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    ...modelProperties<T>(assessmentType),
    school: ModelRef.fromJson(schoolFromJson),
    subject: ModelRef.fromJson(Subject.fromJson),
    student: ModelRef.fromJson(Student.fromJson),

    subjectNode: ModelRef.fromJson<SubjectNode>(SubjectNode.fromJson),

    isAttempted: json.bool,
    attemptedAt: json.nullable(json.date)
  }),

  create: <T extends Assessment>(assessmentType: T['type'], options: Partial<Assessment>) => {
    if (options.subject == null) {
      throw new Error(`A subject is required`);
    }
    if (options.subjectNode == null) {
      throw new Error(`A subjectNode is required`)
    }
    if (options.student == null) {
      throw new Error(`A student is required`);
    }
    if (options.school == null) {
      throw new Error(`A school is required`);
    }
    return {
      ...createModel<T>(assessmentType),
      school: options.school,
      subject: options.subject,
      student: options.student,
      subjectNode: options.subjectNode,
      isAttempted: false,
      attemptedAt: null
    };
  }
};

export type CompletionState = 'none' | 'partially-complete' | 'complete';
export const CompletionState = {
  fromJson: (obj: unknown) => {
    const str = json.string(obj);
    if (['none', 'partially-complete', 'complete'].includes(str)) {
      return str as CompletionState;
    }
    throw parseError('Unrecognised completion state: ' + str);
  }
};

export interface CompletionBasedAssessment extends Assessment {
  readonly completionState: CompletionState | null;
  readonly isPartiallyComplete: boolean;
  readonly isComplete: boolean;
}

export const CompletionBasedAssessment = {
  create: (type: AssessmentType, options: Partial<Assessment>): Partial<CompletionBasedAssessment> => ({
    ...Assessment.create(type, options),
    completionState: null,
    isPartiallyComplete: false,
    isComplete: false
  } as Partial<CompletionBasedAssessment>),

  properties: <T extends Assessment>(assessmentType: T['type']) => {
    return {
      ...Assessment.properties<T>(assessmentType),
      isComplete: json.bool,
      isPartiallyComplete: json.bool,
      completionState: json.nullable(CompletionState.fromJson)
    };
  }
};

export interface RatingBasedAssessment extends Assessment {
  readonly rating: number;
}

export const RatingBasedAssessment = {
  properties: <T extends RatingBasedAssessment>(assessmentType: T['type']) => ({
    ...Assessment.properties<T>(assessmentType),
    rating: json.number
  })
};

export interface UnitAssessment extends RatingBasedAssessment {
  readonly type: 'unit-assessment';
  readonly unit: ModelRef<Unit>;
}

export const UnitAssessment = {
  fromJson: json.object<UnitAssessment>({
    ...RatingBasedAssessment.properties<UnitAssessment>('unit-assessment'),
  })
};

export interface BlockAssessment extends RatingBasedAssessment {
  readonly type: 'block-assessment';
  readonly block: ModelRef<Block>;
}

export const BlockAssessment = {
  fromJson: json.object<BlockAssessment>({
    ...RatingBasedAssessment.properties<BlockAssessment>('block-assessment'),
  })
};

export interface LessonPrelearningAssessment extends CompletionBasedAssessment {
  readonly type: 'lesson-prelearning-assessment';
  readonly lesson: ModelRef<LessonSchema>;
}

export const LessonPrelearningAssessment = {
  create: (lesson: LessonSchema, student: Student): LessonPrelearningAssessment => ({
    ...CompletionBasedAssessment.create('lesson-prelearning-assessment', {
      school: student.school,
      subject: lesson.context.subject,
      subjectNode: lesson,
      student
    }),
    lesson,
  } as LessonPrelearningAssessment),

  fromJson: (obj) =>
    json.object<LessonPrelearningAssessment>({
      ...CompletionBasedAssessment.properties<LessonPrelearningAssessment>('lesson-prelearning-assessment'),
  }, obj)
};

export interface LessonOutcomeSelfAssessment extends RatingBasedAssessment {
  readonly type: 'lesson-outcome-self-assessment';
  readonly lessonOutcome: ModelRef<LessonOutcome>;
}

export const LessonOutcomeSelfAssessment = {
  fromJson: json.object<LessonOutcomeSelfAssessment>({
    ...RatingBasedAssessment.properties<LessonOutcomeSelfAssessment>('lesson-outcome-self-assessment'),
  })
};

export type AnyAssessment
  = UnitAssessment
  | BlockAssessment
  | LessonPrelearningAssessment
  | LessonOutcomeSelfAssessment;

export const AnyAssessment = {
  fromJson: <T extends AnyAssessment>(obj: unknown) => {
    function getAssessmentType(obj: unknown): AssessmentType {
      return json.object({type: AssessmentType.fromJson}, obj).type;
    }

    return json.union<AnyAssessment>(
      getAssessmentType,
      {
        'unit-assessment': UnitAssessment.fromJson,
        'block-assessment': BlockAssessment.fromJson,
        'lesson-prelearning-assessment': LessonPrelearningAssessment.fromJson,
        'lesson-outcome-self-assessment': LessonOutcomeSelfAssessment.fromJson
      },
      obj
    ) as T;
  }
};
