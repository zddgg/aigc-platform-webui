<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from "vue";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {
  configs as queryConfigs,
  createConfig,
  GptSovitsConfig,
  GptSovitsModel,
  models as queryModels,
  playAudio
} from "@/api/gpt-sovits.ts";
import {Model} from "@/api/model.ts";
import {CascaderOption} from "naive-ui";
import {queryRefAudios, RefAudio} from "@/api/ref-audio.ts";

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null);
const createFormRef = ref<FormInstance>()
const formRef = ref<FormInstance>()

const configCreateVisible = ref(false);
const configs = ref<GptSovitsConfig[]>([])
const modelDataOptions = ref<CascaderOption[]>([]);
const refAudioDataOptions = ref<CascaderOption[]>([]);
const refAudios = ref<RefAudio[]>([])

const form = ref<GptSovitsConfig>(
    {
      modelId: '',
      moodAudioId: '',
      refAudioCascaderPath: [],

      topP: 1,
      topK: 5,
      temperature: 1,
      repetitionPenalty: 1.35,
      batchSize: 1,
      parallelInfer: true,
      splitBucket: true,
      seed: -1,
      textSplitMethod: 'cut0',
      fragmentInterval: 0.3,
      speedFactor: 1,


      configName: '',
      text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
      saveAudio: false,
    } as GptSovitsConfig
)

const getRandomInt = () => {
  const max = Math.pow(2, 32);
  return Math.floor(Math.random() * max);
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

const blob = ref<Blob | null>(null)
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

    const response = await playAudio({
      ...form.value,
    });

    blob.value = response.data;
    const url = URL.createObjectURL(response.data);

    if (audioElement.value) {
      audioElement.value.src = url;
    }

  } catch (error: any) {
    console.log(error)
    const msg = error.response.headers.get('msg');
    Message.error(base64DecodeUnicode(msg));
  } finally {
    setLoading(false);
  }
}

const handleQueryConfigs = async () => {
  const {data} = await queryConfigs()
  configs.value = data;
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const formData = new FormData();
    formData.append('configName', form.value.configName);
    formData.append('temperature', String(form.value.temperature));
    formData.append('topP', String(form.value.topP));
    formData.append('topK', String(form.value.topK));

    formData.append('repetitionPenalty', String(form.value.repetitionPenalty));
    formData.append('batchSize', String(form.value.batchSize));
    formData.append('parallelInfer', String(form.value.parallelInfer));
    formData.append('splitBucket', String(form.value.splitBucket));
    formData.append('seed', String(form.value.seed));
    formData.append('textSplitMethod', form.value.textSplitMethod);
    formData.append('fragmentInterval', String(form.value.fragmentInterval));
    formData.append('speedFactor', String(form.value.speedFactor));
    formData.append('modelId', String(form.value.modelId));
    formData.append('moodAudioId', String(form.value.moodAudioId));

    formData.append('text', String(form.value.text));
    formData.append('saveAudio', String(form.value.saveAudio));
    formData.append('file', blob?.value as Blob);

    const {msg} = await createConfig(formData);
    Message.success(msg);
    await handleQueryConfigs();
    done(true);
  } else {
    done(false);
  }
}

const copyConfig = (config: GptSovitsConfig) => {
  createFormRef.value?.resetFields();
  refAudios.value
      .forEach(item => {
        item.moods.forEach(item1 => {
          item1.moodAudios.forEach(item2 => {
            if (item2.id === config.moodAudioId) {
              form.value.refAudioCascaderPath = [item.group, item.name, item1.name]
            }
          })
        })
      });
  form.value = {
    ...form.value,
    ...config,
    configName: '',
    text: form.value.text
  };
}

const handleQueryModels = async () => {
  const {data} = await queryModels();
  modelDataOptions.value = data.reduce((acc: any, item) => {
    const {modelGroup} = item;
    let groupItem = acc.find((g: GptSovitsModel) => g.modelGroup === modelGroup);
    if (!groupItem) {
      groupItem = {modelGroup, list: []} as any;
      acc.push(groupItem);
    }
    groupItem.list.push(item);
    return acc;
  }, [])
      .map((item: any) => {
        return {
          value: item.modelGroup,
          children: item.list.map((item1: any) => {
            return {
              label: item1.modelName,
              value: item1.modelId
            };
          }),
        };
      });
}

const handleQueryRefAudios = async () => {
  const {data} = await queryRefAudios();
  refAudios.value = data;
  refAudioDataOptions.value = data.reduce((acc: any, item) => {
    const {group} = item;
    let groupItem = acc.find((g: Model) => g.group === group);
    if (!groupItem) {
      groupItem = {group, list: []} as any;
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
              label: item1.name,
              value: item1.name,
              children: item1.moods.map((item2: any) => {
                return {
                  label: item2.name,
                  value: item2.name,
                };
              }),
            };
          }),
        };
      });
}

const computedRefAudioSelectOptions = computed(() => {
  return refAudios.value
      .find(item => item.group === form.value.refAudioCascaderPath[0]
          && item.name === form.value.refAudioCascaderPath[1])
      ?.moods
      .find(item => item.name === form.value.refAudioCascaderPath[2])
      ?.moodAudios
      .map(item => {
        return {
          label: item.text,
          value: item.id,
        }
      }) ?? []
})

const refAudioCascaderChange = () => {
  nextTick(() => {
    form.value.moodAudioId = computedRefAudioSelectOptions
        .value[0]
        .value
  })
}

