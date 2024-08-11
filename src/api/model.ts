export interface Model {
  id: number;
  name: string;
  group: string;
  gptWeights: string;
  sovitsWeights: string;
}

export interface AudioModelInfoKey {
  amType: string;
  amPaId: string;
  amMfId: string;
  amMcId: string;
  amMcParamsJson: string;
}

export interface AudioModelInfo extends AudioModelInfoKey {

  amPaGroup: string;
  amPaRole: string;
  amPaMood: string;
  amPaAudio: string;
  amPaAudioText: string;
  amPaAudioLang: string;

  amMfGroup: string;
  amMfRole: string;
  amMfJson: string;

  amMcName: string;
  amMcParamsJson: string;
}

export interface AudioRoleInfo extends AudioModelInfo {
  role: string;
  gender: string;
  age: string;
}