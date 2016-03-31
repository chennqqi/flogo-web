import {Component} from 'angular2/core';
import {PostService} from '../../../common/services/post.service';
import {TRIGGERS as TRIGGERS_MOCK} from '../mocks/triggers';


@Component({
  selector: 'flogo-flows-detail-triggers',
  moduleId: module.id,
  templateUrl: 'triggers.tpl.html',
  styleUrls: ['triggers.component.css']
})
export class FlogoFlowsDetailTriggers{
  private triggers: any;
  subscriptions:any;
  constructor(private _postService: PostService){
    this.subscriptions = [];

    this.triggers = TRIGGERS_MOCK || [];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub:any) => {
      this._postService.unsubscribe(sub);
    });
  }


}