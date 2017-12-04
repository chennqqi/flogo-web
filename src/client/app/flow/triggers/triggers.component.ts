import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {TranslateService} from 'ng2-translate';

import 'rxjs/add/operator/filter';

import {FLOGO_PROFILE_TYPE} from '@flogo/core/constants';
import {notification, objectFromArray} from '@flogo/shared/utils';
import {RESTAPITriggersService} from '@flogo/core/services/restapi/v2/triggers-api.service';
import {RESTAPIHandlersService} from '@flogo/core/services/restapi/v2/handlers-api.service';

import {PostService} from '@flogo/core/services/post.service';
import { SingleEmissionSubject } from '@flogo/core/models/single-emission-subject';
import {UIModelConverterService} from '@flogo/flow/core/ui-model-converter.service';

import {
  SUB_EVENTS as FLOGO_SELECT_TRIGGER_PUB_EVENTS,
  PUB_EVENTS as FLOGO_SELECT_TRIGGER_SUB_EVENTS
} from '../../flogo.flows.detail.triggers.detail/messages';

import { FlowMetadata } from '@flogo/flow/task-mapper/models';
import { PUB_EVENTS as FLOGO_TASK_SUB_EVENTS, SUB_EVENTS as FLOGO_TASK_PUB_EVENTS} from '../shared/form-builder/messages';

import { FlogoTriggerClickHandlerService } from './shared/click-handler.service';
import { TriggerMapperService } from '@flogo/flow/triggers/trigger-mapper/trigger-mapper.service';
import {IPropsToUpdateFormBuilder} from '../flow.component';

export interface IFlogoTrigger {
  name: string;
  ref: string;
  description: string;
  settings: any;
  id: string;
  createdAt: string;
  updatedAt: string | null;
  handlers: any[];
  appId: string;
}

