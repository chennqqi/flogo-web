// begin change
import { ComponentFixture, TestBed, tick, fakeAsync, inject } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule as FlogoSharedModule } from '@flogo/shared';
import { CoreModule as FlogoCoreModule } from '@flogo/core';
import { FormBuilderModule as FlogoFormBuilderModule } from '../form-builder';
import { PostService } from '@flogo/core/services/post.service';
import { FakeRootLanguageModule } from '@flogo/core/language/testing';

class MockRouter { public navigate() {}; }

@Component({
  template: `
    <flogo-flow-form-builder [task]="task" [step]="step" [context]="context" [flowId]="flowId"></flogo-flow-form-builder>
  `
})
class TaskTestHostComponent {
  task: any;
  step: any;
  context: any;
  flowId: string;

  constructor() {
    this.task = getMockTask();
    this.context = getMockContext();

    this.flowId = 'root';
    this.step = undefined;

    function getMockTask() {
      return {
        activityType: 'tibco-log',
        attributes: {
          inputs: [
            {name: 'message', type: 'string', value: 'Received request.'},
            {name: 'flowInfo', type: 'boolean', value: 'true'},
            {name: 'addToFlow', type: 'boolean', value: 'true'}
          ],
          outputs: [
            {name: 'message', type: 'string'}
          ]
        },
        description: 'Simple Log Activity',
        homepage: '',
        id: 'Mg',
        installed: true,
        name: 'Received',
        title: 'Log Message',
        type: 1,
        version: '0.0.1'
      };
    }

    function getMockContext() {
      return {isTrigger: false, isBranch: false, isTask: true, hasProcess: false, isDiagramEdited: false};
    }

  }
}


@Component({
  template: `
    <flogo-flow-form-builder [task]="task" [step]="step" [context]="context" [flowId]="flowId"></flogo-flow-form-builder>
  `
})
class TriggerTestHostComponent {
  task: any;
  step: any;
  context: any;
  flowId: string;

  constructor() {
    this.task = getMockTask();
    this.context = getMockContext();
    this.flowId = 'root';
    this.step = undefined;

    function getMockContext() {
      return {isTrigger: true, isBranch: false, isTask: false, hasProcess: false, isDiagramEdited: false};
    }

    function getMockTask() {
      return {
        author: 'Anonymous', description: 'Simple REST Trigger',
        endpoint: {
          settings: [
            { allowed: [],  name: 'method', required: true, type: 'string', value: 'GET' },
            {name: 'path', required: true, type: 'string', value: '/awsiot/status/:q'},
            {name: 'autoIdReply', type: 'boolean', value: 'true'},
            {name: 'useReplyHandler', type: 'boolean', value: 'true'}]},
        homepage: '', id: '', installed: true, name: 'Receiver',
        outputs: [
          {name: 'pathParams', type: 'params', value: {q: 100}},
          {name: 'queryParams', type: 'params', value: {status: 1}},
          {name: 'content', type: 'object', value: '400'}],
        settings: [{name: 'port', required: true, type: 'integer', value: '9999'}],
        title: 'REST Trigger', triggerType: 'tibco-rest', type: 0, version: '0.0.1', where: ''
      };
    }
  }
}


function beforeSetup(done)  {
  return TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: MockRouter }
        ]),
        FakeRootLanguageModule,
        FlogoCoreModule,
        FlogoSharedModule,
        FlogoFormBuilderModule
      ],
      declarations: [
        TaskTestHostComponent,
        TriggerTestHostComponent
      ],
      providers: [
        {provide: PostService, useClass: PostService },
        {provide: DomSanitizer, useClass: DomSanitizer}
      ],
    })
    .compileComponents()
    .then(() => done());
}

describe('Form-builder component', () => {
  let comp: TriggerTestHostComponent;
  let fixture: ComponentFixture<TriggerTestHostComponent>;

  beforeEach(done => beforeSetup(done) );

  beforeEach(() => {
    fixture = TestBed.createComponent(TriggerTestHostComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Should render a  trigger schema properly',
    inject(
      [DomSanitizer],
      fakeAsync((domSanitizer: DomSanitizer) => {
    fixture.detectChanges();

    const pathParams = fixture.nativeElement.querySelector('.output textarea[id="pathParams"]');
    expect(pathParams).not.toBeNull();

    const queryParams = fixture.nativeElement.querySelector('.output textarea[id="queryParams"]');
    expect(queryParams).not.toBeNull();

    const content = fixture.nativeElement.querySelector('.output textarea[id="content"]');
    expect(content).not.toBeNull();

    const port = fixture.nativeElement.querySelector('.settings input[id="port"]');
    expect(port).not.toBeNull();

    const method = fixture.nativeElement.querySelector('.endpoint ul[id="method"]');
    expect(method).not.toBeNull();

    const path = fixture.nativeElement.querySelector('.endpoint input[id="path"]');
    expect(path).not.toBeNull();

    const radios = fixture.nativeElement.querySelectorAll('.endpoint input[type="radio"]');
    expect(radios.length).toEqual(4);

    tick();
  })));

  it('In trigger mock outputs should be editable', fakeAsync(() => {
    fixture.detectChanges();
    const pathParams = fixture.nativeElement.querySelector('.output textarea[id="pathParams"]');
    expect(pathParams.readOnly).toEqual(false);

    const queryParams = fixture.nativeElement.querySelector('.output textarea[id="queryParams"]');
    expect(queryParams.readOnly).toEqual(false);

    const content = fixture.nativeElement.querySelector('.output textarea[id="content"]');
    expect(content.readOnly).toEqual(false);

    tick();
  }));


});

describe('Form-builder component', () => {
  let comp: TaskTestHostComponent;
  let fixture: ComponentFixture<TaskTestHostComponent>;

  beforeEach(done => beforeSetup(done) );

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskTestHostComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Should render a task schema properly', fakeAsync(() => {
    fixture.detectChanges();
    const inputMessage = fixture.nativeElement.querySelector('.input input[id="message"]');
    expect(inputMessage).not.toBeNull();

    const radios = fixture.nativeElement.querySelectorAll('.input input[type="radio"]');
    expect(radios.length).toEqual(4);

    const outputMessage = fixture.nativeElement.querySelector('.output textarea[id="message"]');
    expect(outputMessage).not.toBeNull();

    tick();
  }));

  it('In tasks Outputs should be readonly', fakeAsync(() => {
    fixture.detectChanges();
    const outputMessage = fixture.nativeElement.querySelector('.output textarea[id="message"]');
    expect(outputMessage.readOnly).toBe(true);
    tick();
  }));

});


