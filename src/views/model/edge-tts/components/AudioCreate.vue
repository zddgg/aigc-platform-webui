<script setup lang="ts">
import {onMounted, ref} from "vue";
import useLoading from "@/hooks/loading.ts";
import {FormInstance} from "@arco-design/web-vue";
import {configs as queryConfigs, EdgeTtsConfig, playAudio, settings as querySettings} from "@/api/edge-tts.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null);
const formRef = ref<FormInstance>()

const configCreateVisible = ref(false);
const edgeTtsConfigs = ref<EdgeTtsConfig[]>([])
const settingOptions = ref<SelectOptionData[]>([])
const selectLanguage = ref<string>('')

const form = ref<EdgeTtsConfig>(
    {
      shortName: '',
      text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
    } as EdgeTtsConfig
)

const blob = ref<Blob | null>(null)
const generateAudio = async () => {
  const res = await formRef.value?.validate();
  if (!res) {
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
    } finally {
      setLoading(false);
    }
  }
}

const handleQueryConfigs = async () => {
  const {data} = await queryConfigs()
  edgeTtsConfigs.value = data;
}

const handleQuerySettings = async () => {
  const {data} = await querySettings()
  settingOptions.value = data
      .sort((a, b) => (b.showFlag ? 1 : 0) - (a.showFlag ? 1 : 0))
      .map(item => {
        return {
          label: item.zhName || item.enName,
          value: item.enName,
        }
      });
}

onMounted(() => {
  handleQueryConfigs();
  handleQuerySettings();
})

</script>

<template>
  <div style="display: flex;">
    <div style="width: 100%;">
      <n-scrollbar style="height: calc(100vh - 100px)">
        <div style="padding-right: 10px">
          <a-form ref="formRef" :model="form" layout="vertical">
            <a-space size="medium" direction="vertical" style="width: 100%">
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="Language">
                  <a-select
                      v-model="selectLanguage"
                      :options="settingOptions"
                      allow-clear
                      allow-search
                  />
                </a-form-item>
                <a-form-item label="shortName" field="shortName" required>
                  <a-select
                      v-model="form.shortName"
                      allow-search
                      allow-clear
                  >
                    <a-option
                        v-for="(item, index) in edgeTtsConfigs.filter(item => {
                          if (!selectLanguage) {
                            return true;
                          }
                          return item.shortName.substring(0, item.shortName.indexOf('-')) === selectLanguage;
                        })"
                        :key="index"
                    >
                      {{ item.shortName }}
                    </a-option>
                  </a-select>
                </a-form-item>
              </a-card>
              <a-card :body-style="{padding: '20px 20px 0'}">
                <a-form-item label="输入文本" field="text" required>
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
  </div>
</template>

<style scoped>
:deep(.slider-wrapper .arco-form-item-label) {
  width: 100%;
}
</style>
