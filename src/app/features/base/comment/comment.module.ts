import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {BaseAuthModule} from '../auth/auth.module';
import {CommentCardComponent} from './comment-card.component';
import {MatCardModule} from '@angular/material/card';
import {CommentFormComponent} from './comment-form.component';
import {ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {CommentSectionComponent} from './comment-section.component';
import {MatButtonModule} from '@angular/material/button';
import {PersonModule} from '../person/person.module';
import {CommonComponentsModule} from '../../../common/components/common-components.module';
import {MatIconModule} from '@angular/material/icon';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,

    CommonComponentsModule,

    PersonModule
  ],
  declarations: [
    CommentCardComponent,
    CommentFormComponent,
    CommentSectionComponent
  ],
  exports: [
    CommentCardComponent,
    CommentFormComponent,
    CommentSectionComponent
  ]
})
export class BaseCommentModule {}
