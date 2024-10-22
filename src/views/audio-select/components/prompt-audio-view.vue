<script setup lang="ts">
import {computed, onMounted, PropType, ref, watch} from "vue";
import {CascaderOption} from "naive-ui";
import {AudioModelInfoKey} from "@/api/model.ts";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import {LangDict, queryLangDicts} from "@/api/dict.ts";
import {PaMood, PromptAudio, queryPromptAudios} from "@/api/prompt-audio.ts";
import {AmModelFile, getByModelType as queryModelFiles} from "@/api/am-model-file.ts";
import {getByModelType as queryModelConfigs} from "@/api/am-model-config.ts";
import {FISH_SPEECH, GPT_SOVITS} from "@/types/model-types.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelType: {
    type: String,
  },
  activeTabKey: {
    type: String,
  },
  audioModelInfo: {
    type: Object as PropType<AudioModelInfoKey>
  },
  selectSize: {
    type: Number
  }
})

const emits = defineEmits(['modelSelect'])

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const refAudios = ref<PromptAudio[]>([])
const currentAudio = ref<PromptAudio>({} as PromptAudio)
const modelFileOptions = ref<CascaderOption[]>([]);

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
    tmp = tmp.filter(item => item.paGroup === selectGroup.value);
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
            value.paAudios.flatMap(value1 => value1.paAudioTags)).includes(selectLanguage.value))
  }
  if (selectTag.value) {
    tmp = tmp.filter(item => item.paRoleTags?.includes(selectTag.value)
        || item.paMoods.flatMap(value =>
            value.paAudios.flatMap(value1 => value1.paAudioTags)).includes(selectTag.value))
  }

  return tmp;
});

const handleQueryPromptAudios = async () => {
  const {data} = await queryPromptAudios();
  refAudios.value = data.map(item => {
    return {
      ...item,
      paMoods: item.paMoods.map(item1 => {
        return {
          ...item1,
          currentAudio: item1.paAudios[0]
        }
      })
    }
  });

  groupOptions.value = Array.from(new Set(data.map(item => item.paGroup).filter(item => !!item)))
  genderOptions.value = Array.from(new Set(data.map(item => item.paRoleGender).filter(item => !!item)))
  ageGroupOptions.value = Array.from(new Set(data.map(item => item.paRoleAge).filter(item => !!item)))
  languageOptions.value = Array.from(new Set(data.map(item => item.paRoleLang).filter(item => !!item)))
  const audioTags = data.flatMap(item => item.paRoleTags).filter(item => !!item);
  const moodAudioTags = data
      .flatMap(item => item.paMoods
          .flatMap(mood => mood.paAudios
              .flatMap(moodAudio => moodAudio.paAudioTags))).filter(item => !!item);
  const res = [...audioTags, ...moodAudioTags]
  tagOptions.value = [...new Set(res)]
}


