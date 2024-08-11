<script setup lang="ts">

import {computed, nextTick, onMounted, ref} from "vue";
import {AmModelFile, getByModelType as queryModelFiles} from "@/api/am-model-file.ts";
import {PromptAudio, queryPromptAudios} from "@/api/prompt-audio.ts";
import {CascaderOption} from "naive-ui";
import useLoading from "@/hooks/loading.ts";
import {AmModelConfig, createAudio, createConfig, getByModelType as queryModelConfigs} from "@/api/am-model-config.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {GPT_SOVITS} from "@/types/model-types.ts";

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
    top_k: 15,
    top_p: 1,
    temperature: 1,
  },

  mcInstructText: '',

  text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
  saveAudio: false,
})

const promptAudios = ref<PromptAudio[]>([])
const modelFileOptions = ref<CascaderOption[]>([]);
const promptAudioDataOptions = ref<CascaderOption[]>([]);
const configCreateVisible = ref(false);
const modelConfigs = ref<AmModelConfig[]>([])

const handleQueryModelFiles = async () => {
  const {data} = await queryModelFiles({modelType: GPT_SOVITS})
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
  const {data} = await queryModelConfigs({modelType: GPT_SOVITS})
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
      amType: GPT_SOVITS,
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

    formData.append('amType', GPT_SOVITS);
    formData.append('mfId', form.value.mfId);
    formData.append('paId', form.value.paId);

    formData.append('mcName', form.value.mcName);
    formData.append('mcParamsJson', JSON.stringify(form.value.configParam));

    formData.append('text', form.value.text);
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

const handleSaveConfig = async () => {
  const res = await createFormRef.value?.validate();
  if (!res) {
    configCreateVisible.value = true;
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
  <div style="display: flex">
    <div style="width: 75%;">
      <n-scrollbar style="height: calc(100vh - 110px)">
        <div style="padding-right: 10px">
          <a-form ref="createFormRef" :model="form" layout="vertical">
            <a-space size="medium" direction="vertical" style="width: 100%">
              <a-row :gutter="20">
                <a-col :span="12">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item
                        label="模型"
                        field="mfId"
                        :rules="[{required: true, message: '请选择一个模型'}]"
                    >
                      <a-cascader
                          v-model="form.mfId"
                          :options="modelFileOptions"/>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="12">
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
              <a-row :gutter="20">
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>top_k</span>
                          <n-input-number
                              v-model:value="form.configParam.top_k"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.configParam.top_k"
                          :min="1"
                          :max="100"
                          :step="1"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>top_p</span>
                          <n-input-number
                              v-model:value="form.configParam.top_p"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.configParam.top_p"
                          :min="0"
                          :max="1"
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
                          <span>temperature</span>
                          <n-input-number
                              v-model:value="form.configParam.temperature"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.configParam.temperature"
                          :min="0.05"
                          :max="1"
                          :step="0.05"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="输入文本" required>
                  <n-input
                      v-model:value="form.text"
                      type="textarea"
                  />
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
                  shape="round"
                  type="outline"
                  style="width: 100%"
                  @click="handleSaveConfig"
              >
                保存配置
              </a-button>
            </a-space>
          </a-form>
        </div>
      </n-scrollbar>
    </div>
    <div style="width: 25%; margin-left: 10px">
      <n-scrollbar style="height: calc(100vh - 110px)">
        <div>
          <a-space size="medium" direction="vertical" style="width: 100%">
            <a-card
                v-for="(item, index) in modelConfigs"
                :key="index"
            >
              <a-descriptions
                  :title="item.mcName"
                  :column="2"
                  :bordered="true"
                  size="small"
                  layout="inline-vertical"
              >
                <a-descriptions-item label="top_k">
                  {{ JSON.parse(item.mcParamsJson).top_k }}
                </a-descriptions-item>
                <a-descriptions-item label="top_p">
                  {{ JSON.parse(item.mcParamsJson).top_p }}
                </a-descriptions-item>
                <a-descriptions-item label="temperature">
                  {{ JSON.parse(item.mcParamsJson).temperature }}
                </a-descriptions-item>
              </a-descriptions>
              <div style="text-align: right; margin-top: 10px">
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
        @cancel="configCreateVisible = false"
        @close="configCreateVisible = false"
    >
      <a-form
          ref="formRef"
          :model="form"
      >
        <a-form-item label="配置名称" field="mcName" :rules="[{required: true, message: '配置名称是必填项'}]">
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
