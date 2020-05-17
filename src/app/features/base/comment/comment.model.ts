import {modelMeta} from '../../../common/model-base/model-meta';
import json from '../../../common/json';
import {Attachable, Attachment, createAttachmentForm} from '../../../common/model-types/base-attachables';
import {Observable} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {filter} from 'rxjs/operators';
import {Model} from '../../../common/model-base/model';
import {Provider, Type} from '@angular/core';
import {Ref, refFromJson} from '../../../common/model-base/ref';
import {ResponsePage} from '../../../common/model-api/response-page';
import {AbstractModelApiService} from '../../../common/model-api/abstract-model-api-service';

export interface CommentInput {
  readonly replyTo?: Ref<Comment> | null;
  readonly content: string;
}

export interface Comment extends Attachment {
  readonly type: 'comment';

  replyTo: Ref<Comment> | null;

  content: string;
  htmlContent: string;
}


export const Comment = modelMeta<Comment>({
  properties: {
    ...Attachment.properties,
    type: {value: 'comment'},
    replyTo: json.nullable(
      refFromJson('comment', (o) => Comment.fromJson(o)),
    ),
    content: json.string,
    htmlContent: json.string
  },
  create: () => { throw new Error('not implemented'); }
});

export type Commentable = Attachable;

export abstract class CommentableService<T extends Model> {
  abstract comments(ref: Ref<T>): Observable<ResponsePage<Comment>>;
  abstract addComment(on: Ref<T>, options: {content: string}): Observable<Comment>;
}

export function provideCommentableService<T extends Model, V extends AbstractModelApiService<T>>(useExisting: Type<V>): Provider {
  return {
    provide: CommentableService,
    useExisting
  };
}
