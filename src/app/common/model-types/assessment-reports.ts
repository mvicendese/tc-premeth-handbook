import json, {Decoder} from '../json';
import {School, Student, SubjectClass} from './schools';
import {LessonSchema, Subject, SubjectNode, SubjectNodeType} from './subjects';
import {
  Assessment,
  AssessmentType,
  BlockAssessment,
  LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment,
  UnitAssessment
} from './assessments';
import {Ref, refFromJson} from '../model-base/ref';

export interface Report<T extends Assessment> {
  readonly assessmentType: T['type'];

  readonly school: Ref<School>;
  readonly subject: Ref<Subject>;
  readonly subjectNode: Ref<SubjectNode>;

  readonly subjectClass: Ref<SubjectClass> | null;

  readonly generatedAt: Date;

  readonly candidateCount: number;
  readonly candidates: ReadonlyArray<Ref<Student>>;

  readonly attemptedCandidateCount: number;
  readonly attemptedCandidates: ReadonlyArray<Ref<Student>>;

  readonly percentAttempted: number;
}

export const Report = {
  properties: <A extends AssessmentType>(assessmentType: A) => ({
    assessmentType: {value: assessmentType},
    school: refFromJson('school', School.fromJson),
    subject: refFromJson('subject', Subject.fromJson),

    subjectNode: refFromJson(SubjectNodeType, SubjectNode.fromJson),

    subjectClass: json.nullable(refFromJson('class', SubjectClass.fromJson)),
    generatedAt: json.date,

    candidateCount: json.number,
    candidates: json.array(refFromJson('student', Student.fromJson)),
    attemptedCandidateCount: json.number,
    attemptedCandidates: json.array(refFromJson('student', Student.fromJson)),

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
    assessmentType: {value: 'unit-assessment'}
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

  readonly completeCandidates: Ref<Student>[];
  readonly completeCandidateCount: number;

  readonly partiallyCompleteCandidates: Ref<Student>[];
  readonly partiallyCompleteCandidateCount: number;

  readonly percentPartiallyComplete: number;
  readonly percentComplete: number;

  readonly mostRecentCompletionAt: Date | null;
}

export const LessonPrelearningReport = {
  fromJson: (obj) => json.object<LessonPrelearningReport>({
    ...Report.properties('lesson-prelearning-assessment'),
    completeCandidateCount: json.number,
    completeCandidates: json.array(refFromJson('student', Student.fromJson)),
    partiallyCompleteCandidateCount: json.number,
    partiallyCompleteCandidates: json.array(refFromJson('student', Student.fromJson)),

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
    function getAssessmentType<T extends AssessmentType>(o: unknown): T {
      return json.object({assessmentType: AssessmentType.fromJson}, o).assessmentType as T;
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

