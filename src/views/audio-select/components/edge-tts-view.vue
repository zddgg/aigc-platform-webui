<script setup lang="ts">
import {computed, onMounted, PropType, ref, watch} from "vue";
import useLoading from "@/hooks/loading.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {AudioModelInfoKey} from "@/api/model.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import {LangDict, queryLangDicts} from "@/api/dict.ts";
import {AmModelConfig, getByModelType as queryModelConfigs, playOrCreateAudio} from "@/api/am-model-config.ts";
import {EDGE_TTS} from "@/types/model-types.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  activeTabKey: {
    type: String,
  },
  audioModelInfo: {
    type: Object as PropType<AudioModelInfoKey>
  }
})

const emits = defineEmits(['modelSelect'])

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const modelConfigs = ref<AmModelConfig[]>([])
const currentConfig = ref<AmModelConfig>({} as AmModelConfig)

const genderOptions = ref<SelectOptionData[]>([])
const selectGender = ref<string>('')
const selectLanguage = ref<string>('')
const voiceNameInput = ref<string>('')

const computedVoices = computed(() => {
  let tmp = modelConfigs.value;
  if (selectGender.value) {
    tmp = tmp.filter(item => JSON.parse(item.mcParamsJson).gender === selectGender.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => JSON.parse(item.mcParamsJson).locale.startsWith(selectLanguage.value))
  }
  if (voiceNameInput.value) {
    tmp = tmp.filter(item => JSON.parse(item.mcParamsJson).shortName.toLowerCase()
        .includes(voiceNameInput.value.toLowerCase()))
  }
  return tmp;
})

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: EDGE_TTS})
  modelConfigs.value = data;
}

const activeAudioKey = ref<string>('')
const createAudioKey = ref('')

const playAudio = async (modelConfig: AmModelConfig) => {
  try {
    createAudioKey.value = modelConfig.mcName;
    setLoading(true);
    const response = await playOrCreateAudio({mcId: modelConfig.mcId});
    const url = URL.createObjectURL(response.data);

    activeAudioKey.value = modelConfig.mcName;

    if (audioElement.value) {
      // 设置音频源
      audioElement.value.src = url;

      // 播放音频
      audioElement.value.play();
    }
  } catch (e) {
    activeAudioKey.value = '';
  } finally {
    createAudioKey.value = '';
    setLoading(false);
  }
}

const stopAudio = () => {
  if (audioElement.value) {
    // 停止音频播放
    audioElement.value.pause();
    audioElement.value.currentTime = 0; // 将播放进度设置为音频开头
  }
  activeAudioKey.value = '';
};

const handleAudioEnded = () => {
  activeAudioKey.value = '';
};

const modelSelect = () => {
  const audioModelInfo: AudioModelInfoKey = {
    amType: EDGE_TTS,
    amMcId: currentConfig.value.mcId,
  } as AudioModelInfoKey;
  emits('modelSelect', audioModelInfo);
}

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

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        if (props.activeTabKey === '3') {
          if (props.audioModelInfo) {
            const find = modelConfigs.value.find(item => item.mcId === props.audioModelInfo?.amMcId);
            if (find) {
              currentConfig.value = {...find};
            }
          }
        }
      }
    },
    {immediate: true}
)

watch(
    () => props.activeTabKey,
    () => {
      if (props.activeTabKey !== EDGE_TTS) {
        stopAudio();
      }
    },
    {immediate: true}
);

</script>

