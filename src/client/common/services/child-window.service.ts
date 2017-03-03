import { Injectable, Component, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { FromEventObservable } from 'rxjs/observable/FromEventObservable';

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/publishReplay';

import { WindowRef } from './window-ref';

@Injectable()
/**
 *
 * @example
 *  if (!this.windowService.isSupported()){
 *     console.log('Child window not supported');
 *     return;
 *   } else if (this.childWindow && this.childWindow.isOpen()) {
 *     return this.childWindow.focus();
 *   }
 * this.childWindow = this.childWindowService.open('/_config', 'config');
 * this.childWindow.closed
 *   .subscribe(event => {
 *      this.window = null;
 *  });
 */
export class ChildWindowService {

  private window: Window;

  constructor(windowRef: WindowRef, private ngZone: NgZone) {
    this.window = windowRef.nativeWindow;
  }

  isSupported() {
    const canOpenWindow = !!this.window && this.window.open;
    return !!canOpenWindow;
  }

  open(url: string, name?: string) {
    const nativeWindow = this.window.open(url, name || '');
    if (!nativeWindow) {
      return null;
    }
    return new ChildWindow(nativeWindow, this.ngZone);
  }


}

export class ChildWindow {

  private _closed: Observable<Event>;
  private _isClosed = false;

  constructor(private nativeWindow: Window, private ngZone: NgZone) {
    if (!nativeWindow) {
      throw new Error('Window is required');
    }

    // since the event comes from a different window we need to manually re-enter it into the ngZone
    this._closed = FromEventObservable.create<Event>(nativeWindow, 'beforeunload')
      .do(event => ngZone.run(() => this._isClosed = true))
      .first()
      .publishReplay().refCount();
  }

  isOpen() {
    return !this.isClosed();
  }

  isClosed() {
    return this._isClosed;
  }

  close() {
    this.nativeWindow.close();
  }

  focus() {
    this.nativeWindow.focus();
  }

  get closed(): Observable<Event> {
    return this._closed;
  }

}



/// TODO: delete after linking to log component
@Component({
  selector: 'child-window-test',
  template: `
  <button [disabled]="isOpen" (click)="open()">
    {{ isOpen ? 'Already opened' : 'Open' }}
  </button>
`
})
export class ChildWindowTestComponent {

  private childWindow: ChildWindow = null;

  constructor(private windowService: ChildWindowService ) {
  }

  get isOpen() {
    return this.childWindow && this.childWindow.isOpen();
  }

  open() {
    if (!this.windowService.isSupported()){
      console.log('Child window not supported');
      return;
    } else if (this.childWindow && this.childWindow.isOpen()) {
      return this.childWindow.focus();
    }

    this.childWindow = this.windowService.open('/_config', 'config');
    this.childWindow.closed
      .subscribe(e => {
        this.childWindow = null;
      });
  }

}