import {Assessment, AssessmentType, LessonPrelearningAssessment} from './assessment';
import {ModelParams} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';
import {Student, StudentParams} from './student';
import {parseDateParam} from '../model-base/decoders';
import {JsonObject} from '../model-base/model-key-transform';


export interface Report {
  readonly assessmentType: AssessmentType;
}

export interface LessonPrelearningReport extends Report {
  readonly assessmentType: 'lesson-prelearning-assessment';

  readonly count: number;
  readonly studentsCompletedCount;
  readonly percentageComplete: number;

  readonly mostRecentCompletionAt: Date | null;
  readonly mostRecentCompletionBy: Student | null;

  readonly completedStudentIds: string[];
}

export function parseReport(params: JsonObject): Report {
  switch (params.assessmentType) {
    case 'lesson-prelearning-assessment':
      return {
        ...params,
        mostRecentCompletionBy: params.mostRecentCompletionAt && new Student(params.mostRecentCompletionAt as StudentParams),
        mostRecentCompletionAt: parseDateParam(params.mostRecentCompletionAt as string | null)
      } as LessonPrelearningReport;
    default:
      throw new Error(`Unrecognised assessment type: ${params.assessmentType}`);
  }

}