<template>
  <div style="display: flex">
    <div style="width: 60%">
      <a-space>
        <a-select
            v-model="selectGender"
            :options="genderOptions"
            allow-clear
            placeholder="性别"
            size="small"
            style="width: 100px"
        />
        <a-select
            v-model="selectLanguage"
            :options="langDicts"
            :field-names="{value: 'enName', label: 'zhName'}"
            allow-clear
            placeholder="语言"
            size="small"
            style="width: 100px"
        />
        <a-input
            v-model="voiceNameInput"
            placeholder="搜索"
            allow-clear
            size="small"
            style="width: 200px"
        />
      </a-space>
      <n-scrollbar style="height: 500px; margin-top: 10px">
        <div style="margin-right: 10px">
          <a-grid :cols="3" :col-gap="10" :row-gap="10">
            <a-grid-item
                v-for="(item, index) in computedVoices"
                :key="index"
            >
              <a-card
                  hoverable
                  :body-style="{padding: '10px'}"
                  style="border: 1px #ccc solid; border-radius: 8px"
                  @click="() => (currentConfig = item)"
              >
                <div style="display: flex; justify-content: center; align-items: center">
                  <div style="width: 40%; text-align: left">
                    <div v-if="item.avatar">
                      <a-avatar :image-url="item.avatar"
                      />
                    </div>
                    <div v-else>
                      <a-avatar>
                        <span>{{ voiceNameFormat(item.mcName) }}</span>
                      </a-avatar>
                    </div>
                  </div>
                  <div style="width: 60%; margin-left: 10px">
                    <a-space direction="vertical" style="width: 100%">
                      <a-tag color="blue" style="display: block; width: 100%">
                        {{
                          JSON.parse(item.mcParamsJson).gender === 'Male'
                              ? '男'
                              : JSON.parse(item.mcParamsJson).gender === 'Female'
                                  ? '女'
                                  : JSON.parse(item.mcParamsJson).gender
                        }}
                      </a-tag>
                      <a-tag color="cyan" style="display: block; width: 100%">
                        <a-typography-text ellipsis>
                          {{ JSON.parse(item.mcParamsJson).locale ?? '未知' }}
                        </a-typography-text>
                      </a-tag>
                    </a-space>
                  </div>
                </div>
                <div style="margin-top: 5px; text-align: left">
                  <a-typography-text ellipsis>
                    {{ voiceNameFormat(item.mcName) }}
                  </a-typography-text>
                </div>
              </a-card>
            </a-grid-item>
          </a-grid>
        </div>
      </n-scrollbar>
    </div>
    <a-divider direction="vertical"/>
    <div
        v-if="currentConfig?.mcName"
        style="width: 40%"
    >
      <div>
        <div style="display: flex; align-items: center">
          <div v-if="currentConfig?.avatar">
            <a-avatar :image-url="currentConfig?.avatar"
            />
          </div>
          <div v-else>
            <a-avatar>
              <span>{{ voiceNameFormat(currentConfig?.mcName) }}</span>
            </a-avatar>
          </div>
          <div style="margin-left: 20px">
            <a-descriptions size="small" :title="voiceNameFormat(currentConfig?.mcName)" :column="2">
              <a-descriptions-item label="性别">
                {{ JSON.parse(currentConfig.mcParamsJson)?.gender }}
              </a-descriptions-item>
              <a-descriptions-item label="语言">
                {{ JSON.parse(currentConfig.mcParamsJson)?.locale }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>
      </div>
      <a-divider/>
      <div
          style="display: flex; align-items: center; padding: 0 5px 5px 0">
        <div v-if="currentConfig?.avatar">
          <a-avatar :image-url="currentConfig?.avatar"
          />
        </div>
        <div v-else>
          <a-avatar>
            <span>{{ voiceNameFormat(currentConfig.mcName) }}</span>
          </a-avatar>
        </div>
        <div style="margin-left: 20px; width: 100%">
          <div style="display: flex;justify-content: space-between; align-items: center">
            <a-space size="medium">
              <div>
                <span>{{ voiceNameFormat(currentConfig.mcName) }}</span>
              </div>
              <div>
                <a-button
                    v-if="activeAudioKey === currentConfig.mcName"
                    type="outline"
                    status="danger"
                    size="mini"
                    @click="stopAudio"
                >
                  <icon-mute-fill/>
                </a-button>
                <a-button
                    v-else
                    type="outline"
                    size="mini"
                    :disabled="createAudioKey === currentConfig.mcName && loading"
                    @click="playAudio(currentConfig)"
                >
                  <icon-refresh
                      v-if="createAudioKey === currentConfig.mcName && loading"
                      :spin="createAudioKey === currentConfig.mcName && loading"
                  />
                  <icon-play-arrow v-else/>
                </a-button>
              </div>
            </a-space>
            <div>
              <a-button size="mini" type="primary" @click="modelSelect">使用</a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>