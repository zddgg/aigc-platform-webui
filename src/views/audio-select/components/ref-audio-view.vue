<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {Mood, queryRefAudios, RefAudio} from "@/api/ref-audio.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {CascaderOption} from "naive-ui";
import {configs as queryGsvConfigs, GptSovitsModel, models as queryGsvModels} from "@/api/gpt-sovits.ts";
import {configs as queryFsConfigs, FishSpeechModel, models as queryFsModels} from "@/api/fish-speech.ts";
import {AudioModelConfig} from "@/api/model.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";

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

const refAudios = ref<RefAudio[]>([])
const currentAudio = ref<RefAudio>({} as RefAudio)
const modelDataOptions = ref<CascaderOption[]>([]);

const modelType = ref<string>('');
const currentModel = ref<string[]>([])
const configId = ref<string>('');

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

const handleQueryRefAudios = async () => {
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


const handleQueryModels = async () => {
  const gsvRes = await queryGsvModels();
  const fsRes = await queryFsModels();
  modelDataOptions.value = [
    {
      label: 'gpt-sovits',
      value: 'gpt-sovits',
      children: gsvRes.data.reduce((acc: any, item) => {
        const {modelGroup} = item;
        let groupItem = acc.find((g: GptSovitsModel) => g.modelGroup === modelGroup);
        if (!groupItem) {
          groupItem = {modelGroup, list: []} as any;
          acc.push(groupItem);
        }
        groupItem.list.push(item);
        return acc;
      }, [])
          .map((item: any) => {
            return {
              value: item.modelGroup,
              children: item.list.map((item1: GptSovitsModel) => {
                return {
                  label: item1.modelName,
                  value: item1.modelId
                };
              }),
            };
          })
    },
    {
      label: 'fish-speech',
      value: 'fish-speech',
      children: fsRes.data.reduce((acc: any, item) => {
        const {modelGroup} = item;
        let groupItem = acc.find((g: FishSpeechModel) => g.modelGroup === modelGroup);
        if (!groupItem) {
          groupItem = {modelGroup, list: []} as any;
          acc.push(groupItem);
        }
        groupItem.list.push(item);
        return acc;
      }, [])
          .map((item: any) => {
            return {
              value: item.modelGroup,
              children: item.list.map((item1: FishSpeechModel) => {
                return {
                  label: item1.modelName,
                  value: item1.modelId
                };
              }),
            };
          })
    }
  ]
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

const gsvConfigs = ref<SelectOptionData[]>([])
const fsConfigs = ref<SelectOptionData[]>([])

const handleQueryConfigs = async () => {
  gsvConfigs.value = (await queryGsvConfigs())
      .data
      .map(item => {
        return {
          label: item.configName,
          value: item.configId,
          type: 'gpt-sovits',
          ...item
        }
      });
  fsConfigs.value = (await queryFsConfigs())
      .data
      .map(item => {
        return {
          label: item.configName,
          value: item.configId,
          type: 'fish-speech',
          ...item
        }
      });
}

const onModelChange = (value: any) => {
  if (modelType.value !== (value as string[])[0]) {
    modelType.value = (value as string[])[0]
    configId.value = '-1'
  }
}

const computedConfigs = computed(() => {
  const arr = modelType.value === 'gpt-sovits' ? gsvConfigs.value : fsConfigs.value;
  return [{label: '空-API服务端配置', value: '-1'}, ...arr];
})

const onAudioCardSelect = (refAudio: RefAudio) => {
  currentAudio.value = refAudio;
  if (!modelType.value) {
    modelType.value = 'gpt-sovits';
  }
  if (!currentModel.value || !currentModel.value.length) {
    currentModel.value = [
      modelDataOptions.value[0].value as string,
      (modelDataOptions.value[0].children as any)[0].value as string,
      ((modelDataOptions.value[0].children as any)[0].children as any)[0].value as string
    ]
  }
  if (!configId.value) {
    configId.value = gsvConfigs.value[0].value as string;
  }
}

const modelSelect = (mood: Mood) => {
  if (!mood.currentMoodAudio || !mood.currentMoodAudio.name) {
    mood.currentMoodAudio = mood.moodAudios[0]
  }

  const audioModelConfig: AudioModelConfig = {
    audioModelType: modelType.value,
    audioModelId: currentModel.value[2],
    audioConfigId: configId.value,
    refAudioId: mood.currentMoodAudio.id,
  }

  emits('modelSelect', audioModelConfig)
}


watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryRefAudios();
        await handleQueryModels();
        await handleQueryConfigs();

        if (props.activeTabKey === '1' && props.audioModelConfig) {
          modelType.value = props.audioModelConfig?.audioModelType as string;
          modelDataOptions.value.forEach(item => {
            if (item.value === modelType.value) {
              item.children?.forEach((item1) => {
                item1.children?.forEach((item2) => {
                  if (item2.value === props.audioModelConfig?.audioModelId) {
                    currentModel.value = [item.value as string, item1.value as string, item2.value as string];
                  }
                })
              })
            }
          })
          configId.value = props.audioModelConfig?.audioConfigId as string
          refAudios.value.forEach((item) => {
            item.moods.forEach((item1) => {
              item1.moodAudios.forEach((item2) => {
                if (item2.id === props.audioModelConfig?.refAudioId) {
                  currentAudio.value = item;
                }
              })
            })
          })
        }
      }
    },
    {immediate: true}
)

