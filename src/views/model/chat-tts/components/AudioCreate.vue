<script setup lang="ts">
import {onMounted, ref} from "vue";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {chatTts, createChatTtsConfig, queryChatTtsConfig} from "@/api/config.ts";
import {ChatTtsConfig} from "@/api/chat-tts.ts";

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null);
const formRef = ref<FormInstance>()

const configCreateVisible = ref(false);
const chatTtsConfigs = ref<ChatTtsConfig[]>([])

const default_params_refine_text = '[oral_2][laugh_0][break_6]'
const form = ref<ChatTtsConfig>(
    {
      temperature: 0.3,
      top_P: 0.7,
      top_K: 20,
      audio_seed_input: 2,
      text_seed_input: 42,
      refine_text_flag: false,
      params_refine_text: default_params_refine_text,
      configName: '',
      saveAudio: false,
      text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
      outputText: ''
    } as ChatTtsConfig
)

const getRandomInt = () => {
  const min = 1;
  const max = 100000000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  if (!form.value.text) {
    return;
  }
  try {
    form.value.outputText = ''
    if (audioElement.value) {
      audioElement.value.src = '';
    }
    setLoading(true);

    const response = await chatTts({
      ...form.value,
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
  } catch (error) {
    console.error('Error generating audio:', error);
  } finally {
    setLoading(false);
  }
}

const handleQueryChatTtsConfig = async () => {
  const {data} = await queryChatTtsConfig()
  chatTtsConfigs.value = data;
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const formData = new FormData();
    formData.append('file', blob?.value as Blob);
    formData.append('configName', form.value.configName);
    formData.append('saveAudio', String(form.value.saveAudio));
    formData.append('temperature', String(form.value.temperature));
    formData.append('top_P', String(form.value.top_P));
    formData.append('top_K', String(form.value.top_K));
    formData.append('audio_seed_input', String(form.value.audio_seed_input));
    formData.append('text_seed_input', String(form.value.text_seed_input));
    formData.append('refine_text_flag', String(form.value.refine_text_flag));
    formData.append('params_refine_text', form.value.params_refine_text);
    formData.append('outputText', form.value.outputText);
    const {msg} = await createChatTtsConfig(formData);
    Message.success(msg);
    await handleQueryChatTtsConfig();
    done(true);
  } else {
    done(false);
  }
}

const copyConfig = (config: ChatTtsConfig) => {
  form.value = {
    ...form.value,
    ...config,
    configName: ''
  };
}

onMounted(() => {
  handleQueryChatTtsConfig();
})

</script>

<template>
  <div style="display: flex;">
    <div style="width: 75%;">
      <a-form :model="form" layout="vertical">
        <a-space size="medium" direction="vertical" style="width: 100%">
          <a-card :body-style="{padding: '20px 20px 0'}">
            <a-form-item label="输入文本">
              <n-input v-model:value="form.text" type="textarea"/>
            </a-form-item>
          </a-card>
          <a-row :gutter="24">
            <a-col :span="6">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="Refine text">
                  <n-checkbox v-model:checked="form.refine_text_flag"/>
                </a-form-item>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item class="slider-wrapper">
                  <template #label>
                    <div style="display: flex; justify-content: space-between">
                      <span>temperature</span>
                      <n-input-number v-model:value="form.temperature" :show-button="false" size="tiny"
                                      style="width: 100px"/>
                    </div>
                  </template>
                  <n-slider
                      v-model:value="form.temperature"
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
                      <n-input-number v-model:value="form.top_P" :show-button="false" size="tiny" style="width: 100px"/>
                    </div>
                  </template>
                  <n-slider
                      v-model:value="form.top_P"
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
                      <n-input-number v-model:value="form.top_K" :show-button="false" size="tiny" style="width: 100px"/>
                    </div>
                  </template>
                  <n-slider
                      v-model:value="form.top_K"
                      :min="1"
                      :max="20"
                      :step="1"
                  />
                </a-form-item>
              </a-card>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="6">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="Audio Seed">
                  <n-input-number v-model:value="form.audio_seed_input"/>
                  <n-button
                      type="primary"
                      ghost
                      style="margin-left: 10px"
                      @click="() => form.audio_seed_input = getRandomInt()"
                  >
                    随机
                  </n-button>
                </a-form-item>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="Text Seed">
                  <n-input-number v-model:value="form.text_seed_input"/>
                  <n-button
                      type="primary"
                      ghost
                      style="margin-left: 10px"
                      @click="() => form.text_seed_input = getRandomInt()"
                  >
                    随机
                  </n-button>
                </a-form-item>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="params_refine_text">
                  <n-input v-model:value="form.params_refine_text"/>
                  <n-button
                      type="primary"
                      ghost
                      style="margin-left: 10px"
                      @click="() => form.params_refine_text = default_params_refine_text">
                    加载默认
                  </n-button>
                </a-form-item>
              </a-card>
            </a-col>
          </a-row>
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
                  :loading="loading"
                  type="textarea"
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
    <div style="width: 25%; margin-left: 20px">
      <n-scrollbar style="height: calc(100vh - 100px)">
        <div style="padding-right: 10px">
          <a-space size="medium" direction="vertical" style="width: 100%">
            <a-card
                v-for="(item, index) in chatTtsConfigs"
                :key="index"
            >
              <a-descriptions
                  :title="item.configName"
                  :column="2"
                  size="small"

                  layout="inline-vertical"
              >
                <a-descriptions-item label="audio_seed">
                  {{ item.audio_seed_input }}
                </a-descriptions-item>
                <a-descriptions-item label="text_seed">
                  {{ item.text_seed_input }}
                </a-descriptions-item>
                <a-descriptions-item label="top_P">
                  {{ item.top_P }}
                </a-descriptions-item>
                <a-descriptions-item label="top_K">
                  {{ item.top_K }}
                </a-descriptions-item>
                <a-descriptions-item label="temperature">
                  {{ item.temperature }}
                </a-descriptions-item>
                <a-descriptions-item label="refine_flag">
                  {{ item.refine_text_flag }}
                </a-descriptions-item>
                <a-descriptions-item label="refine_params">
                  <div style="display: flex; justify-content: space-between">
                    <div>
                      <span>
                        {{ item.params_refine_text }}
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
</style>
