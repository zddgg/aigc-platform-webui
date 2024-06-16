<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import useLoading from "@/hooks/loading.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {
  EdgeTtsSetting,
  EdgeTtsConfig,
  playOrCreateAudio,
  settings as querySettings,
  configs as queryConfigs
} from "@/api/edge-tts.ts";

const {loading, setLoading} = useLoading();

const edgeTtsConfigs = ref<EdgeTtsConfig[]>([])
const edgeTtsSettings = ref<EdgeTtsSetting[]>([])

const selectGender = ref<string>('')
const genderOptions = ref<SelectOptionData[]>([])
const selectLanguage = ref<string>('')
const voiceNameInput = ref<string>('')

const handleQueryConfigs = async () => {
  const {data} = await queryConfigs()
  edgeTtsConfigs.value = data
  genderOptions.value = Array.from(new Set(data.map(item => item.gender)))
      .map(gender => ({
        label: gender === 'Male' ? '男' : gender === 'Female' ? '女' : gender,
        value: gender
      }));
}

const handleQuerySettings = async () => {
  const {data} = await querySettings()
  edgeTtsSettings.value = data;
}

const computedVoices = computed(() => {
  let tmp = edgeTtsConfigs.value;
  if (selectGender.value) {
    tmp = tmp.filter(item => item.gender === selectGender.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => item.locale.startsWith(selectLanguage.value))
  }
  if (voiceNameInput.value) {
    tmp = tmp.filter(item => item.shortName.substring(item.shortName.lastIndexOf('-') + 1)
        .replace('Neural', '').toLowerCase()
        .includes(voiceNameInput.value.toLowerCase()))
  }
  return tmp;
})

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const activeAudioKey = ref<string>('')

const createAudioKey = ref('')

const playAudio = async (key: string, url: string) => {
  if (!url) {
    try {
      createAudioKey.value = key;
      setLoading(true);
      const {data} = await playOrCreateAudio(key);
      url = data;
    } catch (error) {
      console.error('Error fetching audio URL:', error);
      // 错误处理逻辑
      return; // 如果出错，提前退出函数
    } finally {
      createAudioKey.value = '';
      setLoading(false);
    }
  }

  activeAudioKey.value = key;

  if (audioElement.value) {
    // 设置音频源
    audioElement.value.src = url;

    // 播放音频
    audioElement.value.play();
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

onMounted(() => {
  handleQueryConfigs();
  handleQuerySettings();
})
</script>

<template>
  <div>
    <a-card :bordered="false" :body-style="{padding: '0 0 15px'}">
      <a-space size="large">
        <a-select
            v-model="selectGender"
            placeholder="性别"
            allow-clear
            :options="genderOptions"
            style="width: 200px"
        >
        </a-select>
        <a-select
            v-model="selectLanguage"
            placeholder="语言"
            allow-clear
            :options="edgeTtsSettings.filter(item => item.showFlag)"
            :field-names="{value: 'enName', label: 'zhName'}"
            style="width: 200px"
        >
        </a-select>
        <a-input
            v-model="voiceNameInput"
            placeholder="搜索"
            allow-clear
            style="width: 200px"
        >
        </a-input>
      </a-space>
    </a-card>
    <div>
      <a-space wrap size="medium">
        <a-card
            v-for="(item, index) in computedVoices"
            :key="index"
            hoverable
            style="width: 300px"
        >
          <a-descriptions
              :column="1"
              bordered
          >
            <template #title>
              {{ voiceNameFormat(item.shortName) }}
            </template>
            <a-descriptions-item label="gender">
              {{ item.gender }}
            </a-descriptions-item>
            <a-descriptions-item label="locale">
              {{ item.locale }}
            </a-descriptions-item>
          </a-descriptions>
          <div style="margin-top: 10px; text-align: right">
            <a-button v-if="activeAudioKey === item.shortName"
                      type="outline"
                      status="danger"
                      @click="stopAudio"
            >
              <icon-play-arrow/>
            </a-button>
            <a-button
                v-else
                type="outline"
                :loading="createAudioKey === item.shortName && loading"
                @click="playAudio(item.shortName, item.url)"
            >
              <icon-play-arrow/>
            </a-button>
          </div>
        </a-card>
      </a-space>
    </div>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
</style>