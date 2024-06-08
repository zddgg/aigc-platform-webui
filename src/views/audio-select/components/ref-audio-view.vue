<script setup lang="ts">
import {computed, onMounted, PropType, ref, watch} from "vue";
import {Mood, queryRefAudios, RefAudio} from "@/api/ref-audio.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {CascaderOption} from "naive-ui";
import {queryModels as queryGsvModels} from "@/api/gpt-sovits.ts";
import {queryModels as queryFsModels} from "@/api/fish-speech.ts";
import {Model, ModelConfig} from "@/api/model.ts";

const props = defineProps({
  activeTabKey: {
    type: String,
  },
  modelConfig: {
    type: Object as PropType<ModelConfig>
  }
})

const emits = defineEmits(['modelSelect'])

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const refAudios = ref<RefAudio[]>([])
const currentAudio = ref<RefAudio>({} as RefAudio)
const modelDataOptions = ref<CascaderOption[]>([]);
const currentModel = ref<string[]>([])

const groupOptions = ref<string[]>([])
const selectGroup = ref<string>('')
const genderOptions = ref<string[]>([])
const selectGender = ref<string>('')
const ageGroupOptions = ref<string[]>([])
const selectAgeGroup = ref<string>('')
const languageOptions = ref<string[]>([])
const selectLanguage = ref<string>('')
const tagOptions = ref<string[]>([])
const selectTag = ref<string>('')

