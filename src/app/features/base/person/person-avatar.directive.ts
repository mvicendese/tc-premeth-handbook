// tslint:disable:no-input-rename
import {Directive, ElementRef, HostBinding, Input, OnChanges, OnInit, Renderer2, SimpleChanges} from '@angular/core';
import {Person} from './person.model';

@Directive({
  selector: 'img[basePersonAvatarFor]',
})
export class PersonAvatarDirective implements OnChanges, OnInit {
  static readonly DEFAULT_AVATAR_HREF = `/assets/images/avatar-student.png`;

  @Input('basePersonAvatarFor')
  readonly person: Person;

  @HostBinding('attr.src')
  get src() {
    return this.person.avatarHref || PersonAvatarDirective.DEFAULT_AVATAR_HREF;
  }

  @Input()
  readonly size: 'small' | 'medium' | 'large';

  constructor(
    readonly renderer: Renderer2,
    readonly element: ElementRef
  ) {
  }

  ngOnInit() {
    this.renderer.addClass(this.element.nativeElement, 'base-person-avatar-img');
  }

  ngOnChanges(changes: SimpleChanges) {
    this.applySizeClasses();
  }

  protected applySizeClasses() {
    const el= this.element.nativeElement as HTMLImageElement;
    for (const size of ['small', 'med', 'large']) {
      this.renderer.removeClass(el, 'base-person-avatar-' + size);
    }
    this.renderer.addClass(el, 'base-person-avatar-' + this.size);
  }
}
