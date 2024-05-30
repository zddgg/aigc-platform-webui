<script setup lang="ts">
import {voiceNameFormat} from "@/utils/model-util.ts";
import {computed, onMounted, PropType, ref, watch} from "vue";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import {EdgeTtsVoice, LangText, queryEdgeTtsConfig} from "@/api/config.ts";
import {ModelSelect, queryRefAudios, RefAudio} from "@/api/ref-audio.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelSelect: {
    type: Object as PropType<ModelSelect>
  }
})
const emits = defineEmits(['change']);

const genderOptions = ref<SelectOptionData[]>([])
const selectGender = ref<string>('')
const languageOptions = ref<string[]>([])
const selectLanguage = ref<string>('')
const nameSearchInput = ref<string>('')

const voices = ref<EdgeTtsVoice[]>([])
const langTexts = ref<LangText[]>([])

const refAudios = ref<RefAudio[]>([])

const computedVoices = computed(() => {
  let tmp = voices.value;
  if (selectGender.value) {
    tmp = tmp.filter(item => (item.gender === 'Male' ? '男' : item.gender === 'Female' ? '女' : item.gender) === selectGender.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => {
      const language = item.locale.substring(0, item.locale.indexOf('-'));
      const lang = language === 'zh' ? '中文' :
          language === 'en' ? '英文' :
              language === 'ja' ? '日文' :
                  language === 'ko' ? '韩文' :
                      language;
      return lang === selectLanguage.value
    })
  }
  if (nameSearchInput.value) {
    tmp = tmp.filter(item => item.shortName.substring(item.shortName.lastIndexOf('-') + 1)
        .replace('Neural', '').toLowerCase()
        .includes(nameSearchInput.value.toLowerCase()))
  }
  return tmp;
})

const voiceSelect = (voice: EdgeTtsVoice) => {
  let refAudio;

  const language = voice.locale.substring(0, voice.locale.indexOf('-'));
  const find = refAudios.value.find(item => item.group === 'edge-tts' && item.name === voice.shortName);
  if (find) {
    refAudio = {
      ...find,
      modelType: 'edge-tts',
      name: voice.shortName,
      gender: voice.gender === 'Male' ? '男' : voice.gender === 'Female' ? '女' : voice.gender,
      language: language === 'zh' ? '中文' :
          language === 'en' ? '英文' :
              language === 'ja' ? '日文' :
                  language === 'ko' ? '韩文' :
                      language,
    } as RefAudio;
  } else {
    refAudio = {
      modelType: 'edge-tts',
      group: 'edge-tts',
      name: voice.shortName,
      gender: voice.gender === 'Male' ? '男' : voice.gender === 'Female' ? '女' : voice.gender,
      language: language === 'zh' ? '中文' :
          language === 'en' ? '英文' :
              language === 'ja' ? '日文' :
                  language === 'ko' ? '韩文' :
                      language,
      moods: [
        {
          name: '默认',
        }
      ]
    } as RefAudio
  }

  emits('change', refAudio)
}


const handleQueryVoices = async () => {
  const {data} = await queryEdgeTtsConfig()
  voices.value = data.voices
  langTexts.value = data.langTexts
}

const handleQueryRefAudio = async () => {
  const {data} = await queryRefAudios();
  refAudios.value = data;
}

onMounted(() => {
  handleQueryVoices();
  handleQueryRefAudio();
})

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        if (props.modelSelect?.modelType) {
          const find = voices.value.find(item => item.shortName === props.modelSelect?.model[0]);
          if (find) {
            voiceSelect(find);
          }
        }
      }
    },
    {immediate: true}
);


</script>

<template>
  <div>
    <a-space>
      <a-select v-model="selectGender"
                :options="genderOptions"
                allow-clear
                placeholder="性别"
                style="width: 100px"
      />
      <a-select v-model="selectLanguage"
                :options="languageOptions"
                allow-clear
                placeholder="语言"
                style="width: 100px"
      />
      <a-input
          v-model="nameSearchInput"
          placeholder="搜索"
          allow-clear
          style="width: 200px"
      />
    </a-space>
    <div style="margin-top: 10px">
      <n-scrollbar style="height: 500px">
        <a-grid :cols="3" :col-gap="10" :row-gap="10" style="margin-right: 10px">
          <a-grid-item
              v-for="(item, index) in computedVoices"
              :key="index"
          >
            <a-card
                hoverable
                :body-style="{padding: '10px'}"
                style="border: 1px #ccc solid; border-radius: 8px"
                @click="voiceSelect(item)"
            >
              <div style="display: flex; justify-content: center; align-items: center">
                <div style="width: 50%; text-align: center">
                  <div>
                    <a-avatar>
                      <span>{{ voiceNameFormat(item.shortName) }}</span>
                    </a-avatar>
                  </div>
                  <div style="text-align: center; margin-top: 5px">
                    <a-typography-text ellipsis>{{ voiceNameFormat(item.shortName) }}</a-typography-text>
                  </div>
                </div>
                <div style="width: 50%; margin-left: 10px">
                  <a-space direction="vertical" style="width: 100%">
                    <a-tag color="blue" style="display: block; width: 100%">
                      {{ item.gender === 'Male' ? '男' : item.gender === 'Female' ? '女' : item.gender }}
                    </a-tag>
                    <a-tag color="green" style="display: block; width: 100%">
                      {{ '未知' }}
                    </a-tag>
                    <a-tag color="cyan" style="display: block; width: 100%">
                      <a-typography-text ellipsis>
                        {{ item.locale ?? '未知' }}
                      </a-typography-text>
                    </a-tag>
                  </a-space>
                </div>
              </div>
            </a-card>
          </a-grid-item>
        </a-grid>
      </n-scrollbar>
    </div>
  </div>
</template>

<style scoped>

</style>