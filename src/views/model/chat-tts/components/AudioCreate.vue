<script setup lang="ts">

import {onMounted, ref} from "vue";
import {PromptAudio, queryPromptAudios} from "@/api/prompt-audio.ts";
import {CascaderOption} from "naive-ui";
import useLoading from "@/hooks/loading.ts";
import {AmModelConfig, createConfig, getByModelType as queryModelConfigs, createAudio} from "@/api/am-model-config.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {CHAT_TTS} from "@/types/model-types.ts";

const {loading, setLoading} = useLoading();
const createFormRef = ref<FormInstance>()
const formRef = ref<FormInstance>()
const blob = ref<Blob | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null);

const props = defineProps({
  configEditId: {
    type: Number
  }
})

const defaultTextPrompt = '[oral_2][laugh_0][break_6]'

const form = ref({
  id: -1,
  mfId: '',
  paCascaderPath: [],
  paId: '',

  mcId: '',
  mcName: '',
  amType: '',

  configParam: {
    "stream": false,
    "skip_refine_text": true,
    "refine_text_only": false,
    "use_decoder": true,
    "audio_seed": 2,
    "text_seed": 42,
    "do_text_normalization": true,
    "do_homophone_replacement": false,
    "params_refine_text": {
      "prompt": defaultTextPrompt,
      "top_P": 0.7,
      "top_K": 20,
      "temperature": 0.7,
      "repetition_penalty": 1,
      "max_new_token": 384,
      "min_new_token": 0,
      "show_tqdm": true,
      "ensure_non_empty": true,
      "stream_batch": 24,
    },
    "params_infer_code": {
      "prompt": "[speed_5]",
      "top_P": 0.1,
      "top_K": 20,
      "temperature": 0.3,
      "repetition_penalty": 1.05,
      "max_new_token": 2048,
      "min_new_token": 0,
      "show_tqdm": true,
      "ensure_non_empty": true,
      "stream_batch": true,
      "spk_emb": null,
    }
  },

  mcInstructText: '',

  outputText: '',
  text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
  saveAudio: false,
})

const getRandomInt = () => {
  const min = 1;
  const max = 100000000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const promptAudios = ref<PromptAudio[]>([])
const promptAudioDataOptions = ref<CascaderOption[]>([]);
const configCreateVisible = ref(false);
const modelConfigs = ref<AmModelConfig[]>([])

const handleQueryPromptAudios = async () => {
  const {data} = await queryPromptAudios();
  promptAudios.value = data;
  promptAudioDataOptions.value = data.reduce((acc: any, item) => {
    const {paGroup} = item;
    let groupItem = acc.find((g: { group: string, list: [] }) => g.group === paGroup);
    if (!groupItem) {
      groupItem = {group: paGroup, list: []} as any;
      acc.push(groupItem);
    }
    groupItem.list.push(item);
    return acc;
  }, [])
      .map((item: any) => {
        return {
          label: item.group,
          value: item.group,
          children: item.list.map((item1: any) => {
            return {
              label: item1.paRole,
              value: item1.paRole,
              children: item1.paMoods.map((item2: any) => {
                return {
                  label: item2.paMood,
                  value: item2.paMood,
                };
              }),
            };
          }),
        };
      });

}

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: CHAT_TTS})
  modelConfigs.value = data;
}

const copyConfig = (config: AmModelConfig) => {
  createFormRef.value?.resetFields();
  form.value = {
    ...form.value,
    configParam: {
      ...JSON.parse(config.mcParamsJson)
    },
  };
}

const base64DecodeUnicode = (str: string) => {
  // 解码 Base64
  const bytes = atob(str);
  // 将解码后的字节序列转换为 Uint8Array
  const len = bytes.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }
  // 将 Uint8Array 转换为字符串
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}

const generateAudio = async () => {
  const res = await createFormRef.value?.validate();
  if (res) {
    return;
  }
  if (!form.value.text) {
    return;
  }
  try {
    if (audioElement.value) {
      audioElement.value.src = '';
    }
    setLoading(true);

    const response = await createAudio({
      amType: CHAT_TTS,
      mfId: form.value.mfId,
      paId: form.value.paId,
      mcParamsJson: JSON.stringify(form.value.configParam),
      text: form.value.text,
    });

    blob.value = response.data;
    const url = URL.createObjectURL(response.data);

    const encodedTextData = (response as any).headers['x-text-data'];
    if (encodedTextData) {
      form.value.outputText = base64DecodeUnicode(encodedTextData);
    }
    if (audioElement.value) {
      audioElement.value.src = url;
    }

  } finally {
    setLoading(false);
  }
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const formData = new FormData();
    if (form.value.id && form.value.id > 0) {
      formData.append('id', String(form.value.id));
    }
    formData.append('amType', CHAT_TTS);

    formData.append('mcName', form.value.mcName);
    formData.append('mcParamsJson', JSON.stringify(form.value.configParam));

    formData.append('text', String(form.value.text));
    formData.append('saveAudio', String(form.value.saveAudio || false));
    formData.append('file', blob?.value as Blob);

    const {msg} = await createConfig(formData);
    Message.success(msg);
    await handleQueryModelConfigs();
    done(true);
  } else {
    done(false);
  }
}

onMounted(async () => {
  await handleQueryPromptAudios();
  await handleQueryModelConfigs();
  if (props.configEditId) {
    const find = modelConfigs.value.find((item) => item.id === props.configEditId);

    if (find) {

      form.value = {
        ...find,
        configParam: {
          ...JSON.parse(find.mcParamsJson),
        },
        text: form.value.text,
      } as any
    }
  }
})