onMounted(() => {
  handleQueryConfigs();
  handleQueryModels();
  handleQueryRefAudios();
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
                        field="modelId"
                        :rules="[{required: true, message: '请选择一个模型'}]"
                    >
                      <a-cascader
                          v-model="form.modelId"
                          :options="modelDataOptions"/>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="12">
                  <a-card :body-style="{padding: '20px'}">
                    <a-form-item
                        label="参考音频"
                        field="refAudioCascaderPath"
                        :rules="[{required: true, message: '请选择一个参考音频'}]"
                    >
                      <a-cascader
                          v-model="form.refAudioCascaderPath"
                          path-mode
                          :options="refAudioDataOptions"
                          @change="refAudioCascaderChange"
                      />
                    </a-form-item>
                    <a-select
                        v-model="form.moodAudioId"
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
                          <span>top_K</span>
                          <n-input-number
                              v-model:value="form.topK"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.topK"
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
                          <span>top_P</span>
                          <n-input-number
                              v-model:value="form.topP"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.topP"
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
                              v-model:value="form.temperature"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.temperature"
                          :min="0.05"
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
                          <span>repetition_penalty</span>
                          <n-input-number
                              v-model:value="form.repetitionPenalty"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.repetitionPenalty"
                          :min="0"
                          :max="2"
                          :step="0.05"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
              <a-row :gutter="20">
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>batch_size</span>
                          <n-input-number
                              v-model:value="form.batchSize"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.batchSize"
                          :min="1"
                          :max="200"
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
                          <span>并行推理</span>
                        </div>
                      </template>
                      <a-checkbox v-model="form.parallelInfer"/>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>数据分桶</span>
                        </div>
                      </template>
                      <a-checkbox v-model="form.splitBucket"/>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="seed">
                      <n-input-number
                          v-model:value="form.seed"
                      />
                      <n-button
                          type="primary"
                          ghost
                          style="margin-left: 10px"
                          @click="() => form.seed = getRandomInt()"
                      >
                        随机
                      </n-button>
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
              <a-row :gutter="20">
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item label="文本切分">
                      <a-select v-model="form.textSplitMethod">
                        <a-option value="cut0">不切</a-option>
                        <a-option value="cut1">凑四句一切</a-option>
                        <a-option value="cut2">凑50字一切</a-option>
                        <a-option value="cut3">按中文句号。切</a-option>
                        <a-option value="cut4">按英文句号.切</a-option>
                        <a-option value="cut5">按标点符号切</a-option>
                      </a-select>
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="6">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>分段间隔(秒)</span>
                          <n-input-number
                              v-model:value="form.fragmentInterval"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.fragmentInterval"
                          :min="0.01"
                          :max="1"
                          :step="0.01"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
                <a-col :span="12">
                  <a-card :body-style="{padding: '20px 20px 0'}">
                    <a-form-item class="slider-wrapper">
                      <template #label>
                        <div style="display: flex; justify-content: space-between">
                          <span>speed_factor</span>
                          <n-input-number
                              v-model:value="form.speedFactor"
                              :show-button="false"
                              size="tiny"
                              style="width: 100px"
                          />
                        </div>
                      </template>
                      <n-slider
                          v-model:value="form.speedFactor"
                          :min="0.25"
                          :max="4"
                          :step="0.15"
                      />
                    </a-form-item>
                  </a-card>
                </a-col>
              </a-row>
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="输入文本">
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
      <n-scrollbar style="height: calc(100vh - 110px)">
        <div>
          <a-space size="medium" direction="vertical" style="width: 100%">
            <a-card
                v-for="(item, index) in configs"
                :key="index"
            >
              <a-descriptions
                  :title="item.configName"
                  :column="2"
                  size="small"
                  layout="inline-vertical"
              >
                <a-descriptions-item label="top_K">
                  {{ item.topK }}
                </a-descriptions-item>
                <a-descriptions-item label="top_P">
                  {{ item.topP }}
                </a-descriptions-item>
                <a-descriptions-item label="temperature">
                  {{ item.temperature }}
                </a-descriptions-item>
                <a-descriptions-item label="repetitionPenalty">
                  {{ item.repetitionPenalty }}
                </a-descriptions-item>
                <a-descriptions-item label="batchSize">
                  {{ item.batchSize }}
                </a-descriptions-item>
                <a-descriptions-item label="parallelInfer">
                  {{ item.parallelInfer }}
                </a-descriptions-item>
                <a-descriptions-item label="splitBucket">
                  {{ item.splitBucket }}
                </a-descriptions-item>
                <a-descriptions-item label="seed">
                  {{ item.seed }}
                </a-descriptions-item>
                <a-descriptions-item label="textSplitMethod">
                  {{ item.textSplitMethod }}
                </a-descriptions-item>
                <a-descriptions-item label="fragmentInterval">
                  {{ item.fragmentInterval }}
                </a-descriptions-item>
                <a-descriptions-item label="speedFactor">
                  {{ item.speedFactor }}
                </a-descriptions-item>
                <div style="text-align: right">
                  <a-button
                      type="outline" size="mini"
                      @click="copyConfig(item)"
                  >
                    复制
                  </a-button>
                </div>
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
        @close="() => {
          formRef?.resetFields();
        }"
        @cancel="() => {
          formRef?.resetFields();
        }"
    >
      <a-form
          ref="formRef"
          :model="form"
      >
        <a-form-item label="配置名称" field="configName" required>
          <a-input v-model="form.configName"/>
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
