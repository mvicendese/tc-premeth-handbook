import {Injectable} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppStateService} from '../../app-state.service';
import {distinctUntilChanged, endWith, filter, map, pluck} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, defer, Observable, Unsubscribable} from 'rxjs';
import {Subject, Unit} from '../../common/model-types/subjects';

export interface UnitContextState {
  blockId: string | null;
}

@Injectable()
export class UnitContextService {
  private resources: Unsubscribable[] = [];

  readonly unit$: Observable<Unit> = defer(() =>
    combineLatest([
      this.appState.subject$.pipe(filter((s): s is Subject => s != null)),
      this.route.paramMap.pipe(map(params => params.get('unit_id')))
    ]).pipe(
      map(([subject, unitId]) => subject.getUnit(unitId))
    )
  );

  private readonly stateSubject = new BehaviorSubject<UnitContextState>({
    blockId: null as string | null
  });

  readonly blockId$ = defer(() => this.stateSubject.pipe(pluck('blockId'), distinctUntilChanged()));

  readonly block$ = defer(() =>
    combineLatest([this.unit$, this.blockId$]).pipe(
      map(([unit, blockId]) => blockId && unit.getBlock(blockId))
    )
  );

  constructor(
    readonly appState: AppStateService,
    readonly route: ActivatedRoute) {
  }

  useBlockRoute(blockRoute: ActivatedRoute): Unsubscribable {
    return blockRoute.paramMap.pipe(
      map(params => params.get('block_id')),
      endWith(null as string | null)
    ).subscribe(
      blockId => this.setState('blockId', blockId)
    );
  }

  setState<K extends keyof UnitContextState>(key: K, value: UnitContextState[K]) {
    this.stateSubject.next({...this.stateSubject.value, [key]: value});
  }

  init(): Unsubscribable {
    const stateSubjectSubscription = this.stateSubject.subscribe();
    return {
      unsubscribe: () => this.stateSubject.complete()
    };
  }

}
