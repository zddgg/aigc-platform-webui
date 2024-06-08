import {ModelConfig} from "@/api/model.ts";

export const voiceNameFormat = (shortName: string) => {
    if (!shortName) {
        return undefined
    }
    return shortName.substring(shortName.lastIndexOf('-') + 1).replace('Neural', '')
}

export const modelNameFormat = (modelConfig: ModelConfig | undefined) => {
    return modelConfig?.model?.join('/')
}

export const audioNameFormat = (modelConfig: ModelConfig | undefined) => {
    if (modelConfig?.modelType === 'edge-tts') {
        return undefined;
    }
    return modelConfig?.audio?.filter((_: any, index: any) => index < 3).join('/')
}

export const refAudioNameFormat = (modelConfig: ModelConfig | undefined) => {
    if (modelConfig?.modelType === 'edge-tts') {
        return undefined;
    }
    return modelConfig?.audio?.filter((_: any, index: any) => index === 3).join('/')
}