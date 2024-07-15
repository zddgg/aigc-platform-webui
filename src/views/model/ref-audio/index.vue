<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import AudioDetail from "@/views/model/ref-audio/components/AudioDetail.vue";
import {queryRefAudios, RefAudio, refreshCache} from "@/api/ref-audio.ts";
import GroupSort from "@/views/model/ref-audio/components/GroupSort.vue";
import {Message} from "@arco-design/web-vue";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {LangDict, queryLangDicts} from "@/api/dict.ts";

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const activateKey = ref<string>('');
const audioDetailVisible = ref(false);
const audios = ref<RefAudio[]>([])
const currentAudio = ref<RefAudio>({} as RefAudio)
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
    tmp = tmp.filter(item => item.group === activateKey.value)
  }
  if (selectGender.value) {
    tmp = tmp.filter(item => item.gender === selectGender.value)
  }
  if (selectAgeGroup.value) {
    tmp = tmp.filter(item => item.ageGroup === selectAgeGroup.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => item.language === selectLanguage.value
        || item.moods.flatMap(value =>
            value.moodAudios.flatMap(value1 =>
                value1.tags)).includes(selectLanguage.value))
  }
  if (selectTag.value) {
    tmp = tmp.filter(item => item.tags?.includes(selectTag.value)
        || item.moods.flatMap(value =>
            value.moodAudios.flatMap(value1 =>
                value1.tags)).includes(selectTag.value))
  }

  return Object.entries(tmp.reduce((result: any, item: RefAudio) => {
    if (!result[item.group]) {
      result[item.group] = [];
    }
    result[item.group].push(item);
    return result;
  }, {})).map(([group, items]) => ({group: group, list: items} as { group: string, list: RefAudio[] }));
})

const editAudio = (audio: RefAudio) => {
  currentAudio.value = audio;
  audioDetailVisible.value = true;
  stopAudio();
}

const handleQueryAudios = async () => {
  const {data} = await queryRefAudios();
  audios.value = data;
  groupOptions.value = ['全部', ...new Set(data.filter((item) => !!item.group).map((item) => item.group))]
  genderOptions.value = [...new Set(data.filter((item) => !!item.gender).map((item) => item.gender))]
  ageGroupOptions.value = [...new Set(data.filter((item) => !!item.ageGroup).map((item) => item.ageGroup))]
  languageOptions.value = [...new Set(data.filter((item) => !!item.language).map((item) => item.language))]
  const audioTags = data.flatMap(item => item.tags).filter(item => !!item);
  const moodAudioTags = data
      .flatMap(item => item.moods
          .flatMap(mood => mood.moodAudios
              .flatMap(moodAudio => moodAudio.tags))).filter(item => !!item);
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

const handleRefresh = async () => {
  const {msg} = await refreshCache()
  await handleQueryAudios()
  Message.success(msg);
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
              排序配置
            </a-button>
            <a-popconfirm content="刷新缓存?" @ok="handleRefresh">
              <a-button
                  type="outline"
                  style="margin-right: 20px"
                  size="small"
              >
                刷新缓存
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
        <n-tab-pane v-for="(item) in groupOptions" :name="item" :tab="item">
          <a-space size="medium" wrap align="start">
            <a-card
                v-for="(item1, index1) in computedAudios.flatMap(value => value.list)"
                :key="index1"
                hoverable
                style="width: 350px;"
            >
              <div style="display: flex">
                <div>
                  <a-avatar v-if="item1.avatarUrl" :image-url="item1.avatarUrl"/>
                  <a-avatar v-else>
                    {{ item1.group === 'edge-tts' ? voiceNameFormat(item1.name) : item1.name }}
                  </a-avatar>
                </div>
                <div style="margin-left: 20px">
                  <a-descriptions :column="2">
                    <template #title>
                      {{ item1.group === 'edge-tts' ? voiceNameFormat(item1.name) : item1.name }}
                    </template>
                    <a-descriptions-item label="群组">
                      {{ item1.group }}
                    </a-descriptions-item>
                    <a-descriptions-item label="性别">
                      {{ item1.gender ?? '未知' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="年龄">
                      {{ item1.ageGroup ?? '未知' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="语言">
                      {{
                        langDicts.find((item2) => item2.enName === item1.language)?.zhName ?? item1.language ?? '未知'
                      }}
                    </a-descriptions-item>
                  </a-descriptions>
                </div>
              </div>
              <div v-if="item1.tags && item1.tags.length">
                <a-space wrap>
                  <a-tag
                      v-for="(item2, index2) in item1.tags"
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
                      v-for="(item2, index2) in item1.moods"
                      :key="index2"
                  >
                    <a-dropdown>
                      <a-button size="small" type="outline">
                        {{ `${item2.name}(${item2.moodAudios?.length})` }}
                      </a-button>
                      <template #content>
                        <a-doption v-for="(item3, index3) in item2.moodAudios"
                                   :key="index3">
                          <div
                              style="
                              width: 500px;
                              display: flex;
                              justify-content: space-between;
                              align-items: center"
                              :style="index3 !== item2.moodAudios.length - 1 && { borderBottom: '1px #cccccc solid' }"
                          >
                            <div style="width: 90%">
                              <div>
                                <a-typography-paragraph style="margin: 0">
                                  {{ item3.text }}
                                </a-typography-paragraph>
                              </div>
                              <div>
                                <a-space v-if="item3.tags && item3.tags.length" wrap>
                                  <a-tag
                                      v-for="(item4, index4) in item3.tags"
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
                                  v-if="activeAudioKey === `${item}-${item1.name}-${item2.name}-${item3.name}`"
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
                                      `${item}-${item1.name}-${item2.name}-${item3.name}`,
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
              <a-divider  style="margin: 10px 0" />
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
        :audio="currentAudio"
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