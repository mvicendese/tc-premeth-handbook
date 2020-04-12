import json, {parseError} from '../json';

import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {School, schoolFromJson, Student} from './schools';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, subjectNodeFromJson, Unit} from './subjects';
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

  readonly node: ModelRef<SubjectNode>;

  readonly isAttempted: boolean;
  readonly attemptedAt: Date | null;
}

export const Assessment = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    ...modelProperties<T>(assessmentType),
    school: modelRefFromJson(schoolFromJson),
    subject: modelRefFromJson(Subject.fromJson),
    student: modelRefFromJson(Student.fromJson),

    node: modelRefFromJson(subjectNodeFromJson),

    isAttempted: json.bool,
    attemptedAt: json.nullable(json.date)
  }),

  create: <T extends Assessment>(assessmentType: T['type'], options: Partial<Assessment>) => {
    if (options.subject == null) {
      throw new Error(`A subject is required`);
    }
    if (options.node == null) {
      throw new Error(`A node is required`)
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
      node: options.node,
      isAttempted: false,
      attemptedAt: null
    };
  }
};

export type CompletionState = 'no' | 'partial' | 'complete';
export const CompletionState = {
  fromJson: (obj: unknown) => {
    const str = json.string(obj);

    if (['no', 'partial', 'complete'].includes(str)) {
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
  create: (type: AssessmentType, options: Partial<Assessment>) => ({
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
    unit: modelRefFromJson(Unit.fromJson)
  })
};

export interface BlockAssessment extends RatingBasedAssessment {
  readonly type: 'block-assessment';
  readonly block: ModelRef<Block>;
}

export const BlockAssessment = {
  fromJson: json.object<BlockAssessment>({
    ...RatingBasedAssessment.properties<BlockAssessment>('block-assessment'),
    block: modelRefFromJson(Block.fromJson)
  })
};

export interface LessonPrelearningAssessment extends CompletionBasedAssessment {
  readonly type: 'lesson-prelearning-assessment';
  readonly lesson: ModelRef<LessonSchema>;
}

export const LessonPrelearningAssessment = {
  create: (lesson: LessonSchema, student: Student) => ({
    ...CompletionBasedAssessment.create('lesson-prelearning-assessment', {
      school: student.school,
      subject: lesson.subject,
      node: lesson,
      student
    }),
    lesson,
  } as LessonPrelearningAssessment),

  fromJson: json.object<LessonPrelearningAssessment>({
    ...CompletionBasedAssessment.properties<LessonPrelearningAssessment>('lesson-prelearning-assessment'),
    lesson: modelRefFromJson(LessonSchema.fromJson),
  })
};

export interface LessonOutcomeSelfAssessment extends RatingBasedAssessment {
  readonly type: 'lesson-outcome-self-assessment';
  readonly lessonOutcome: ModelRef<LessonOutcome>;
}

export const LessonOutcomeSelfAssessment = {
  fromJson: json.object<LessonOutcomeSelfAssessment>({
    ...RatingBasedAssessment.properties<LessonOutcomeSelfAssessment>('lesson-outcome-self-assessment'),
    lessonOutcome: modelRefFromJson(LessonOutcome.fromJson)
  })
};

export type AnyAssessment
  = UnitAssessment
  | BlockAssessment
  | LessonPrelearningAssessment
  | LessonOutcomeSelfAssessment;

export const AnyAssessment = {
  fromJson: (obj: unknown) => {
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
    );
  }
};
