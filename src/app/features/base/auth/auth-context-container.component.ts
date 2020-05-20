import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription, Unsubscribable} from 'rxjs';
import {User} from './user.model';
import {ModelLoader} from '../../../common/model-api-context/model-loader';
import {UserModelLoader} from './user.model-loader.service';


@Component({
  selector: 'base-auth-context-container',
  template: `<ng-content></ng-content>`
})
export class ContextContainerComponent implements OnDestroy {
  private modelLoaderSubscription: Unsubscribable;

  constructor(readonly userContext: UserModelLoader) {
    this.modelLoaderSubscription = userContext.init();
  }

  ngOnDestroy() {
    this.modelLoaderSubscription.unsubscribe();
  }

}
