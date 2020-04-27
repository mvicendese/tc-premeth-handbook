import json, {Decoder, JsonObjectProperties} from '../json';

import {
  AnyAssessment,
  Assessment,
  AssessmentType,
  BlockAssessment, CompletionBasedAssessment,
  LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment,
  UnitAssessment
} from './assessments';
import {ModelDocument} from '../model-base/document';
import {ModelRef} from '../model-base/model-ref';
import {Student} from './schools';
import {Subject, SubjectNode} from './subjects';
import {ModelDocumentMeta, modelDocumentMeta} from '../model-base/model-meta';

export interface Progress<T extends Assessment = AnyAssessment> extends ModelDocument {
  readonly assessmentType: T['type'];
  readonly student: ModelRef<Student>;

  readonly subject: ModelRef<Subject>;

  // Aggregtes the results over all children of the specified node.
  // If null, all results over the course of the subject are included
  readonly subjectNode: ModelRef<SubjectNode> | null;

  readonly assessmentCount: number;
  readonly assessments: T[];

  readonly attemptedAssessmentCount: number;
  readonly attemptedAssessments: ModelRef<T>[];

  readonly percentAttempted: number;
}

export const Progress = modelDocumentMeta<Progress<any>>({
  properties: {
    ...ModelDocument.properties,
    assessmentType: AssessmentType.fromJson,

    student: ModelRef.fromJson(Student.fromJson),
    subject: ModelRef.fromJson(Subject.fromJson),
    subjectNode: json.nullable(ModelRef.fromJson(SubjectNode.fromJson)),

    assessmentCount: json.number,
    assessments: json.array(AnyAssessment.fromJson),

    attemptedAssessmentCount: json.number,
    attemptedAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson)),

    percentAttempted: json.number,
  }
});

export interface PassFailProgress<T extends Assessment = AnyAssessment> extends Progress<T> {
  passedAssessments: ModelRef<T>[];
}

export const PassFailProgress = modelDocumentMeta<PassFailProgress>({
  properties: {
    ...Progress.properties,
    passedAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson))
  }
});


export interface CompletionBasedProgress<T extends Assessment = AnyAssessment> extends Progress<T> {
  readonly completeAssessmentCount: number;
  readonly completeAssessments: (ModelRef<AnyAssessment>)[];

  readonly partiallyCompleteAssessmentCount: number;
  readonly partiallyCompleteAssessments: (ModelRef<AnyAssessment>)[];
}

export const CompletionBasedProgress = modelDocumentMeta<CompletionBasedProgress>({
  properties: {
    ...Progress.properties,
    completeAssessmentCount: json.number,
    completeAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson)),
    partiallyCompleteAssessmentCount: json.number,
    partiallyCompleteAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson))
  },
});

export type Grade
  = 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'E+' | 'E' | 'E-'
  | 'F';

interface GradeItemProgress<T extends Assessment = AnyAssessment> extends ModelDocument {
  readonly assessments: T[];

  readonly assessmentCount: number;
}

const GradeItemProgress = modelDocumentMeta<GradeItemProgress<any>>({
  properties: {
    ...ModelDocument.properties,
    assessments: json.array(AnyAssessment.fromJson),
    assessmentCount: json.number
  }
});

export interface GradedProgress<T extends Assessment = AnyAssessment> extends Progress<T> {
  gradeAssessments: Record<Grade, GradeItemProgress<T>>;
}

export const GradedProgress = modelDocumentMeta<GradedProgress<any>>({
  properties: {
    ...Progress.properties,
    gradeAssessments: json.record<Grade, GradeItemProgress<any>>(GradeItemProgress.fromJson)
  }
});

export interface RatedProgress<T extends Assessment = AnyAssessment> extends Progress<T> {
}

export const RatedProgress = modelDocumentMeta<RatedProgress>({
  properties: Progress.properties
});


export interface UnitAssessmentProgress extends RatedProgress<UnitAssessment> {
  readonly assessmentType: 'unit-assessment';
}

export const UnitAssessmentProgress = modelDocumentMeta<UnitAssessmentProgress>({
  properties: (RatedProgress.properties as JsonObjectProperties<RatedProgress<UnitAssessment>>)
});

export interface BlockAssessmentProgress extends RatedProgress<BlockAssessment> {
  readonly assessmentType: 'block-assessment';
}

export const BlockAssessmentProgress = modelDocumentMeta<BlockAssessmentProgress>({
  properties: {
    ...(RatedProgress.properties as JsonObjectProperties<RatedProgress<BlockAssessment>>),
    assessmentType: {value: 'block-assessment'}
  },
});

