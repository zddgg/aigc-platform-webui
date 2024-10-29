<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import AudioDetail from "@/views/model/prompt-audio/components/AudioDetail.vue";
import GroupSort from "@/views/model/prompt-audio/components/GroupSort.vue";
import {PromptAudio, queryPromptAudios} from "@/api/prompt-audio.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {LangDict, queryLangDicts} from "@/api/dict.ts";

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const activateKey = ref<string>('');
const audioDetailVisible = ref(false);
const audios = ref<PromptAudio[]>([])
const currentAudio = ref<PromptAudio>({} as PromptAudio)
const groupOptions = ref<string[]>([])
const genderOptions = ref<string[]>([])
const selectGender = ref<string>('')
const ageGroupOptions = ref<string[]>([])
const selectAgeGroup = ref<string>('')
const languageOptions = ref<string[]>([])
const selectLanguage = ref<string>('')
const tagOptions = ref<string[]>([])
const selectTag = ref<string>('')

const activeAudioKey = ref<string>('')

const groupSortVisible = ref<boolean>(false)

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

const computedAudios = computed(() => {
  let tmp = audios.value;
  if (activateKey.value !== '全部') {
    tmp = tmp.filter(item => item.paGroup === activateKey.value)
  }
  if (selectGender.value) {
    tmp = tmp.filter(item => item.paRoleGender === selectGender.value)
  }
  if (selectAgeGroup.value) {
    tmp = tmp.filter(item => item.paRoleAge === selectAgeGroup.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => item.paRoleLang === selectLanguage.value
        || item.paMoods.flatMap(value =>
            value.paAudios.flatMap(value1 =>
                value1.paAudioTags)).includes(selectLanguage.value))
  }
  if (selectTag.value) {
    tmp = tmp.filter(item => item.paRoleTags?.includes(selectTag.value)
        || item.paMoods.flatMap(value =>
            value.paAudios.flatMap(value1 =>
                value1.paAudioTags)).includes(selectTag.value))
  }

  return Object.entries(tmp.reduce((result: any, item: PromptAudio) => {
    if (!result[item.paGroup]) {
      result[item.paGroup] = [];
    }
    result[item.paGroup].push(item);
    return result;
  }, {})).map(([group, items]) => ({group: group, list: items} as { group: string, list: PromptAudio[] }));
})

const editAudio = (audio: PromptAudio) => {
  currentAudio.value = audio;
  audioDetailVisible.value = true;
  stopAudio();
}

const handleQueryAudios = async () => {
  const {data} = await queryPromptAudios();
  audios.value = data;
  groupOptions.value = ['全部', ...new Set(data.filter((item) => !!item.paGroup).map((item) => item.paGroup))]
  genderOptions.value = [...new Set(data.filter((item) => !!item.paRoleGender).map((item) => item.paRoleGender))]
  ageGroupOptions.value = [...new Set(data.filter((item) => !!item.paRoleAge).map((item) => item.paRoleAge))]
  languageOptions.value = [...new Set(data.filter((item) => !!item.paRoleLang).map((item) => item.paRoleLang))]
  const audioTags = data.flatMap(item => item.paRoleTags).filter(item => !!item);
  const moodAudioTags = data
      .flatMap(item => item.paMoods
          .flatMap(mood => mood.paAudios
              .flatMap(moodAudio => moodAudio.paAudioTags))).filter(item => !!item);
  const res = [...audioTags, ...moodAudioTags]
  tagOptions.value = [...new Set(res)]
  activateKey.value = groupOptions.value[0];
}

const reset = () => {
  selectGender.value = '';
  selectAgeGroup.value = '';
  selectLanguage.value = '';
  selectTag.value = '';
}

const langDicts = ref<LangDict[]>([])

const handleLangDicts = async () => {
  const {data} = await queryLangDicts()
  langDicts.value = data;
}

onMounted(() => {
  handleQueryAudios();
  handleLangDicts()
})
</script>