</script>

<template>
  <div style="display: flex;">
    <div style="width: 75%;">
      <n-scrollbar style="height: calc(100vh - 100px)">
        <div style="padding-right: 10px">
          <a-form :model="form" layout="vertical">
            <a-space size="medium" direction="vertical" style="width: 100%">
              <a-row :gutter="20">
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="Refine text">
                      <n-checkbox
                          v-model:checked="form.configParam.skip_refine_text"
                          :checked-value="false"
                          :unchecked-value="true"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>temperature</span>
                          <n-input-number
                              v-model:value="form.configParam.params_infer_code.temperature"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.configParam.params_infer_code.temperature"
                          :min="0.00001"
                          :max="1"
                          :step="0.00001"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>top_P</span>
                          <n-input-number
                              v-model:value="form.configParam.params_infer_code.top_P"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.configParam.params_infer_code.top_P"
                          :min="0.1"
                          :max="0.9"
                          :step="0.05"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>top_K</span>
                          <n-input-number
                              v-model:value="form.configParam.params_infer_code.top_K"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.configParam.params_infer_code.top_K"
                          :min="1"
                          :max="20"
                          :step="1"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
              <a-row :gutter="20">
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="Audio Seed">
                      <n-input-number v-model:value="form.configParam.audio_seed"/>
                      <n-button
                          type="primary"
                          ghost
                          style="margin-left: 10px"
                          @click="() => form.configParam.audio_seed = getRandomInt()"
                      >
                        随机
                      </n-button>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="Text Seed">
                      <n-input-number v-model:value="form.configParam.text_seed"/>
                      <n-button
                          type="primary"
                          ghost
                          style="margin-left: 10px"
                          @click="() => form.configParam.text_seed = getRandomInt()"
                      >
                        随机
                      </n-button>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="12">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="params_refine_text">
                      <n-input v-model:value="form.configParam.params_refine_text.prompt"/>
                      <n-button
                          type="primary"
                          ghost
                          style="margin-left: 10px"
                          @click="() => form.configParam.params_refine_text.prompt = defaultTextPrompt">
                        加载默认
                      </n-button>
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="输入文本" required>
                  <n-input v-model:value="form.text" type="textarea"/>
                </a-form-item>
              </a-card>
              <n-button
                  round
                  type="info"
                  style="width: 100%"
                  :loading="loading"
                  @click="generateAudio"
              >
                生成
              </n-button>
              <a-card
                  :body-style="{padding: '20px 20px 0'}"
              >
                <a-form-item label="输出文本">
                  <n-input
                      v-model:value="form.outputText"
                      type="textarea"
                      placeholder="output"
                      readonly
                  />
                </a-form-item>
              </a-card>
              <a-card
                  :body-style="{padding: '20px 20px 0'}"
              >
                <a-form-item
                    label="输出音频"
                    :loading="loading"
                >
                  <audio ref="audioElement" controls style="width: 100%"></audio>
                </a-form-item>
              </a-card>
              <a-button
                  shape="round"
                  type="outline"
                  style="width: 100%"
                  @click="() => (configCreateVisible = true)"
              >
                保存配置
              </a-button>
            </a-space>
          </a-form>
        </div>
      </n-scrollbar>
    </div>
    <div style="width: 25%; margin-left: 10px">
      <n-scrollbar style="height: calc(100vh - 100px)">
        <div>
          <a-space size="medium" direction="vertical" style="width: 100%">
            <a-card
                v-for="(item, index) in modelConfigs"
                :key="index"
            >
              <a-descriptions
                  :title="item.mcName"
                  :column="2"
                  size="small"

                  layout="inline-vertical"
              >
                <a-descriptions-item label="audio_seed">
                  {{ JSON.parse(item.mcParamsJson).audio_seed }}
                </a-descriptions-item>
                <a-descriptions-item label="text_seed">
                  {{ JSON.parse(item.mcParamsJson).text_seed }}
                </a-descriptions-item>
                <a-descriptions-item label="top_P">
                  {{ JSON.parse(item.mcParamsJson).params_infer_code?.top_P }}
                </a-descriptions-item>
                <a-descriptions-item label="top_K">
                  {{ JSON.parse(item.mcParamsJson).params_infer_code?.top_K }}
                </a-descriptions-item>
                <a-descriptions-item label="temperature">
                  {{ JSON.parse(item.mcParamsJson).params_infer_code?.temperature }}
                </a-descriptions-item>
                <a-descriptions-item label="refine_flag">
                  {{ !JSON.parse(item.mcParamsJson).skip_refine_text }}
                </a-descriptions-item>
                <a-descriptions-item label="refine_params">
                  <div style="display: flex; justify-content: space-between">
                    <div>
                      <span>
                        {{ JSON.parse(item.mcParamsJson).params_refine_text?.prompt }}
                      </span>
                    </div>
                    <div>
                      <a-button
                          type="outline" size="mini"
                          @click="copyConfig(item)"
                      >
                        复制
                      </a-button>
                    </div>
                  </div>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-space>
        </div>
      </n-scrollbar>
    </div>
    <a-modal
        v-model:visible="configCreateVisible"
        title="保存配置"
        @before-ok="handleBeforeOk"
    >
      <a-form
          ref="formRef"
          :model="form"
      >
        <a-form-item label="配置名称" field="mcName" required>
          <a-input v-model="form.mcName"/>
        </a-form-item>
        <a-form-item label="保存音频" field="saveAudio">
          <a-checkbox v-model="form.saveAudio">用于预览，不要太长。</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
:deep(.slider-wrapper .arco-form-item-label) {
  width: 100%;
}

:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>
