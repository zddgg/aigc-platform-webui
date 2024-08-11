<script setup lang="ts">
import {computed, onMounted, PropType, ref, watch} from "vue";
import {AudioModelInfoKey} from "@/api/model.ts";
import {AmModelConfig, getByModelType as queryModelConfigs, playOrCreateAudio} from "@/api/am-model-config.ts";
import {CHAT_TTS} from "@/types/model-types.ts";
import useLoading from "@/hooks/loading.ts";

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
const searchInput = ref<string>('')

const computedConfigs = computed(() => {
  let tmp = modelConfigs.value;
  if (searchInput.value) {
    tmp = tmp.filter(item => item.mcName.includes(searchInput.value.toLowerCase()))
  }
  return tmp;
})

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: CHAT_TTS})
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
    amType: CHAT_TTS,
    amMcId: currentConfig.value.mcId,
  } as AudioModelInfoKey;
  emits('modelSelect', audioModelInfo);
}

onMounted(() => {
  handleQueryModelConfigs();
})

watch(
    () => props.visible,
    () => {
      if (props.visible) {
      }
    },
    {immediate: true}
)

watch(
    () => props.activeTabKey,
    () => {
      if (props.activeTabKey !== '2') {
        stopAudio();
      }
      if (props.activeTabKey === '2') {
        if (props.audioModelInfo) {
          const find = modelConfigs.value.find(item => item.mcId === props.audioModelInfo?.amMcId);
          if (find) {
            currentConfig.value = {...find};
          }
        }
      }
    },
    {immediate: true}
);

</script>

<template>
  <div style="display: flex">
    <div style="width: 60%">
      <a-space>
        <a-input
            v-model="searchInput"
            placeholder="搜索"
            allow-clear
            size="small"
            style="width: 200px"
        />
      </a-space>
      <n-scrollbar style="height: 500px; margin-top: 10px">
        <div style="margin-right: 10px">
          <a-grid :cols="2" :col-gap="10" :row-gap="10">
            <a-grid-item
                v-for="(item, index) in computedConfigs"
                :key="index"
            >
              <a-card
                  hoverable
                  :body-style="{padding: '10px'}"
                  style="border: 1px #ccc solid; border-radius: 8px"
                  @click="() => (currentConfig = {...item})"
              >
                <a-descriptions :column="1" size="small" :align="{ label: 'right' }">
                  <template #title>
                    <a-typography-text ellipsis>
                      {{ item.mcName }}
                    </a-typography-text>
                  </template>
                  <a-descriptions-item label="audio_seed">
                    {{ JSON.parse(item.mcParamsJson).audio_seed }}
                  </a-descriptions-item>
                  <a-descriptions-item label="text_seed">
                    {{ JSON.parse(item.mcParamsJson).text_seed }}
                  </a-descriptions-item>
                </a-descriptions>
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
        <a-descriptions :column="2" layout="inline-vertical" size="medium" bordered>
          <template #title>
            <a-typography-text ellipsis>
              {{ currentConfig.mcName }}
            </a-typography-text>
          </template>
          <a-descriptions-item label="audio_seed">
            {{ JSON.parse(currentConfig.mcParamsJson).audio_seed }}
          </a-descriptions-item>
          <a-descriptions-item label="text_seed">
            {{ JSON.parse(currentConfig.mcParamsJson).text_seed }}
          </a-descriptions-item>
          <a-descriptions-item label="top_P">
            {{ JSON.parse(currentConfig.mcParamsJson).params_infer_code?.top_P }}
          </a-descriptions-item>
          <a-descriptions-item label="top_K">
            {{ JSON.parse(currentConfig.mcParamsJson).params_infer_code?.top_K }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ JSON.parse(currentConfig.mcParamsJson).params_infer_code?.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_flag">
            {{ !JSON.parse(currentConfig.mcParamsJson).skip_refine_text }}
          </a-descriptions-item>
          <a-descriptions-item label="params_refine_text">
            {{ JSON.parse(currentConfig.mcParamsJson).params_refine_text?.prompt }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <a-divider/>
      <div style="display: flex; align-items: center; padding: 0 5px 5px 0">
        <div style="margin-left: 20px; width: 100%">
          <div style="display: flex;justify-content: space-between; align-items: center">
            <a-space size="medium">
              <div>
                <span>{{ currentConfig.mcName }}</span>
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