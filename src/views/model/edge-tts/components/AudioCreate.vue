<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import useLoading from "@/hooks/loading.ts";
import {FormInstance} from "@arco-design/web-vue";
import {AmModelConfig, getByModelType as queryModelConfigs, createAudio} from "@/api/am-model-config.ts";
import {EDGE_TTS} from "@/types/model-types.ts";
import {LangDict, queryLangDicts} from "@/api/dict.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null);
const formRef = ref<FormInstance>()

const modelConfigs = ref<AmModelConfig[]>([])

const selectGender = ref<string>('')
const genderOptions = ref<SelectOptionData[]>([])
const selectLanguage = ref<string>('')

const form = ref(
    {
      configParam: {
        shortName: '',
      },

      text: '四川美食确实以辣闻名，但也有不辣的选择。比如甜水面、赖汤圆、蛋烘糕、叶儿粑等，这些小吃口味温和，甜而不腻，也很受欢迎。',
    }
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

      const response = await createAudio({
        amType: EDGE_TTS,
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
}

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: EDGE_TTS})
  modelConfigs.value = data;
}

const computedVoices = computed(() => {
  let tmp = modelConfigs.value;
  if (selectGender.value) {
    tmp = tmp.filter(item => JSON.parse(item.mcParamsJson).gender === selectGender.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => JSON.parse(item.mcParamsJson).locale.startsWith(selectLanguage.value))
  }
  return tmp;
})

const langDicts = ref<LangDict[]>([])

const handleLangDicts = async () => {
  const {data} = await queryLangDicts()
  langDicts.value = data;
}

const computedGender = () => {
  genderOptions.value = Array.from(new Set(modelConfigs.value.map(item => JSON.parse(item.mcParamsJson).gender)))
      .map(gender => ({
        label: gender === 'Male' ? '男' : gender === 'Female' ? '女' : gender,
        value: gender
      }));
}

onMounted(async () => {
  await handleQueryModelConfigs();
  await handleLangDicts();
  computedGender();
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
                <a-row :gutter="20">
                  <a-col :span="12">
                    <a-form-item label="Gender">
                      <a-select
                          v-model="selectGender"
                          :options="genderOptions"
                          allow-clear
                          allow-search
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="Language">
                      <a-select
                          v-model="selectLanguage"
                          :options="langDicts"
                          :field-names="{value: 'enName', label: 'zhName'}"
                          allow-clear
                          allow-search
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-form-item
                    label="shortName" field="configParam.shortName"
                    :rules="[{required: true, message: 'shortName是必填项'}]"
                >
                  <a-select
                      v-model="form.configParam.shortName"
                      allow-search
                      allow-clear
                  >
                    <a-option
                        v-for="(item, index) in computedVoices"
                        :key="index"
                    >
                      {{ JSON.parse(item.mcParamsJson).shortName }}
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
