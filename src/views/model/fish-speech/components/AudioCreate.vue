<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from "vue";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {
  configs as queryConfigs,
  createConfig,
  FishSpeechConfig,
  FishSpeechModel,
  models as queryModels,
  playAudio
} from "@/api/fish-speech.ts";
import {Model} from "@/api/model.ts";
import {CascaderOption} from "naive-ui";
import {queryRefAudios, RefAudio} from "@/api/ref-audio.ts";

const props = defineProps({
  configEditId: {
    type: Number
  }
})

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null);
const createFormRef = ref<FormInstance>()
const formRef = ref<FormInstance>()

const configCreateVisible = ref(false);
const configs = ref<FishSpeechConfig[]>([])
const modelDataOptions = ref<CascaderOption[]>([]);
const refAudioDataOptions = ref<CascaderOption[]>([]);
const refAudios = ref<RefAudio[]>([])

const form = ref<FishSpeechConfig>(
    {
      modelId: '',
      moodAudioId: '',
      refAudioCascaderPath: [],

      topP: 0.7,
      temperature: 0.7,
      repetitionPenalty: 1.5,

      configName: '',
      text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
      saveAudio: false,
    } as FishSpeechConfig
)

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
    if (form.value.id) {
      formData.append('id', String(form.value.id));
    }
    formData.append('configName', form.value.configName);

    formData.append('temperature', String(form.value.temperature));
    formData.append('topP', String(form.value.topP));
    formData.append('repetitionPenalty', String(form.value.repetitionPenalty));

    formData.append('modelId', String(form.value.modelId));
    formData.append('moodAudioId', String(form.value.moodAudioId));

    formData.append('text', String(form.value.text));
    formData.append('saveAudio', String(form.value.saveAudio || false));
    formData.append('file', blob?.value as Blob);

    const {msg} = await createConfig(formData);
    Message.success(msg);
    await handleQueryConfigs();
    done(true);
  } else {
    done(false);
  }
}

const copyConfig = (config: FishSpeechConfig) => {
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
    id: undefined,
    configName: '',
    text: form.value.text,
  };
}

const handleQueryModels = async () => {
  const {data} = await queryModels();
  modelDataOptions.value = data.reduce((acc: any, item) => {
    const {modelGroup} = item;
    let groupItem = acc.find((g: FishSpeechModel) => g.modelGroup === modelGroup);
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
  if (!form.value.refAudioCascaderPath) {
    return [];
  }
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

onMounted(async () => {
  await handleQueryModels();
  await handleQueryRefAudios();
  await handleQueryConfigs();
  if (props.configEditId) {
    const find = configs.value.find((item) => item.id === props.configEditId);
    if (find) {

      let refAudioCascaderPath: string[] = []

      refAudios.value.forEach(item => {
        item.moods.forEach(item1 => {
          item1.moodAudios.forEach(item2 => {
            if (item2.id === find.moodAudioId) {
              refAudioCascaderPath = [item.group, item.name, item1.name]
            }
          })
        })
      });

      form.value = {
        ...find,
        refAudioCascaderPath: refAudioCascaderPath,
        text: form.value.text,
      } as FishSpeechConfig
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
                <a-descriptions-item label="top_P">
                  {{ item.topP }}
                </a-descriptions-item>
                <a-descriptions-item label="temperature">
                  {{ item.temperature }}
                </a-descriptions-item>
                <a-descriptions-item label="repetitionPenalty">
                  {{ item.repetitionPenalty }}
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