watch(
    () => props.activeTabKey,
    () => {
      if (props.activeTabKey !== '1') {
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
                  @click="onAudioCardSelect(item)"
              >
                <div style="display: flex; justify-content: center; align-items: center">
                  <div style="width: 50%; text-align: center">
                    <div v-if="item.avatarUrl">
                      <a-avatar :image-url="item.avatarUrl"
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
          <div v-if="currentAudio?.avatarUrl">
            <a-avatar :image-url="currentAudio?.avatarUrl"
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
        <div
            v-if="currentAudio?.tags && currentAudio.tags.length"
            style="margin-left: 60px; height: 40px; display: flex; align-items: center"
        >
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
        <div v-if="currentAudio?.modelType !== 'edge-tts'" style="margin-left: 10px">
          <a-descriptions :column="1">
            <a-descriptions-item label="模型">
              <a-cascader
                  v-model="currentModel"
                  path-mode
                  size="small"
                  :options="modelDataOptions"
                  @change="onModelChange"
              />
            </a-descriptions-item>
            <a-descriptions-item label="配置">
              <a-select
                  v-model="configId"
                  size="small"
              >
                <a-option
                    v-for="(item, index) in computedConfigs"
                    :key="index"
                    :value="item.value"
                >
                  <span>
                    {{ item.label }}
                  </span>
                  <a-popover v-if="item.value !== '-1'" position="left">
                    <icon-eye style="margin-left: 10px"/>
                    <template #content>
                      <div v-if="item.type === 'gpt-sovits'">
                        <a-descriptions
                            :title="item.configName"
                            :column="2"
                            bordered
                            layout="inline-vertical"
                        >
                          <a-descriptions-item label="top_K">
                            {{ item.topK }}
                          </a-descriptions-item>
                          <a-descriptions-item label="top_P">
                            {{ item.topP }}
                          </a-descriptions-item>
                          <a-descriptions-item label="temperature">
                            {{ item.temperature }}
                          </a-descriptions-item>
                          <a-descriptions-item label="repetitionPenalty">
                            {{ item.repetitionPenalty }}
                          </a-descriptions-item>
                          <a-descriptions-item label="batchSize">
                            {{ item.batchSize }}
                          </a-descriptions-item>
                          <a-descriptions-item label="parallelInfer">
                            {{ item.parallelInfer }}
                          </a-descriptions-item>
                          <a-descriptions-item label="splitBucket">
                            {{ item.splitBucket }}
                          </a-descriptions-item>
                          <a-descriptions-item label="seed">
                            {{ item.seed }}
                          </a-descriptions-item>
                          <a-descriptions-item label="textSplitMethod">
                            {{ item.textSplitMethod }}
                          </a-descriptions-item>
                          <a-descriptions-item label="fragmentInterval">
                            {{ item.fragmentInterval }}
                          </a-descriptions-item>
                          <a-descriptions-item label="speedFactor">
                            {{ item.speedFactor }}
                          </a-descriptions-item>
                        </a-descriptions>
                      </div>
                      <div v-if="item.type === 'fish-speech'">
                        <a-descriptions
                            :title="item.configName"
                            :column="2"
                            bordered
                            layout="inline-vertical"
                        >
                          <a-descriptions-item label="top_P">
                            {{ item.topP }}
                          </a-descriptions-item>
                          <a-descriptions-item label="temperature">
                            {{ item.temperature }}
                          </a-descriptions-item>
                          <a-descriptions-item label="repetitionPenalty">
                            {{ item.repetitionPenalty }}
                          </a-descriptions-item>
                        </a-descriptions>
                      </div>
                    </template>
                  </a-popover>
                </a-option>
              </a-select>
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
      <a-divider style="margin: 10px 0"/>
      <n-scrollbar :style="{height: `${360-(currentAudio?.tags && currentAudio.tags.length ? 40 : 0)}px`}">
        <div style="margin-right: 10px">
          <a-space direction="vertical" style="width: 100%">
            <div
                v-if="currentAudio?.moods"
                v-for="(item, index) in currentAudio.moods"
                :key="index"
                style="display: flex; align-items: center; padding: 0 5px 10px 0; border-bottom: 1px solid #cccccc">
              <div v-if="item?.avatarUrl ?? currentAudio?.avatarUrl">
                <a-avatar :image-url="item?.avatarUrl ?? currentAudio?.avatarUrl"
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
                            item.currentMoodAudio.audioUrl
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
                                <a-space v-if="item1.tags && item1.tags.length" wrap>
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
                                  @click.stop="playAudio(`${currentAudio.group}-${currentAudio.name}-${item.name}-${item1.name}`, item1.audioUrl)"
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