<template>
  <div>
    <a-card :bordered="false">
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
            v-model="selectAgeGroup"
            placeholder="年龄"
            allow-clear
            :options="ageGroupOptions"
            style="width: 200px"
        >
        </a-select>
        <a-select
            v-model="selectLanguage"
            placeholder="语言"
            allow-clear
            :options="languageOptions"
            style="width: 200px"
        >
        </a-select>
        <a-select
            v-model="selectTag"
            placeholder="标签"
            allow-clear
            :options="tagOptions"
            style="width: 200px"
        >
        </a-select>
        <a-button @click="reset">重置</a-button>
      </a-space>
    </a-card>
    <div>
      <n-tabs v-model:value="activateKey" type="card" size="small" animated>
        <template #suffix>
          <a-space>
            <a-button
                type="outline"
                style="margin-right: 20px"
                size="small"
                @click="() => (groupSortVisible = true)"
            >
              群组管理
            </a-button>
          </a-space>
        </template>
        <n-tab-pane v-for="(item) in groupOptions" :name="item" :tab="item">
          <a-space size="medium" wrap align="start">
            <a-card
                v-for="(item1, index1) in computedAudios.flatMap((value : any) => value.list)"
                :key="index1"
                hoverable
                style="width: 360px;"
            >
              <div style="display: flex">
                <div>
                  <a-avatar v-if="item1.paRoleAvatar" :image-url="item1.paRoleAvatar"/>
                  <a-avatar v-else>
                    {{ item1.paGroup === 'edge-tts' ? voiceNameFormat(item1.paRole) : item1.paRole }}
                  </a-avatar>
                </div>
                <div style="margin-left: 20px">
                  <a-descriptions :column="2">
                    <template #title>
                      {{ item1.paGroup === 'edge-tts' ? voiceNameFormat(item1.paRole) : item1.paRole }}
                    </template>
                    <a-descriptions-item label="群组">
                      {{ item1.paGroup }}
                    </a-descriptions-item>
                    <a-descriptions-item label="性别">
                      {{ item1.paRoleGender ?? '未知' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="年龄">
                      {{ item1.paRoleAge ?? '未知' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="语言">
                      {{
                        langDicts.find((item2 : any) => item2.enName === item1.paRoleLang)?.zhName ?? item1.paRoleLang ?? '未知'
                      }}
                    </a-descriptions-item>
                  </a-descriptions>
                </div>
              </div>
              <div v-if="item1.paRoleTags && item1.paRoleTags.length">
                <a-space wrap>
                  <a-tag
                      v-for="(item2, index2) in item1.paRoleTags"
                      :key="index2"
                      size="small"
                      color="blue"
                  >
                    {{ item2 }}
                  </a-tag>
                </a-space>
              </div>
              <div>
                <a-space wrap>
                  <div
                      v-for="(item2, index2) in item1.paMoods"
                      :key="index2"
                  >
                    <a-dropdown>
                      <a-button size="small" type="outline">
                        {{ `${item2.paMood}(${item2.paAudios?.length})` }}
                      </a-button>
                      <template #content>
                        <a-doption v-for="(item3, index3) in item2.paAudios"
                                   :key="index3">
                          <div
                              style="
                              width: 500px;
                              display: flex;
                              justify-content: space-between;
                              align-items: center"
                              :style="index3 !== item2.paAudios.length - 1 && { borderBottom: '1px #cccccc solid' }"
                          >
                            <div style="width: 90%">
                              <div>
                                <a-typography-paragraph style="margin: 0">
                                  {{ item3.paAudioText }}
                                </a-typography-paragraph>
                              </div>
                              <div>
                                <a-space v-if="item3.paAudioTags && item3.paAudioTags.length" wrap>
                                  <a-tag
                                      v-for="(item4, index4) in item3.paAudioTags"
                                      :key="index4"
                                      size="small"
                                      color="blue"
                                  >
                                    {{ item4 }}
                                  </a-tag>
                                </a-space>
                              </div>
                            </div>
                            <div style="width: 10%">
                              <a-button
                                  v-if="activeAudioKey === `${item}-${item1.paRole}-${item2.paMood}-${item3.paAudio}`"
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
                                  @click.stop="playAudio(
                                      `${item}-${item1.paRole}-${item2.paMood}-${item3.paAudio}`,
                                      item3.audioUrl
                                  )"
                              >
                                <icon-play-arrow/>
                              </a-button>
                            </div>
                          </div>
                        </a-doption>
                      </template>
                    </a-dropdown>
                  </div>
                </a-space>
              </div>
              <a-divider style="margin: 10px 0"/>
              <div style="text-align: right">
                <a-button size="small" type="primary" @click="editAudio(item1)">编辑</a-button>
              </div>
            </a-card>
          </a-space>
        </n-tab-pane>
      </n-tabs>
    </div>
    <audio-detail
        v-model:visible="audioDetailVisible"
        :prompt-audio="currentAudio"
        @success="handleQueryAudios"
    />
    <group-sort
        v-model:visible="groupSortVisible"
        @change="handleQueryAudios"
    />
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
:deep(.arco-tabs-tab-active) {
  background-color: #ffffff;
}

:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>