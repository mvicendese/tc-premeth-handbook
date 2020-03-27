import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {UnitBlock} from './unit-block';
import {Model, ModelParams} from '../model-base/model';
import {StudentBlockTestResult, UnitBlockResultParams} from './student-block-test-result';
import {Unit} from './unit';
import {Student} from './student';

export interface UnitResultParams extends ModelParams {
  readonly type: 'unit-result';

  readonly blocks: {[blockId: string]: UnitBlockResultParams[]};
}

export class StudentUnitTestResult extends Model implements UnitResultParams {
  readonly type = 'unit-result';

  readonly unit: ModelRef<Unit>;
  readonly student: ModelRef<Student>;

  readonly blocks: {[blockId: string]: StudentBlockTestResult[]};

  constructor(params: UnitResultParams) {
    super(params);
    this.blocks = {};
    Object.entries(params.blocks).forEach(([blockId, blockAttempts]) => {
      this.blocks[blockId] = blockAttempts.map(attempt => new StudentBlockTestResult(attempt));
    });
  }

  maxBlockAttempt(blockId: string): StudentBlockTestResult | undefined {
    // Sort so the largest mark is first.
    const blockResults = (this.blocks[blockId] || []).sort((a, b) => {
      return Math.sign(b.mark - a.mark);
    });
    return blockResults[0];
  }

}
