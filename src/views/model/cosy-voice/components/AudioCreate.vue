<script setup lang="ts">

import {computed, nextTick, onMounted, ref} from "vue";
import {AmModelFile, getByModelType as queryModelFiles} from "@/api/am-model-file.ts";
import {PromptAudio, queryPromptAudios} from "@/api/prompt-audio.ts";
import {CascaderOption} from "naive-ui";
import useLoading from "@/hooks/loading.ts";
import {AmModelConfig, createAudio, createConfig, getByModelType as queryModelConfigs} from "@/api/am-model-config.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {COSY_VOICE} from "@/types/model-types.ts";

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

const form = ref({
  id: -1,
  mfId: '',
  paCascaderPath: [],
  paId: '',

  mcId: '',
  mcName: '',
  amType: '',
  configParam: {
    mode: 'preset',
    role: '中文女',
    seed: 0,
    instruct: '',
  },

  text: '我们走的每一步，都是我们策略的一部分；你看到的所有一切，包括我此刻与你交谈，所做的一切，所说的每一句话，都有深远的含义。',
  saveAudio: false,
})

const promptAudios = ref<PromptAudio[]>([])
const modelFileOptions = ref<CascaderOption[]>([]);
const promptAudioDataOptions = ref<CascaderOption[]>([]);
const configCreateVisible = ref(false);
const modelConfigs = ref<AmModelConfig[]>([])

const getRandomInt = () => {
  const min = 1;
  const max = 100000000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const handleQueryModelFiles = async () => {
  const {data} = await queryModelFiles({modelType: COSY_VOICE})
  modelFileOptions.value = data.reduce((acc: any, item) => {
    const {mfGroup} = item;
    let groupItem = acc.find((g: { group: string, list: [] }) => g.group === mfGroup);
    if (!groupItem) {
      groupItem = {group: mfGroup, list: []} as any;
      acc.push(groupItem);
    }
    groupItem.list.push(item);
    return acc;
  }, [])
      .map((item: any) => {
        return {
          label: item.group,
          value: item.group,
          children: item.list.map((item1: AmModelFile) => {
            return {
              label: item1.mfRole,
              value: item1.mfId
            };
          }),
        };
      })
}


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
  const {data} = await queryModelConfigs({modelType: COSY_VOICE})
  modelConfigs.value = data;
}

const computedRefAudioSelectOptions = computed(() => {
  if (!form.value.paCascaderPath) {
    return [];
  }
  return promptAudios.value
      .find(item => item.paGroup === form.value.paCascaderPath[0]
          && item.paRole === form.value.paCascaderPath[1])
      ?.paMoods
      .find(item => item.paMood === form.value.paCascaderPath[2])
      ?.paAudios
      .map(item => {
        return {
          label: item.paAudioText,
          value: item.paId,
        }
      }) ?? []
})