export interface LessonPrelearningAssessmentProgress extends CompletionBasedProgress<LessonPrelearningAssessment> {
  readonly assessmentType: 'lesson-prelearning-assessment';

  readonly partiallyCompleteAssessmentPercent: number;
  readonly completeAssessmentPercent: number;

  readonly notAttemptedCount: number;
  readonly notAttemptedPercent: number;
  readonly noCompletionCount: number;
  readonly noCompletionPercent: number;

  /**
   * Assigns a numeric value to this progress for use when comparing the results to other students.
   *
   * The calculated value is calculated from the assessments of the progress by assigning:
   * - 1 for every completed assessment
   * - 0 for every partially complete or not-attempted assessment
   * - -1  for every "no completion" assessment
   */
  readonly score: number;
}

export const LessonPrelearningAssessmentProgress = modelDocumentMeta<LessonPrelearningAssessmentProgress>({
  properties: {
    ...(CompletionBasedProgress.properties as JsonObjectProperties<CompletionBasedProgress<LessonPrelearningAssessment>>),
    assessmentType: { value: 'lesson-prelearning-assessment' as 'lesson-prelearning-assessment' },
    partiallyCompleteAssessmentPercent: {
      get() {
        return (100 * this.partiallyCompleteAssessmentCount) / this.assessmentCount;
      }
    },
    completeAssessmentPercent: {
      get() {
        return (100 * this.completeAssessmentCount) / this.assessmentCount;
      }
    },

    notAttemptedCount: {
      get() {
        return this.assessmentCount - this.attemptedAssessmentCount;
      }
    },
    notAttemptedPercent: {
      get() {
        return (100 * this.notAttemptedCount) / this.attemptedAssessmentCount;
      }

    },
    noCompletionCount: {
      get() {
        return this.attemptedAssessmentCount - this.partiallyCompleteAssessmentCount;
      }
    },
    noCompletionPercent: {
      get() {
        return (100 * this.noCompletionCount) / this.attemptedAssessmentCount;
      }
    },

    score: {
      get() {
        const assessments: CompletionBasedAssessment[] = this.assessments;
        return assessments.map((assessment) => {
          switch (assessment.completionState) {
            case 'complete':
              return 1;
            case 'none':
              return -1;
            case 'partially-complete':
            default:
              return 0;
          }
        }).reduce((acc, value) => acc + value, 0);
      }
    }
  }
});

export interface LessonOutcomeSelfAssessmentProgress extends RatedProgress<LessonOutcomeSelfAssessment> {
  readonly assessmentType: 'lesson-outcome-self-assessment';
}

export const LessonOutcomeSelfAssessmentProgress = modelDocumentMeta<LessonOutcomeSelfAssessmentProgress>({
  properties: {
    ...(RatedProgress.properties as JsonObjectProperties<RatedProgress<LessonOutcomeSelfAssessment>>)
  }
});

export type ProgressForAssessment<T extends Assessment>
  = T extends UnitAssessment ? UnitAssessmentProgress
  : T extends BlockAssessment ? BlockAssessmentProgress
  : T extends LessonPrelearningAssessment ? LessonPrelearningAssessmentProgress
  : T extends LessonOutcomeSelfAssessment ? LessonOutcomeSelfAssessmentProgress
  : never;

export type AnyProgress
  = UnitAssessmentProgress
  | BlockAssessmentProgress
  | LessonPrelearningAssessmentProgress
  | LessonOutcomeSelfAssessmentProgress;

export const AnyProgress = {
  fromJson: (obj: unknown) => {
    function getAssessmentType(object: unknown): AssessmentType {
      return json.object({assessmentType: AssessmentType.fromJson}, object).assessmentType;
    }

    return json.union<AnyProgress>(
      getAssessmentType,
      {
        'unit-assessment': UnitAssessmentProgress.fromJson,
        'block-assessment': BlockAssessmentProgress.fromJson,
        'lesson-prelearning-assessment': LessonPrelearningAssessmentProgress.fromJson,
        'lesson-outcome-self-assessment': LessonOutcomeSelfAssessmentProgress.fromJson
      },
      obj
    );

  }
};

export type ProgressLite<T extends Progress> = Omit<T, 'assessments'>;
export function progressLiteFromJson<T extends Progress<any>>(meta: ModelDocumentMeta<T>): Decoder<ProgressLite<T>> {
  return json.object<ProgressLite<T>>({
    ...meta.properties,
    assessments: undefined
  });
}


