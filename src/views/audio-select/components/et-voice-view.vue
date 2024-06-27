<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import useLoading from "@/hooks/loading.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {AudioModelConfig} from "@/api/model.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import {configs as queryConfigs, EdgeTtsConfig, playOrCreateAudio, settings as querySettings} from "@/api/edge-tts.ts";

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

const {loading, setLoading} = useLoading();
const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const edgeTtsConfigs = ref<EdgeTtsConfig[]>([])
const currentAudio = ref<EdgeTtsConfig>({} as EdgeTtsConfig)

const genderOptions = ref<SelectOptionData[]>([])
const selectGender = ref<string>('')
const selectLanguage = ref<string>('')
const nameSearchInput = ref<string>('')
const settingOptions = ref<SelectOptionData[]>([])

const computedVoices = computed(() => {
  let tmp = edgeTtsConfigs.value;
  if (selectGender.value) {
    tmp = tmp.filter(item => item.gender === selectGender.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => item.locale.startsWith(selectLanguage.value))
  }
  if (nameSearchInput.value) {
    tmp = tmp.filter(item => item.shortName.substring(item.shortName.lastIndexOf('-') + 1)
        .replace('Neural', '').toLowerCase()
        .includes(nameSearchInput.value.toLowerCase()))
  }
  return tmp;
})

const handleQueryConfigs = async () => {
  const {data} = await queryConfigs()
  edgeTtsConfigs.value = data
  genderOptions.value = Array.from(new Set(data.map(item => item.gender)))
      .map(gender => {
        return {
          label: gender === 'Male' ? '男' : gender === 'Female' ? '女' : gender,
          value: gender
        }
      });
}

const handleQuerySettings = async () => {
  const {data} = await querySettings();
  settingOptions.value = data.sort((a, b) => (b.showFlag ? 1 : 0) - (a.showFlag ? 1 : 0))
      .filter(item => item.showFlag)
      .map(item => {
        return {
          label: item.zhName || item.enName,
          value: item.enName,
        }
      });
}

const activeAudioKey = ref<string>('')

const playAudio = async (voice: EdgeTtsConfig) => {
  if (!voice.url) {
    try {
      setLoading(true)
      const {data} = await playOrCreateAudio(voice.shortName);
      voice.url = data
    } finally {
      setLoading(false)
    }
  }
  activeAudioKey.value = voice.shortName;
  if (audioElement.value) {
    // 设置音频源
    audioElement.value.src = voice.url;

    // 播放音频
    await audioElement.value.play();
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
    audioModelType: 'edge-tts',
    audioConfigId: currentAudio.value.shortName,
  } as AudioModelConfig;
  emits('modelSelect', audioModelConfig);
}

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryConfigs();
        await handleQuerySettings();

        if (props.activeTabKey === '3') {
          if (props.audioModelConfig && props.audioModelConfig?.edgeTtsConfig) {
            const find = edgeTtsConfigs.value.find(item => item.shortName === props.audioModelConfig?.edgeTtsConfig?.shortName);
            if (find) {
              currentAudio.value = {...find};
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
      if (props.activeTabKey !== '3') {
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
            :options="settingOptions"
            allow-clear
            placeholder="语言"
            size="small"
            style="width: 100px"
        />
        <a-input
            v-model="nameSearchInput"
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
                  @click="() => (currentAudio = item)"
              >
                <div style="display: flex; justify-content: center; align-items: center">
                  <div style="width: 40%; text-align: left">
                    <div v-if="item.avatar">
                      <a-avatar :image-url="item.avatar"
                      />
                    </div>
                    <div v-else>
                      <a-avatar>
                        <span>{{ voiceNameFormat(item.shortName) }}</span>
                      </a-avatar>
                    </div>
                  </div>
                  <div style="width: 60%; margin-left: 10px">
                    <a-space direction="vertical" style="width: 100%">
                      <a-tag color="blue" style="display: block; width: 100%">
                        {{ item.gender === 'Male' ? '男' : item.gender === 'Female' ? '女' : item.gender }}
                      </a-tag>
                      <a-tag color="cyan" style="display: block; width: 100%">
                        <a-typography-text ellipsis>
                          {{ item.locale ?? '未知' }}
                        </a-typography-text>
                      </a-tag>
                    </a-space>
                  </div>
                </div>
                <div style="margin-top: 5px; text-align: left">
                  <a-typography-text ellipsis>
                    {{ voiceNameFormat(item.shortName) }}
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
        v-if="currentAudio?.shortName"
        style="width: 40%"
    >
      <div>
        <div style="display: flex; align-items: center">
          <div v-if="currentAudio?.avatar">
            <a-avatar :image-url="currentAudio?.avatar"
            />
          </div>
          <div v-else>
            <a-avatar>
              <span>{{ voiceNameFormat(currentAudio?.shortName) }}</span>
            </a-avatar>
          </div>
          <div style="margin-left: 20px">
            <a-descriptions size="small" :title="voiceNameFormat(currentAudio?.shortName)" :column="2">
              <a-descriptions-item label="性别">
                {{ currentAudio?.gender }}
              </a-descriptions-item>
              <a-descriptions-item label="语言">
                {{ currentAudio?.locale }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>
      </div>
      <a-divider/>
      <div
          style="display: flex; align-items: center; padding: 0 5px 5px 0">
        <div v-if="currentAudio?.avatar">
          <a-avatar :image-url="currentAudio?.avatar"
          />
        </div>
        <div v-else>
          <a-avatar>
            <span>{{ voiceNameFormat(currentAudio.shortName) }}</span>
          </a-avatar>
        </div>
        <div style="margin-left: 20px; width: 100%">
          <div style="display: flex;justify-content: space-between; align-items: center">
            <a-space size="small">
              <div>
                <span>{{ voiceNameFormat(currentAudio.shortName) }}</span>
              </div>
              <div>
                <a-button
                    v-if="activeAudioKey === currentAudio.shortName"
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
                    :loading="loading"
                    @click.stop="playAudio(currentAudio)"
                >
                  <icon-play-arrow/>
                </a-button>
              </div>
              <a-dropdown
                  position="br"
                  popup-container="select-view"
              >
                <a-button
                    v-if="currentAudio.url"
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
                            {{ currentAudio.text }}
                          </a-typography-paragraph>
                        </div>
                      </div>
                      <div style="width: 10%">
                        <a-button
                            v-if="activeAudioKey === currentAudio.shortName"
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
                            @click.stop="playAudio(currentAudio)"
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