const refAudioCascaderChange = () => {
  nextTick(() => {
    form.value.paId = computedRefAudioSelectOptions
        .value[0]
        .value
  })
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
      amType: COSY_VOICE,
      mfId: form.value.mfId,
      paId: form.value.paId,
      mcParamsJson: JSON.stringify(form.value.configParam),
      text: form.value.text,
    });

    blob.value = response.data;
    const url = URL.createObjectURL(response.data);

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
    formData.append('amType', COSY_VOICE);

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
  await handleQueryModelFiles();
  await handleQueryPromptAudios();
  await handleQueryModelConfigs();
  if (props.configEditId) {
    const find = modelConfigs.value.find((item) => item.id === props.configEditId);

    if (find) {
      let paCascaderPath: any = []
      promptAudios.value.forEach((item) => {
        item.paMoods.forEach((item1) => {
          item1.paAudios.forEach((item2) => {
            if (item2.paId === find.paId) {
              paCascaderPath = [item.paGroup, item.paRole, item1.paMood]
            }
          })
        })
      });
      form.value = {
        ...find,
        paCascaderPath: paCascaderPath,
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
          <a-form ref="createFormRef" :model="form" layout="vertical">
            <a-space size="medium" direction="vertical" style="width: 100%">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="推理模式" field="configParam.mode">
                  <a-radio-group v-model="form.configParam.mode" class="custom-radio-group">
                    <a-radio
                        v-for="(item, index) in [
                            {label: '预置语音生成', value: 'preset', desc: '预训练音色'},
                            {label: '定制语音生成', value: 'custom', desc: '复刻录制声音'},
                            {label: '高级语音生成', value: 'advanced', desc: '自然语言控制'},
                        ]"
                        :key="index"
                        :value="item.value"
                    >
                      <template #radio="{ checked }">
                        <a-space
                            align="start"
                            class="custom-radio-card"
                            :class="{ 'custom-radio-card-checked': checked }"
                        >
                          <div class="custom-radio-card-mask">
                            <div class="custom-radio-card-mask-dot"/>
                          </div>
                          <div>
                            <div class="custom-radio-card-title">
                              {{ item.label }}
                            </div>
                            <a-typography-text type="secondary">
                              {{ item.desc }}
                            </a-typography-text>
                          </div>
                        </a-space>
                      </template>
                    </a-radio>
                  </a-radio-group>
                </a-form-item>
              </a-card>
              <a-row :gutter="20">
                <a-col :span="12" v-if="['preset', 'advanced'].includes(form.configParam.mode)">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="预训练音色" field="configParam.role">
                      <a-select v-model="form.configParam.role">
                        <a-option>中文女</a-option>
                        <a-option>中文男</a-option>
                        <a-option>英文女</a-option>
                        <a-option>英文男</a-option>
                        <a-option>日语男</a-option>
                        <a-option>粤语女</a-option>
                        <a-option>韩语女</a-option>
                      </a-select>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="12">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="Seed" field="configParam.seed">
                      <n-input-number v-model:value="form.configParam.seed"/>
                      <n-button
                          type="primary"
                          ghost
                          style="margin-left: 10px"
                          @click="() => form.configParam.seed = getRandomInt()"
                      >
                        随机
                      </n-button>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="12" v-if="['custom'].includes(form.configParam.mode)">
                  <a-card :body-style="{padding: '20px'}">
                    <a-form-item
                        label="参考音频"
                        field="paCascaderPath"
                        :rules="[{required: true, message: '请选择一个参考音频'}]"
                    >
                      <a-cascader
                          v-model="form.paCascaderPath"
                          path-mode
                          :options="promptAudioDataOptions"
                          @change="refAudioCascaderChange"
                      />
                    </a-form-item>
                    <a-select
                        v-model="form.paId"
                        :options="computedRefAudioSelectOptions"
                    >
                      <template #label="{data}">
                        <a-typography-text ellipsis>
                          {{ data.label }}
                        </a-typography-text>
                      </template>
                    </a-select>
                  </a-card>
                </a-col>
              </a-row>
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item
                    label="输入文本" field="text"
                    :rules="[{required: true, message: '输入文本是必填项'}]"
                >
                  <n-input v-model:value="form.text" type="textarea"/>
                </a-form-item>
              </a-card>
              <a-card
                  v-if="['advanced'].includes(form.configParam.mode)"
                  :body-style="{padding: '20px 20px 0'}"
              >
                <a-form-item
                    label="instruct文本" field="configParam.instruct"
                    :rules="[{required: true, message: 'instruct文本是必填项'}]"
                >
                  <n-input v-model:value="form.configParam.instruct" type="textarea"/>
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
                <a-form-item
                    label="输出音频"
                    :loading="loading"
                >
                  <audio ref="audioElement" controls style="width: 100%"></audio>
                </a-form-item>
              </a-card>
              <a-button
                  v-if="['advanced'].includes(form.configParam.mode)"
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
                <a-descriptions-item label="mode">
                  {{ JSON.parse(item.mcParamsJson).mode }}
                </a-descriptions-item>
                <a-descriptions-item label="role">
                  {{ JSON.parse(item.mcParamsJson).role }}
                </a-descriptions-item>
                <a-descriptions-item label="seed">
                  {{ JSON.parse(item.mcParamsJson).seed }}
                </a-descriptions-item>
                <a-descriptions-item label="instruct">
                  {{ JSON.parse(item.mcParamsJson).instruct }}
                </a-descriptions-item>
              </a-descriptions>
              <div style="text-align: right">
                <a-button
                    type="outline" size="mini"
                    @click="copyConfig(item)"
                >
                  复制
                </a-button>
              </div>
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

.custom-radio-card {
  padding: 10px 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  width: 250px;
  box-sizing: border-box;
}

.custom-radio-card-mask {
  height: 14px;
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  border: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.custom-radio-card-mask-dot {
  width: 8px;
  height: 8px;
  border-radius: 100%;
}

.custom-radio-card-title {
  color: var(--color-text-1);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.custom-radio-card:hover,
.custom-radio-card-checked,
.custom-radio-card:hover .custom-radio-card-mask,
.custom-radio-card-checked .custom-radio-card-mask {
  border-color: rgb(var(--primary-6));
}

.custom-radio-card-checked {
  background-color: var(--color-primary-light-1);
}

.custom-radio-card:hover .custom-radio-card-title,
.custom-radio-card-checked .custom-radio-card-title {
  color: rgb(var(--primary-6));
}

.custom-radio-card-checked .custom-radio-card-mask-dot {
  background-color: rgb(var(--primary-6));
}

.custom-radio-group :deep(.arco-radio) {
  padding: 0;
}
</style>
