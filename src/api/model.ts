export interface Model {
    id: number;
    name: string;
    group: string;
    gptWeights: string;
    sovitsWeights: string;
}

export interface ModelConfig {
    serverUrl: string;
}

export interface CommonModelConfig extends ModelConfig{
    models: Model[];
}

