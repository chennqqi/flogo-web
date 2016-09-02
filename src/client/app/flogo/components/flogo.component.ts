import {Component} from '@angular/core';
import {ROUTER_DIRECTIVES, RouteConfig} from '@angular/router-deprecated';
import {FlogoNavbarComponent} from './navbar.component';
import {FlogoFlowsComponet} from '../../flogo.flows/components/flows.component';
import {FlogoCanvasComponent} from '../../flogo.flows.detail/components/canvas.component';
import {FlogoFormBuilderComponent} from "../../flogo.form-builder/components/form-builder.component";
import {PostService} from '../../../common/services/post.service';
import { FlogoDBService } from '../../../common/services/db.service';
import { RESTAPIService } from '../../../common/services/rest-api.service';
import { HTTP_PROVIDERS } from '@angular/http';
import { RESTAPITest } from '../../../common/services/rest-api-test.spec';
import { RESTAPIFlowsService } from '../../../common/services/restapi/flows-api.service';
import { RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';
import { RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import { FlogoConfigComponent } from '../../flogo.config/components/config.component';
import { RESTAPIConfigurationService } from '../../../common/services/restapi/configuration-api-service';
import { ConfigurationService } from '../../../common/services/configuration.service';
import { formatServerConfiguration, getFlogoGlobalConfig } from '../../../common/utils';
import { FlogoCanvasSetComponent } from '../../flogo.canvas-set/flogo.canvas-set.component';

@Component({
  selector: 'flogo-app',
  moduleId: module.id,
  templateUrl: 'flogo.tpl.html',
  styleUrls: [ 'flogo.component.css' ],
  directives: [ROUTER_DIRECTIVES, FlogoNavbarComponent],
  providers: [PostService,FlogoDBService, RESTAPIService, RESTAPIFlowsService, RESTAPIActivitiesService, RESTAPITriggersService, HTTP_PROVIDERS, RESTAPIConfigurationService, ConfigurationService]
})

@RouteConfig([
  {
    path: '/', name: "FlogoHome", component:FlogoFlowsComponet
  },
  {
    path: '/flows', name: "FlogoFlows", component:FlogoFlowsComponet, useAsDefault: true
  },
  {
    path:'/flows/:id/...', name:"FlogoFlowDetail", component: FlogoCanvasComponent
  },
  {
    path:'/flows/new/:id', name:"FlogoCanvasSet", component: FlogoCanvasSetComponent
  },
  {
    path:'/task', name: 'FlogoTask', component: FlogoFormBuilderComponent
  },
  {
    path:'/rest-api-test', name: 'FlogoRESTAPITest', component: RESTAPITest
  },
  // TODO
  //  temp config page to change server URL settings
  {
    path: '/_config', name: "FlogoDevConfig", component:FlogoConfigComponent
  },
])

export class FlogoAppComponent{
  constructor(){ }
}
