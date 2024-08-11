<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {
  AmModelConfig,
  getByModelType as queryModelConfigs,
  playOrCreateAudio,
  updateConfig
} from "@/api/am-model-config.ts";
import {EDGE_TTS} from "@/types/model-types.ts";
import useLoading from "@/hooks/loading.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import {LangDict, queryLangDicts} from "@/api/dict.ts";
import {TableColumnData} from "@arco-design/web-vue";

const {loading, setLoading} = useLoading();

const modelConfigs = ref<(AmModelConfig & { edit: boolean })[]>([])
const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素
const activeAudioKey = ref<string>('')
const createAudioKey = ref('')

const selectGender = ref<string>('')
const genderOptions = ref<SelectOptionData[]>([])
const selectLanguage = ref<string>('')
const voiceNameInput = ref<string>('')

const columns: TableColumnData[] = [
  {title: '名称', slotName: 'shortName'},
  {title: '性别', slotName: 'gender'},
  {title: '区域', slotName: 'locale'},
  {title: '是否展示', slotName: 'showFlag'},
  {title: '操作', slotName: 'operations'},
]

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: EDGE_TTS, showMode: -1})
  modelConfigs.value = data as any;
}

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
  } catch (e){
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

const handleConfigUpdate = async (modelConfig: AmModelConfig & { edit: boolean }) => {
  await updateConfig(modelConfig)
  modelConfig.edit = false;
}

const configRefresh = () => {
  handleQueryModelConfigs()
}

defineExpose({configRefresh})

onMounted(async () => {
  await handleQueryModelConfigs();
  await handleLangDicts();
  computedGender();
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
            allow-search
            :options="genderOptions"
            style="width: 200px"
        >
        </a-select>
        <a-select
            v-model="selectLanguage"
            placeholder="语言"
            allow-clear
            allow-search
            :options="langDicts"
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
      <a-empty v-if="!computedVoices || !computedVoices.length"/>
      <a-table
          v-else
          :data="computedVoices"
          :columns="columns"
          :bordered="{cell:true}"
          :pagination="false"
      >
        <template #shortName="{ record }">
          {{ JSON.parse(record.mcParamsJson).shortName }}
        </template>
        <template #gender="{ record }">
          {{
            JSON.parse(record.mcParamsJson).gender === 'Male'
                ? '男'
                : JSON.parse(record.mcParamsJson).gender === 'Female'
                    ? '女'
                    : JSON.parse(record.mcParamsJson).gender
          }}
        </template>
        <template #locale="{ record }">
          {{ JSON.parse(record.mcParamsJson).locale }}
        </template>

        <template #showFlag="{ record }">
          <a-switch
              v-if="!record.edit"
              :model-value="record.showFlag"
              checked-text="是"
              unchecked-text="否"
              type="round"
          />
          <a-switch
              v-else
              v-model="record.showFlag"
              checked-text="是"
              unchecked-text="否"
              type="round"
          />
        </template>
        <template #operations="{ record }">
          <a-space>
            <div>
              <a-button
                  v-if="!record.edit"
                  size="small"
                  @click="record.edit = true"
              >
                <icon-edit/>
              </a-button>
              <a-button
                  v-else
                  type="outline"
                  size="small"
                  @click="handleConfigUpdate(record)"
              >
                <icon-check/>
              </a-button>
            </div>
            <div>
              <a-button
                  v-if="activeAudioKey === record.mcName"
                  type="outline"
                  status="danger"
                  size="small"
                  @click="stopAudio"
              >
                <icon-mute-fill/>
              </a-button>
              <a-button
                  v-else
                  type="outline"
                  size="small"
                  :disabled="createAudioKey === record.mcName && loading"
                  @click="playAudio(record)"
              >
                <icon-refresh
                    v-if="createAudioKey === record.mcName && loading"
                    :spin="createAudioKey === record.mcName && loading"
                />
                <icon-play-arrow v-else/>
              </a-button>
            </div>
          </a-space>
        </template>
      </a-table>
    </div>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>

</style>