@Component({
  selector : 'flogo-flow-triggers',
  templateUrl : 'triggers.component.html',
  styleUrls : [ 'triggers.component.less' ]
})
export class FlogoFlowTriggersPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  triggers: IFlogoTrigger[];
  @Input()
  actionId: string;
  @Input()
  appDetails: {appId: string, appProfileType:  FLOGO_PROFILE_TYPE, metadata?: FlowMetadata};
  triggersList: any[] = [];
  allowMultipleTriggers = true;
  currentTrigger: any;
  selectedTriggerID: string;
  displayTriggerMenuPopover: boolean;
  showAddTrigger = false;
  installTriggerActivated = false;

  private _subscriptions: any[];
  private _ngDestroy$ = SingleEmissionSubject.create();
  private isMapperWindowOpen = false;

  constructor(private _restAPITriggersService: RESTAPITriggersService,
              private _restAPIHandlerService: RESTAPIHandlersService,
              private _converterService: UIModelConverterService,
              private _router: Router,
              private _translate: TranslateService,
              private _clickHandler: FlogoTriggerClickHandlerService,
              private _postService: PostService,
              private _triggerMapperService: TriggerMapperService) {
  }

  ngOnInit() {
    this.initSubscribe();
    this._router.events
      .filter(event => event instanceof NavigationEnd)
      .takeUntil(this._ngDestroy$)
      .subscribe((navigationEvent: NavigationEnd) => {
        // after upgrading to v4 using the router snapshot might be a better idea like this:
        // this._router.routerState.snapshot;
        if (!/\/trigger\/[\w_-]+$/.test(navigationEvent.url)) {
          this.currentTrigger = null;
          this.selectedTriggerID = null;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['triggers']) {
      this.makeTriggersListForAction();
      this.manageAddTriggerInView();
    }
  }

  ngOnDestroy() {
    this._subscriptions.forEach(
      ( sub: any ) => {
        this._postService.unsubscribe( sub );
      }
    );
    this._ngDestroy$.emitAndComplete();
  }

  isLambda(trigger) {
    return trigger && trigger.ref === 'github.com/TIBCOSoftware/flogo-contrib/trigger/lambda';
  }

  shouldShowTriggerSelected(triggerId) {
    /* Select a trigger either if (not restricted to one):
    *  1. it's trigger menu is active
    *  2. it's configuration is displayed in the trigger details (right hand side) panel
    *  */
    return this.selectedTriggerID === triggerId || (this.currentTrigger && this.currentTrigger.id === triggerId);
  }

  private isDeviceType() {
    return this.appDetails.appProfileType === FLOGO_PROFILE_TYPE.DEVICE;
  }

  private initSubscribe() {
    this._subscriptions = [];

    const subs = [
      _.assign({}, FLOGO_SELECT_TRIGGER_SUB_EVENTS.triggerAction , { callback: this._onActionTrigger.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.changeTileDetail, { callback: this._changeTileDetail.bind(this) }),
      _.assign({}, FLOGO_TASK_SUB_EVENTS.triggerDetailsChanged, { callback: this._taskDetailsChanged.bind(this) })
    ];

    _.each(
      subs, sub => {
        this._subscriptions.push(this._postService.subscribe(sub));
      }
    );

    this._triggerMapperService.save$
      .switchMap(({ trigger, mappings }) => this._restAPIHandlerService
        // Update the handler using the updateHandler REST API call
          .updateHandler(trigger.id, this.actionId, mappings)
          .then(handler => ({trigger, handler}))
      )
      .takeUntil(this._ngDestroy$)
      .subscribe(({ trigger, handler }) => {
        const updatedHandler = _.assign({}, _.omit(handler, ['appId', 'triggerId']));
        const triggerToUpdate = this.triggers.find(t => t.id === trigger.id);
        triggerToUpdate.handlers = trigger.handlers.map(h => h.actionId === this.actionId ? updatedHandler : h);
        this.makeTriggersListForAction();
      });

    this._triggerMapperService.status$
      .takeUntil(this._ngDestroy$)
      .subscribe(state => {
        this.isMapperWindowOpen = state.isOpen;
        this.resetSelectedTriggerId();
      });
  }

  private _taskDetailsChanged(data: any, envelope: any) {
    console.group('Save trigger details to flow');
    if (data.changedStructure === 'settings') {
      this._restAPITriggersService.updateTrigger(this.currentTrigger.id, {settings: data.settings}).then(() => {
        const existingTrigger = this.triggers.find(t => t.id === this.currentTrigger.id);
        existingTrigger.settings = data.settings;
        this.makeTriggersListForAction();
      });
    } else if (data.changedStructure === 'endpointSettings' || data.changedStructure === 'outputs') {
      this._restAPIHandlerService.updateHandler(this.currentTrigger.id, this.actionId, {
        settings: data.endpointSettings,
        outputs: data.outputs
      }).then(() => {
        const existingTrigger = this.triggers.find(t => t.id === this.currentTrigger.id);
        const existingHandler = existingTrigger.handlers.find(h => h.actionId === this.actionId);
        existingHandler.settings = data.endpointSettings;
        existingHandler.outputs = data.outputs;
        this.makeTriggersListForAction();
      });

    }

    if (_.isFunction(envelope.done)) {
      envelope.done();
    }
    console.groupEnd();
  }

  private _changeTileDetail(data: {
    content: string,
    proper: string,
    taskId: any,
    id: string,
    tileType: string
  }, envelope: any) {
    if (data.tileType === 'trigger') {
      let resultantPromise;
      if (data.proper === 'name') {
        resultantPromise = this._restAPITriggersService.updateTrigger(this.currentTrigger.id, {name: data.content});
      } else if (data.proper === 'description') {
        resultantPromise = this._restAPITriggersService.updateTrigger(this.currentTrigger.id, {description: data.content});
      }

      const existingTrigger = this.triggers.find(t => t.id === this.currentTrigger.id);
      resultantPromise.then(() => {
        existingTrigger[data.proper] = data.content;
        this.makeTriggersListForAction();
      }).catch(() => {
        if (data.proper === 'name') {
          const message = this._translate.instant('TRIGGERS-PANEL:TRIGGER-EXISTS');
          notification(message, 'error');
          const propsToUpdateFormBuilder: IPropsToUpdateFormBuilder = <IPropsToUpdateFormBuilder> {
            name: existingTrigger.name
          };
          this._postService.publish(
            _.assign(
              {}, FLOGO_TASK_PUB_EVENTS.updatePropertiesToFormBuilder, {
                data: propsToUpdateFormBuilder
              }
            )
          );
        }
      });

      if (_.isFunction(envelope.done)) {
        envelope.done();
      }
      console.groupEnd();
    }
  }

  private makeTriggersListForAction() {
    this.triggersList = [];
    this.triggers.forEach(t => {
      const handlers = t.handlers.filter(a => a.actionId === this.actionId);
      handlers.forEach(h => {
        this.triggersList.push(_.assign({}, t, {handler: h}));
      });
    });
  }

  private manageAddTriggerInView() {
    this.allowMultipleTriggers = !(this.isDeviceType() && this.triggersList.length > 0);
  }

  openInstallTriggerWindow() {
    this.installTriggerActivated = true;
    this.closeAddTriggerModel(false);
  }

  onTriggerInstalledAction() {
    this.installTriggerActivated = false;
    this.openAddTriggerModel();
  }

  openAddTriggerModel() {
    this.showAddTrigger = true;
  }

  closeAddTriggerModel($event) {
    this.showAddTrigger = $event;
  }

  addTriggerToAction(data) {
    const settings = objectFromArray(data.triggerData.endpoint.settings, false);
    const outputs = objectFromArray(data.triggerData.outputs, false);
    let resultantPromiseState;
    let triggerId;
    if (data.installType === 'installed') {
      const appId = this.appDetails.appId;
      const triggerInfo: any = _.pick(data.triggerData, ['name', 'ref', 'description']);
      triggerInfo.settings = objectFromArray(data.triggerData.settings || [], false);

      resultantPromiseState = this._restAPITriggersService.createTrigger(appId, triggerInfo)
        .then( (triggerResult) => {
          triggerId = triggerResult.id;
          return this._restAPIHandlerService.updateHandler(triggerId, this.actionId, {settings, outputs});
        });
    } else {
      triggerId = data.triggerData.id;
      resultantPromiseState = this._restAPIHandlerService.updateHandler(triggerId, this.actionId, {settings, outputs});
    }
    resultantPromiseState.then(() => this._restAPITriggersService.getTrigger(triggerId))
      .then(trigger => {
        let existingTrigger = this.triggers.find(t => t.id === trigger.id);
        if (existingTrigger) {
          existingTrigger = trigger;
        } else {
          this.triggers.push(trigger);
        }
        this.makeTriggersListForAction();
        this.manageAddTriggerInView();
    });
  }

  showTriggerMenu(event, trigger) {
    this.selectedTriggerID = trigger.id;
    if (!this.isDeviceType()) {
      const parentTriggerBlock: Element = event.path.find(e => _.find(e.classList, (cls) => cls === 'trigger_block'));
      if (parentTriggerBlock) {
        this._clickHandler.setCurrentTriggerBlock(parentTriggerBlock);
      }
      this.displayTriggerMenuPopover = true;
    } else {
      this.showTriggerDetails(trigger);
    }
  }

  /*resetTriggerSelectState(triggerId) {
    this.selectedTriggerID = '';
  }*/

  handleClickOutsideTriggerMenu(event) {
    if (this._clickHandler.isClickedOutside(event.path)) {
      this._clickHandler.resetCurrentTriggerBlock();
      this.hideTriggerMenuPopover();
      this.resetSelectedTriggerId();
    }
  }

  private hideTriggerMenuPopover() {
    this.displayTriggerMenuPopover = false;
  }

  private resetSelectedTriggerId() {
    /* Reset the selectecTriggerID as we need to unselect the trigger if the trigger is no longer active
    *  and the mapper window for the same trigger is now closed
    *  */
    if (!this.isMapperWindowOpen) {
      this.selectedTriggerID = null;
    }
  }

  showTriggerDetails(trigger) {
    this.hideTriggerMenuPopover();
    this.currentTrigger = _.cloneDeep(trigger);
    this._router.navigate(['/flows', this.actionId, 'trigger', trigger.id])
      .then(() => this._converterService.getTriggerTask(trigger))
      .then((triggerForUI) => {
        const dataToPublish = {
          'id': 'root',
          'task': triggerForUI,
          'context': {
            'isTrigger': true,
            'isBranch': false,
            'isTask': false,
            'hasProcess': false,
            'isDiagramEdited': false,
            'currentTrigger': trigger,
            'profileType': this.appDetails.appProfileType
          }
        };
        this._postService.publish(
          _.assign(
            {}, FLOGO_SELECT_TRIGGER_PUB_EVENTS.selectTrigger, {
              data: _.assign({}, dataToPublish)
            }
          )
        );
      });
  }

  openTriggerMapper(trigger: IFlogoTrigger & {handler: any}) {
    this.hideTriggerMenuPopover();
    const handler = trigger.handler;
    this._converterService.getTriggerTask(trigger)
      .then(triggerSchema => this._triggerMapperService.open(trigger, this.appDetails.metadata, handler, triggerSchema));
  }

  deleteHandlerForTrigger(triggerId) {
    this.hideTriggerMenuPopover();
    this._restAPIHandlerService.deleteHandler(this.actionId, triggerId)
      .then(() => this._router.navigate(['/flows', this.actionId]))
      .then(() => this._restAPITriggersService.getTrigger(triggerId))
      .then(trigger => {
        const hasHandlerForThisAction = !!trigger.handlers.find(h => h.actionId === this.actionId);
        if (hasHandlerForThisAction) {
          this.triggers = this.triggers.map(t => t.id === triggerId ? trigger : t);
        } else {
          this.triggers = this.triggers.filter(t => t.id !== triggerId);
        }
        this.makeTriggersListForAction();
      });
  }

  private _onActionTrigger(data: any, envelope: any) {
    if (data.action === 'trigger-copy') {
      this._restAPIHandlerService.deleteHandler(this.actionId, this.currentTrigger.id)
        .then(() => {
          const triggerSettings = _.pick(this.currentTrigger, [
            'name',
            'description',
            'ref',
            'settings'
          ]);
          return this._restAPITriggersService.createTrigger(this.appDetails.appId, triggerSettings);
        })
        .then((createdTrigger) => {
          const settings = this.getSettingsCurrentHandler();
          this.currentTrigger = createdTrigger;
          return this._restAPIHandlerService.updateHandler(createdTrigger.id, this.actionId, settings);
        })
        .then((updatedHandler) => {
          const message = this._translate.instant('CANVAS:COPIED-TRIGGER');
          notification(message, 'success', 3000);
          const updatedTriggerDetails = _.assign({}, this.currentTrigger);
          const currentHandler = _.assign({}, _.pick(updatedHandler, [
            'actionId',
            'createdAt',
            'outputs',
            'settings',
            'updatedAt'
          ]));
          updatedTriggerDetails.handlers.push(currentHandler);
          updatedTriggerDetails.handler = currentHandler;
          this.showTriggerDetails(updatedTriggerDetails);
        });
    }
  }

  private getSettingsCurrentHandler() {
    const settings = _.cloneDeep(this.currentTrigger.handler.settings);
    const outputs = _.cloneDeep(this.currentTrigger.handler.outputs);

    return {settings, outputs};
  }
}