const computedRefAudios = computed(() => {
  let tmp = refAudios.value;
  if (selectGroup.value) {
    tmp = tmp.filter(item => item.group === selectGroup.value);
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

  return tmp;
});

const handleQueryRefAudio = async () => {
  const {data} = await queryRefAudios();
  refAudios.value = data.map(item => {
    return {
      ...item,
      moods: item.moods.map(item1 => {
        return {
          ...item1,
          currentMoodAudio: item1.moodAudios[0]
        }
      })
    }
  });

  groupOptions.value = Array.from(new Set(data.map(item => item.group).filter(item => !!item)))
  genderOptions.value = Array.from(new Set(data.map(item => item.gender).filter(item => !!item)))
  ageGroupOptions.value = Array.from(new Set(data.map(item => item.ageGroup).filter(item => !!item)))
  languageOptions.value = Array.from(new Set(data.map(item => item.language).filter(item => !!item)))
  const audioTags = data.flatMap(item => item.tags).filter(item => !!item);
  const moodAudioTags = data
      .flatMap(item => item.moods
          .flatMap(mood => mood.moodAudios
              .flatMap(moodAudio => moodAudio.tags))).filter(item => !!item);
  const res = [...audioTags, ...moodAudioTags]
  tagOptions.value = [...new Set(res)]
}


const handleQueryModel = async () => {
  const gsvRes = await queryGsvModels();
  const fsRes = await queryFsModels();
  modelDataOptions.value = [
    {
      label: 'gpt-sovits',
      value: 'gpt-sovits',
      children: gsvRes.data.reduce((acc: any, item) => {
        const {group} = item;
        let groupItem = acc.find((g: Model) => g.group === group);
        if (!groupItem) {
          groupItem = {group, list: []} as any;
          acc.push(groupItem);
        }
        groupItem.list.push(item);
        return acc;
      }, [])
          .map((item: any) => {
            return {
              value: item.group,
              children: item.list.map((item1: any) => {
                return {value: item1.name};
              }),
            };
          })
    },
    {
      label: 'fish-speech',
      value: 'fish-speech',
      children: fsRes.data.reduce((acc: any, item) => {
        const {group} = item;
        let groupItem = acc.find((g: Model) => g.group === group);
        if (!groupItem) {
          groupItem = {group, list: []} as any;
          acc.push(groupItem);
        }
        groupItem.list.push(item);
        return acc;
      }, [])
          .map((item: any) => {
            return {
              value: item.group,
              children: item.list.map((item1: any) => {
                return {value: item1.name};
              }),
            };
          })
    }
  ]

  const filterElement = modelDataOptions.value.find(item => item.value === 'gpt-sovits');
  currentModel.value = [
    'gpt-sovits',
    (filterElement?.children as any)[0].value,
    (filterElement?.children as any)[0].children[0]?.value
  ];
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

const modelSelect = (mood: Mood) => {
  if (!mood.currentMoodAudio || !mood.currentMoodAudio.name) {
    mood.currentMoodAudio = mood.moodAudios[0]
  }
  const modelConfig: ModelConfig = {
    modelType: currentModel.value[0],
    model: [currentModel.value[1], currentModel.value[2]],
    audio: [currentAudio.value.group, currentAudio.value.name, mood.name, mood.currentMoodAudio.name]
  }
  emits('modelSelect', modelConfig);
}

onMounted(() => {
  handleQueryRefAudio();
  handleQueryModel();
})

watch(
    () => props.activeTabKey,
    () => {
      if (props.activeTabKey !== '1') {
        stopAudio();
      }
      if (props.activeTabKey === '1') {
        if (props.modelConfig && props.modelConfig?.model && props.modelConfig?.model.length > 1) {
          currentModel.value = [props.modelConfig?.modelType, props.modelConfig?.model[0], props.modelConfig?.model[1]];
        }
        if (props.modelConfig && props.modelConfig?.audio && props.modelConfig?.audio.length > 0) {
          const audio = props.modelConfig?.audio;
          const find = refAudios.value.find(item => item.group === audio[0] && item.name === audio[1]);
          if (find) {
            currentAudio.value = {
              ...find,
              moods: find.moods.map(item1 => {
                return {
                  ...item1,
                  currentMoodAudio: item1.moodAudios[0]
                }
              })
            };
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
        <a-select
            v-model="selectGroup"
            :options="groupOptions"
            allow-clear
            placeholder="群组"
            size="small"
            style="width: 100px"
        />
        <a-select
            v-model="selectGender"
            :options="genderOptions"
            allow-clear
            placeholder="性别"
            size="small"
            style="width: 100px"
        />
        <a-select
            v-model="selectAgeGroup"
            :options="ageGroupOptions"
            allow-clear
            placeholder="年龄"
            size="small"
            style="width: 100px"
        />
        <a-select
            v-model="selectLanguage"
            :options="languageOptions"
            allow-clear
            placeholder="语言"
            size="small"
            style="width: 100px"
        />
        <a-select
            v-model="selectTag"
            :options="tagOptions"
            allow-clear
            placeholder="标签"
            size="small"
            style="width: 100px"
        />
      </a-space>
      <n-scrollbar style="height: 500px; margin-top: 10px">
        <div style="margin-right: 10px">
          <a-grid :cols="3" :col-gap="10" :row-gap="10">
            <a-grid-item
                v-for="(item, index) in computedRefAudios"
                :key="index"
            >
              <a-card
                  hoverable
                  :body-style="{padding: '10px'}"
                  style="border: 1px #ccc solid; border-radius: 8px"
                  @click="() => currentAudio = item"
              >
                <div style="display: flex; justify-content: center; align-items: center">
                  <div style="width: 50%; text-align: center">
                    <div v-if="item.avatar">
                      <a-avatar :image-url="item.avatar"
                      />
                    </div>
                    <div v-else>
                      <a-avatar>
                        <span>{{ voiceNameFormat(item.name) }}</span>
                      </a-avatar>
                    </div>
                    <div style="text-align: center; margin-top: 5px">
                      <a-typography-text ellipsis>
                        {{ item.group === 'edge-tts' ? voiceNameFormat(item.name) : item.name }}
                      </a-typography-text>
                    </div>
                  </div>
                  <div style="width: 50%; margin-left: 10px">
                    <a-space direction="vertical" style="width: 100%">
                      <a-tag color="blue" style="display: block; width: 100%">
                        {{ item.gender ?? '未知' }}
                      </a-tag>
                      <a-tag color="green" style="display: block; width: 100%">
                        {{ item.ageGroup ?? '未知' }}
                      </a-tag>
                      <a-tag color="cyan" style="display: block; width: 100%">
                        <a-typography-text ellipsis>
                          {{ item.language ?? '未知' }}
                        </a-typography-text>
                      </a-tag>
                    </a-space>
                  </div>
                </div>
              </a-card>
            </a-grid-item>
          </a-grid>
        </div>
      </n-scrollbar>
    </div>
    <a-divider direction="vertical"/>
    <div
        v-if="currentAudio?.name"
        style="width: 40%">
      <div>
        <div style="display: flex; align-items: center">
          <div v-if="currentAudio?.avatar">
            <a-avatar :image-url="currentAudio?.avatar"
            />
          </div>
          <div v-else>
            <a-avatar>
              <span>{{ voiceNameFormat(currentAudio?.name) }}</span>
            </a-avatar>
          </div>
          <div style="margin-left: 20px">
            <a-descriptions size="small" :title="voiceNameFormat(currentAudio?.name)" :column="2">
              <a-descriptions-item label="群组">
                {{ currentAudio?.group }}
              </a-descriptions-item>
              <a-descriptions-item label="性别">
                {{ currentAudio?.gender }}
              </a-descriptions-item>
              <a-descriptions-item label="年龄">
                {{ currentAudio?.ageGroup }}
              </a-descriptions-item>
              <a-descriptions-item label="语言">
                {{ currentAudio?.language }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>
        <div v-if="currentAudio?.tags" style="margin: 5px 0 0 60px">
          <a-space wrap>
            <a-tag
                v-for="(item, index) in currentAudio?.tags"
                :key="index"
                color="blue"
            >
              {{ item }}
            </a-tag>
          </a-space>
        </div>
        <div v-if="currentAudio?.modelType !== 'edge-tts'" style="margin: 5px 0 0 10px">
          <a-descriptions :column="2">
            <a-descriptions-item label="模型">
              <a-cascader
                  v-model="currentModel"
                  path-mode
                  size="small"
                  :options="modelDataOptions"
              />
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
      <a-divider style="margin: 10px 0"/>
      <n-scrollbar style="height: 390px">
        <div style="margin-right: 10px">
          <a-space direction="vertical" style="width: 100%">
            <div
                v-if="currentAudio?.moods"
                v-for="(item, index) in currentAudio.moods"
                :key="index"
                style="display: flex; align-items: center; padding: 0 5px 10px 0; border-bottom: 1px solid #cccccc">
              <div v-if="item?.avatar ?? currentAudio?.avatar">
                <a-avatar :image-url="item?.avatar ?? currentAudio?.avatar"
                />
              </div>
              <div v-else>
                <a-avatar>
                  <span>{{ currentAudio.name }}</span>
                </a-avatar>
              </div>
              <div style="margin-left: 20px; width: 100%">
                <div style="display: flex;justify-content: space-between; align-items: center">
                  <a-space size="small">
                    <div>
                      <span>{{ item.name }}</span>
                    </div>
                    <div>
                      <a-button
                          v-if="activeAudioKey === `${currentAudio.group}-${currentAudio.name}-${item.name}-${item.currentMoodAudio.name}`"
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
                          @click="playAudio(
                            `${currentAudio.group}-${currentAudio.name}-${item.name}-${item.currentMoodAudio.name}`,
                            item.currentMoodAudio.url
                            )"
                      >
                        <icon-play-arrow/>
                      </a-button>
                    </div>
                    <a-dropdown
                        position="br"
                        popup-container="select-view"
                    >
                      <a-button
                          v-if="item.moodAudios"
                          size="mini" type="outline"
                      >
                        更多音频
                        <icon-down/>
                      </a-button>
                      <template #content>
                        <a-doption
                            v-for="(item1, index1) in item.moodAudios"
                            :key="index1"
                            @click="() => {
                            stopAudio();
                            item.currentMoodAudio = item1;
                          }"
                        >
                          <div
                              style="
                                  width: 500px;
                                  display: flex;
                                  justify-content: space-between;
                                  align-items: center"
                              :style="index1 !== item.moodAudios.length - 1 && { borderBottom: '1px #cccccc solid' }"
                          >
                            <div style="width: 90%">
                              <div>
                                <a-typography-paragraph style="margin: 0">
                                  {{ item1.text }}
                                </a-typography-paragraph>
                              </div>
                              <div>
                                <a-space v-if="item1.tags" wrap>
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
                            </div>
                            <div style="width: 10%">
                              <a-button
                                  v-if="activeAudioKey === `${currentAudio.group}-${currentAudio.name}-${item.name}-${item1.name}`"
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
                                  @click.stop="playAudio(`${currentAudio.group}-${currentAudio.name}-${item.name}-${item1.name}`, item1.url)"
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
                    <a-button size="mini" type="primary" @click="modelSelect(item)">使用</a-button>
                  </div>
                </div>
              </div>
            </div>
          </a-space>
        </div>
      </n-scrollbar>
    </div>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
</style>