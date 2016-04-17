import {FLOGO_TASK_ATTRIBUTE_TYPE} from '../../../../common/constants';
import {Component} from 'angular2/core';

@Component({
  inputs:['_info:info','_fieldObserver:fieldObserver']
})
export class FlogoFormBuilderFieldsBase{
  _info:any;
  _hasError:boolean = false;
  _errorMessage:string;
  _fieldObserver: any;

  constructor() {
    this._hasError = false;
  }

  onChangeField(event) {
    this._info.value =event.target.value;
    this._fieldObserver.next(this._getMessage('change-field', this._info));
  }

  _getMessage(message:string, properties:any) {
    return _.assign({}, {message: message}, {payload:properties});
  }


  onValidate(event) {
    var value = event.target.value || '';

    if(this._info.required) {
      if(!value.trim()) {
        this._errorMessage = this._info.title + ' is required';
        this._hasError = true;
        this._fieldObserver.next(this._getMessage('validation', {status:'error',field: this._info.name}) );
        return;
      }else
      this._hasError = false;
      this._fieldObserver.next(this._getMessage('validation', {status:'ok',field: this._info.name}) );
    }

    if(this._info.validation) {
        if(!this._validate(value)) {
          this._hasError = true;
          this._errorMessage = this._info.validationMessage;
          this._fieldObserver.next(this._getMessage('validation', {status:'error',field: this._info.name}));
        }else {
          this._hasError = false;
          this._fieldObserver.next(this._getMessage('validation', {status:'ok',field: this._info.name}));

        }
    }
  }

  _validate(value:string) {
    var re = new RegExp(this._info.validation);
    return re.test(value);
  }


}