const handleQueryModelFiles = async () => {
  const {data} = await queryModelFiles({modelType: props.modelType as string})
  modelFileOptions.value = data.reduce((acc: any, item) => {
    const {mfGroup} = item;
    let groupItem = acc.find((g: { group: string, list: [] }) => g.group === mfGroup);
    if (!groupItem) {
      groupItem = {group: mfGroup, list: []} as any;
      acc.push(groupItem);
    }
    groupItem.list.push(item);
    return acc;
  }, [])
      .map((item: any) => {
        return {
          label: item.group,
          value: item.group,
          children: item.list.map((item1: AmModelFile) => {
            return {
              label: item1.mfRole,
              value: item1.mfId
            };
          }),
        };
      })
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

const modelConfigs = ref<SelectOptionData[]>([])

const handleQueryModelConfigs = async () => {
  modelConfigs.value = (await queryModelConfigs({modelType: props.modelType as string}))
      .data
      .map(item => {
        return {
          label: item.mcName,
          value: item.mcId,
          ...item
        }
      });
}

const computedConfigs = computed(() => {
  return [{label: '空', value: '-1'}, ...modelConfigs.value];
})

const onAudioCardSelect = (refAudio: PromptAudio) => {
  currentAudio.value = refAudio;

  if (!currentModel.value || !currentModel.value.length) {
    if (!!modelFileOptions.value && !!modelFileOptions.value.length) {
      currentModel.value = [
        modelFileOptions.value[0].value as string,
        (modelFileOptions.value[0].children as any)[0].value as string
      ]
    }
  }
  if (!configId.value) {
    configId.value = '-1';
  }
}

const modelSelect = (mood: PaMood) => {
  if (!mood.currentAudio || !mood.currentAudio.paAudio) {
    mood.currentAudio = mood.paAudios[0]
  }

  const audioModelInfo: AudioModelInfoKey = {
    amType: props.modelType as string,
    amMfId: currentModel.value[1],
    amMcId: configId.value,
    amPaId: mood.currentAudio.paId,
  } as AudioModelInfoKey

  emits('modelSelect', audioModelInfo)
}

const langDicts = ref<LangDict[]>([])

const handleLangDicts = async () => {
  const {data} = await queryLangDicts()
  langDicts.value = data;
}

const getZhLang = (en: string) => {
  return langDicts.value.find((item) => en === item.enName)?.zhName ?? '未知';
}

onMounted(() => {
  handleLangDicts()
  handleQueryModelFiles();
  handleQueryPromptAudios();
  handleQueryModelConfigs();
})

watch(
    () => props.visible,
    async () => {
      if (props.visible) {

        if (props.activeTabKey === props.modelType as string && props.audioModelInfo) {

          if (props.audioModelInfo?.amType === props.modelType as string) {
            modelFileOptions.value.forEach(item => {
              item.children?.forEach((item1) => {
                if (item1.value === props.audioModelInfo?.amMfId) {
                  currentModel.value = [item.value as string, item1.value as string];
                }
              })
            })
            configId.value = props.audioModelInfo?.amMcId as string ?? '-1'
          }

          refAudios.value.forEach((item) => {
            item.paMoods.forEach((item1) => {
              item1.paAudios.forEach((item2) => {
                if (item2.paId === props.audioModelInfo?.amPaId) {
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

const activeTabKey = ref<string>('')

watch(
    () => props.activeTabKey,
    () => {
      activeTabKey.value = props.activeTabKey as string;
      if (props.activeTabKey !== props.modelType as string) {
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
            :options="langDicts"
            :field-names="{value: 'enName', label: 'zhName'}"
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
                    <div v-if="item.paRoleAvatar">
                      <a-avatar :image-url="item.paRoleAvatar"
                      />
                    </div>
                    <div v-else>
                      <a-avatar>
                        <span>{{ item.paRole }}</span>
                      </a-avatar>
                    </div>
                    <div style="text-align: center; margin-top: 5px">
                      <a-typography-text ellipsis>
                        {{ item.paRole }}
                      </a-typography-text>
                    </div>
                  </div>
                  <div style="width: 50%; margin-left: 10px">
                    <a-space direction="vertical" style="width: 100%">
                      <a-tag color="blue" style="display: block; width: 100%">
                        {{ item.paRoleGender ?? '未知' }}
                      </a-tag>
                      <a-tag color="green" style="display: block; width: 100%">
                        {{ item.paRoleAge ?? '未知' }}
                      </a-tag>
                      <a-tag color="cyan" style="display: block; width: 100%">
                        <a-typography-text ellipsis>
                          {{ getZhLang(item.paRoleLang) }}
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
        v-if="currentAudio?.paRole"
        style="width: 40%">
      <div>
        <div style="display: flex; align-items: center">
          <div v-if="currentAudio?.paRoleAvatar">
            <a-avatar :image-url="currentAudio?.paRoleAvatar"
            />
          </div>
          <div v-else>
            <a-avatar>
              <span>{{ currentAudio?.paRole }}</span>
            </a-avatar>
          </div>
          <div style="margin-left: 20px">
            <a-descriptions size="small" :title="currentAudio?.paRole" :column="2">
              <a-descriptions-item label="群组">
                {{ currentAudio?.paGroup }}
              </a-descriptions-item>
              <a-descriptions-item label="性别">
                {{ currentAudio?.paRoleGender }}
              </a-descriptions-item>
              <a-descriptions-item label="年龄">
                {{ currentAudio?.paRoleAge }}
              </a-descriptions-item>
              <a-descriptions-item label="语言">
                {{
                  langDicts.find((item : any) => item.enName === currentAudio?.paRoleLang)?.zhName ?? currentAudio?.paRoleLang
                }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>
        <div
            v-if="currentAudio?.paRoleTags && currentAudio.paRoleTags.length"
            style="margin-left: 60px; height: 40px; display: flex; align-items: center"
        >
          <a-space wrap>
            <a-tag
                v-for="(item, index) in currentAudio?.paRoleTags"
                :key="index"
                color="blue"
            >
              {{ item }}
            </a-tag>
          </a-space>
        </div>
        <a-descriptions :column="1">
          <a-descriptions-item v-if="activeTabKey === GPT_SOVITS" label="模型">
            <a-cascader
                v-model="currentModel"
                path-mode
                size="small"
                :options="modelFileOptions"
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
                    <a-descriptions
                        :title="item.configName"
                        :column="2"
                        bordered
                        layout="inline-vertical"
                    >
                      <a-descriptions-item v-if="item.amType === GPT_SOVITS" label="top_k">
                        {{ JSON.parse(item.mcParamsJson)?.top_k }}
                      </a-descriptions-item>
                      <a-descriptions-item v-if="item.amType === GPT_SOVITS" label="top_p">
                        {{ JSON.parse(item.mcParamsJson)?.top_p }}
                      </a-descriptions-item>
                      <a-descriptions-item v-if="item.amType === GPT_SOVITS" label="temperature">
                        {{ JSON.parse(item.mcParamsJson)?.temperature }}
                      </a-descriptions-item>

                      <a-descriptions-item v-if="item.amType === FISH_SPEECH" label="top_p">
                        {{ JSON.parse(item.mcParamsJson)?.top_p }}
                      </a-descriptions-item>
                      <a-descriptions-item v-if="item.amType === FISH_SPEECH" label="temperature">
                        {{ JSON.parse(item.mcParamsJson)?.temperature }}
                      </a-descriptions-item>
                      <a-descriptions-item v-if="item.amType === FISH_SPEECH" label="repetition_penalty">
                        {{ JSON.parse(item.mcParamsJson)?.repetition_penalty }}
                      </a-descriptions-item>
                    </a-descriptions>
                  </template>
                </a-popover>
              </a-option>
            </a-select>
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <a-divider style="margin: 10px 0"/>
      <n-scrollbar
          :style="{height: `${(props.selectSize === 2 ? 360 : 395) -(currentAudio?.paRoleTags && currentAudio.paRoleTags.length ? 40 : 0)}px`}">
        <div style="margin-right: 10px">
          <a-space direction="vertical" style="width: 100%">
            <div
                v-if="currentAudio?.paMoods"
                v-for="(item, index) in currentAudio.paMoods"
                :key="index"
                style="display: flex; align-items: center; padding: 0 5px 10px 0; border-bottom: 1px solid #cccccc">
              <div v-if="item?.paMoodAvatar ?? currentAudio?.paRoleAvatar">
                <a-avatar :image-url="item?.paMoodAvatar ?? currentAudio?.paRoleAvatar"
                />
              </div>
              <div v-else>
                <a-avatar>
                  <span>{{ currentAudio.paRole }}</span>
                </a-avatar>
              </div>
              <div style="margin-left: 20px; width: 100%">
                <div style="display: flex;justify-content: space-between; align-items: center">
                  <a-space size="medium">
                    <div>
                      <span>{{ item.paMood }}</span>
                    </div>
                    <div>
                      <a-button
                          v-if="activeAudioKey === `${currentAudio.paGroup}-${currentAudio.paRole}-${item.paMood}-${item.currentAudio.paAudio}`"
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
                            `${currentAudio.paGroup}-${currentAudio.paRole}-${item.paMood}-${item.currentAudio.paAudio}`,
                            item.currentAudio.audioUrl
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
                          v-if="item.paAudios"
                          size="mini" type="outline"
                      >
                        更多音频
                        <icon-down/>
                      </a-button>
                      <template #content>
                        <a-doption
                            v-for="(item1, index1) in item.paAudios"
                            :key="index1"
                            @click="() => {
                            stopAudio();
                            item.currentAudio = item1;
                          }"
                        >
                          <div
                              style="
                                  width: 500px;
                                  display: flex;
                                  justify-content: space-between;
                                  align-items: center"
                              :style="index1 !== item.paAudios.length - 1 && { borderBottom: '1px #cccccc solid' }"
                          >
                            <div style="width: 90%">
                              <div>
                                <a-typography-paragraph style="margin: 0">
                                  {{ item1.paAudioText }}
                                </a-typography-paragraph>
                              </div>
                              <div>
                                <a-space v-if="item1.paAudioTags && item1.paAudioTags.length" wrap>
                                  <a-tag
                                      v-for="(item2, index2) in item1.paAudioTags"
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
                                  v-if="activeAudioKey === `${currentAudio.paGroup}-${currentAudio.paRole}-${item.paMood}-${item1.paAudio}`"
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
                                  @click.stop="playAudio(`${currentAudio.paGroup}-${currentAudio.paRole}-${item.paMood}-${item1.paAudio}`, item1.audioUrl)"
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