import json, {Decoder} from '../json';
import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {School, schoolFromJson, Student, SubjectClass, subjectClassFromJson} from './schools';
import {LessonSchema, Subject, SubjectNode} from './subjects';
import {
  Assessment,
  AssessmentType,
  BlockAssessment,
  LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment,
  UnitAssessment
} from './assessments';

export interface Report<T extends Assessment> {
  readonly assessmentType: T['type'];

  readonly school: ModelRef<School>;
  readonly subject: ModelRef<Subject>;
  readonly subjectNode: ModelRef<SubjectNode>;

  readonly subjectClass: ModelRef<SubjectClass> | null;

  readonly generatedAt: Date;

  readonly candidateCount: number;
  readonly candidates: ReadonlyArray<ModelRef<Student>>;

  readonly attemptedCandidateCount: number;
  readonly attemptedCandidates: ReadonlyArray<ModelRef<Student>>;

  readonly percentAttempted: number;
}

export const Report = {
  properties: <A extends AssessmentType>(assessmentType: A) => ({
    assessmentType: {value: assessmentType},
    school: modelRefFromJson(schoolFromJson),
    subject: modelRefFromJson(Subject.fromJson),

    subjectNode: modelRefFromJson<SubjectNode>(),

    subjectClass: json.nullable(modelRefFromJson(subjectClassFromJson)),
    generatedAt: json.date,

    candidateCount: json.number,
    candidates: json.array(modelRefFromJson(Student.fromJson)),
    attemptedCandidateCount: json.number,
    attemptedCandidates: json.array(modelRefFromJson(Student.fromJson)),

    percentAttempted: json.number
  })
};

export interface CompletionBasedReport<T extends Assessment> extends Report<T> {
}

export interface UnitAssessmentReport extends Report<UnitAssessment> {
}

export const UnitAssessmentReport = {
  fromJson: json.object<UnitAssessmentReport>({
    ...Report.properties('unit-assessment'),
  })
};

export interface BlockAssessmentReport extends Report<BlockAssessment> {

}

export const BlockAssessmentReport = {
  fromJson: json.object<BlockAssessmentReport>({
    ...Report.properties('block-assessment')
  })
};

export interface LessonPrelearningReport extends Report<LessonPrelearningAssessment> {
  readonly percentCompleted: number;

  readonly completeCandidates: ModelRef<Student>[];
  readonly completeCandidateCount: number;

  readonly partiallyCompleteCandidates: ModelRef<Student>[];
  readonly partiallyCompleteCandidateCount: number;

  readonly percentPartiallyComplete: number;
  readonly percentComplete: number;

  readonly mostRecentCompletionAt: Date | null;
}

export const LessonPrelearningReport = {
  fromJson: (obj) => json.object<LessonPrelearningReport>({
    ...Report.properties('lesson-prelearning-assessment'),
    completeCandidateCount: json.number,
    completeCandidates: json.array(modelRefFromJson(Student.fromJson)),
    partiallyCompleteCandidateCount: json.number,
    partiallyCompleteCandidates: json.array(modelRefFromJson(Student.fromJson)),

    percentComplete: json.number,
    percentPartiallyComplete: json.number,

    mostRecentCompletionAt: json.nullable(json.date)
  }, obj)
};

export interface LessonOutcomeSelfAssessmentReport extends Report<LessonOutcomeSelfAssessment> {
  ratingAverage: number;
  ratingStdDev: number;

  /**
   * A map of the _attempted_ candidates to the scores they achieved
   */
  candidateRatings: {[candidateId: string]: number};
}

export const LessonOutcomeSelfAssessmentReport = {
  fromJson: (obj: unknown) => {
    return json.object<LessonOutcomeSelfAssessmentReport>({
      ...Report.properties('lesson-outcome-self-assessment'),
      ratingAverage: json.number,
      ratingStdDev: json.number,
      candidateRatings: json.record(json.number),
    }, obj);
  },
};

export type AnyReport = UnitAssessmentReport | BlockAssessmentReport | LessonPrelearningReport | LessonOutcomeSelfAssessmentReport;

export const AnyReport = {
  fromJson: (obj: unknown) => {
    function getAssessmentType<T extends AssessmentType>(obj: unknown): T {
      return json.object({assessmentType: AssessmentType.fromJson}, obj).assessmentType as T;
    }

    return json.union<AnyReport>(
      getAssessmentType,
      {
        'unit-assessment': UnitAssessmentReport.fromJson,
        'block-assessment': BlockAssessmentReport.fromJson,
        'lesson-prelearning-assessment': LessonPrelearningReport.fromJson,
        'lesson-outcome-self-assessment': LessonOutcomeSelfAssessmentReport.fromJson
      },
      obj
    );
  }
};

