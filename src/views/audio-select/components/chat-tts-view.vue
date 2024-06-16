<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {ChatTtsConfig, configs as queryChatTtsConfigs} from "@/api/chat-tts.ts";
import {AudioModelConfig} from "@/api/model.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  activeTabKey: {
    type: String,
  },
  audioModelConfig: {
    type: Object as PropType<AudioModelConfig>
  }
})

const emits = defineEmits(['modelSelect'])

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const chatTtsConfigs = ref<ChatTtsConfig[]>([])
const currentConfig = ref<ChatTtsConfig>({} as ChatTtsConfig)
const searchInput = ref<string>('')


const computedConfigs = computed(() => {
  let tmp = chatTtsConfigs.value;
  if (searchInput.value) {
    tmp = tmp.filter(item => item.configName.includes(searchInput.value.toLowerCase()))
  }
  return tmp;
})

const handleQueryChatTtsConfig = async () => {
  const {data} = await queryChatTtsConfigs()
  chatTtsConfigs.value = data
}

const activeAudioKey = ref<string>('')

const playAudio = (key: string, url: string) => {
  activeAudioKey.value = key;
  if (audioElement.value) {
    // 设置音频源
    audioElement.value.src = url;

    // 播放音频
    audioElement.value.play();
  }
};

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
  const audioModelConfig: AudioModelConfig = {
    audioModelType: 'chat-tts',
    audioConfigId: currentConfig.value.configId,
  } as AudioModelConfig;
  emits('modelSelect', audioModelConfig);
}

watch(
    () => props.visible,
    () => {
      if (props.visible) {
        handleQueryChatTtsConfig();
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
        if (props.audioModelConfig) {
          currentConfig.value = props.audioModelConfig?.chatTtsConfig as ChatTtsConfig;
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
          <a-grid :cols="3" :col-gap="10" :row-gap="10">
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
                      {{ item.configName }}
                    </a-typography-text>
                  </template>
                  <a-descriptions-item label="audio_seed">
                    {{ item.audioSeedInput }}
                  </a-descriptions-item>
                  <a-descriptions-item label="text_seed">
                    {{ item.textSeedInput }}
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
        v-if="currentConfig?.configName"
        style="width: 40%"
    >
      <div>
        <a-descriptions :column="2" layout="inline-vertical" size="medium" bordered>
          <template #title>
            <a-typography-text ellipsis>
              {{ currentConfig.configName }}
            </a-typography-text>
          </template>
          <a-descriptions-item label="audio_seed">
            {{ currentConfig.audioSeedInput }}
          </a-descriptions-item>
          <a-descriptions-item label="text_seed">
            {{ currentConfig.textSeedInput }}
          </a-descriptions-item>
          <a-descriptions-item label="top_P">
            {{ currentConfig.topP }}
          </a-descriptions-item>
          <a-descriptions-item label="top_K">
            {{ currentConfig.topK }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ currentConfig.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_flag">
            {{ currentConfig.refineTextFlag }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_params">
            {{ currentConfig.refineTextParams }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <a-divider/>
      <div style="display: flex; align-items: center; padding: 0 5px 5px 0">
        <div style="margin-left: 20px; width: 100%">
          <div style="display: flex;justify-content: space-between; align-items: center">
            <a-space size="small">
              <div>
                <span>{{ currentConfig.configName }}</span>
              </div>
              <div
                  v-if="currentConfig.url"
              >
                <a-button
                    v-if="activeAudioKey === currentConfig.configName"
                    size="mini"
                    type="outline"
                    status="danger"
                    @click="stopAudio"
                >
                  <icon-mute/>
                </a-button>
                <a-button
                    v-else
                    size="mini"
                    type="outline"
                    style="text-align: right; margin-left: 5px"
                    @click.stop="playAudio(currentConfig.configName, currentConfig.url)"
                >
                  <icon-play-arrow/>
                </a-button>
              </div>
              <a-dropdown
                  position="br"
                  popup-container="select-view"
              >
                <a-button
                    v-if="currentConfig.url"
                    size="mini" type="outline"
                >
                  更多音频
                  <icon-down/>
                </a-button>
                <template #content>
                  <a-doption>
                    <div
                        style="
                                        width: 500px;
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center"
                    >
                      <div style="width: 90%">
                        <div>
                          <a-typography-paragraph style="margin: 0">
                            {{ currentConfig.text }}
                          </a-typography-paragraph>
                        </div>
                      </div>
                      <div style="width: 10%">
                        <a-button
                            v-if="activeAudioKey === currentConfig.configName"
                            size="mini"
                            type="outline"
                            status="danger"
                            style="text-align: right; margin-left: 5px"
                            @click.stop="stopAudio"
                        >
                          <icon-mute/>
                        </a-button>
                        <a-button
                            v-else
                            size="mini"
                            type="outline"
                            style="text-align: right; margin-left: 5px"
                            @click.stop="playAudio(currentConfig.configName, currentConfig.url)"
                        >
                          <icon-play-arrow/>
                        </a-button>
                      </div>
                    </div>
                  </a-doption>
                </template>
              </a-dropdown>
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