export interface StreamData {
  stages: InternalStage[];
}

export interface InternalStage {
  id: string;
  ref: string;
  name: string;
  description: string;
  inputMappings: { [inputName: string]: any };
  output: { [outputName: string]: any };
  activitySettings?: { [settingName: string]: any };
  return?: boolean;
}
