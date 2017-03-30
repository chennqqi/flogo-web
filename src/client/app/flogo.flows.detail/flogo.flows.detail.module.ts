import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CommonModule as FlogoCommonModule } from '../../common/common.module';
import { FormBuilderModule as FlogoFormBuilderModule } from '../flogo.form-builder/flogo.form-builder.module';
import { InstallerModule as FlogoInstallerModule } from '../flogo.installer/flogo.installer.module';
import { TransformModule as FlogoTransformModule } from '../flogo.transform/flogo.transform.module';
import { InstructionsModule as FlogoInstructionsModule } from '../flogo.instructions/flogo.instructions.module';
import { LogsModule as FlogoLogsModule } from '../flogo.logs/flogo.logs.module';
import { FooterModule as FlogoFooterModule } from '../flogo.footer/flogo.footer.module';

import { FlogoCanvasComponent } from './components/canvas.component';

import { FlogoFlowsDetail } from './components/flow-detail.component';
import { FlogoFlowsDetailTriggers } from '../flogo.flows.detail.triggers/components/triggers.component';
import { FlogoFlowsDetailTriggersDetail } from '../flogo.flows.detail.triggers.detail/components/detail.component';
import { FlogoFlowsDetailTasks } from '../flogo.flows.detail.tasks/components/tasks.component';
import { FlogoFlowsDetailTasksDetail } from '../flogo.flows.detail.tasks.detail/components/detail.component';
import { FlogoSelectTriggerComponent } from '../flogo.select-trigger/components/select-trigger.component';

import { FlogoFlowsDetailDiagramComponent } from '../flogo.flows.detail.diagram/components/diagram.component';
import { FlogoFlowsDetailErrorPanel } from '../flogo.flows.detail.error-panel/components/error-panel.component';


import { FlogoFlowsDetailTasksInstallComponent } from '../flogo.flows.detail.tasks.install/components/install.component';
import { FlogoFlowsDetailTriggersInstallComponent } from '../flogo.flows.detail.triggers.install/components/install.component';

import { RunnerService } from './services/runner.service';
import { routing } from './flogo.flows.detail.routing';
import {UIModelConverterService} from "./services/ui-model-converter.service";
import {APIFlowsService} from "../../common/services/restapi/v2/flows-api.service";
import {FlogoFlowService} from "./services/flow.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FlogoCommonModule,
    FlogoFormBuilderModule,
    FlogoInstallerModule,
    FlogoTransformModule,
    FlogoInstructionsModule,
    FlogoFooterModule,
    FlogoLogsModule,
    routing
  ],
  declarations: [
    FlogoFlowsDetail,
    FlogoFlowsDetailTriggers,
    FlogoFlowsDetailTriggersDetail,
    FlogoFlowsDetailTasks,
    FlogoFlowsDetailTasksDetail,
    FlogoSelectTriggerComponent,

    FlogoFlowsDetailDiagramComponent,
    FlogoFlowsDetailErrorPanel,

    FlogoFlowsDetailTasksInstallComponent,
    FlogoFlowsDetailTriggersInstallComponent,

    FlogoCanvasComponent

  ],
  providers: [
    RunnerService,
    UIModelConverterService,
    APIFlowsService,
    FlogoFlowService
  ],
  bootstrap: [
    FlogoCanvasComponent
  ]
})
export class FlogoFlowsDetailModule {}
