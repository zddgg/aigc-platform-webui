<script setup lang="ts">
import {computed, onMounted, PropType, ref, watch} from "vue";
import {AudioModelInfoKey} from "@/api/model.ts";
import {LangDict, queryLangDicts} from "@/api/dict.ts";
import {PaMood, PromptAudio, queryPromptAudios} from "@/api/prompt-audio.ts";
import {AmModelConfig, getByModelType as queryModelConfigs} from "@/api/am-model-config.ts";
import {COSY_VOICE} from "@/types/model-types.ts";

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
  },
})

const emits = defineEmits(['modelSelect'])

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const refAudios = ref<PromptAudio[]>([])
const currentAudio = ref<PromptAudio>({} as PromptAudio)

const configId = ref<string>('');
const modelMode = ref<'preset' | 'custom' | 'advanced'>('preset')

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
const configSearchText = ref<string>('')

const roleOptions = ['中文女', '中文男', '英文女', '英文男', '日语男', '粤语女', '韩语女']
const role = ref<string>('')


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

const modelConfigs = ref<AmModelConfig[]>([])
const currentConfig = ref<AmModelConfig | null>(null)

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: COSY_VOICE})
  modelConfigs.value = data;
}

const computedModelConfigs = computed(() => {
  return modelConfigs.value
      .filter((item1) => !configSearchText.value.trim()
          || item1.mcName.includes(configSearchText.value.trim())
          || JSON.parse(item1.mcParamsJson)?.role?.includes(configSearchText.value.trim())
          || JSON.parse(item1.mcParamsJson)?.instruct?.includes(configSearchText.value.trim()))
})

const onAudioCardSelect = (refAudio: PromptAudio) => {
  currentAudio.value = refAudio;

  if (!configId.value) {
    configId.value = '-1';
  }
}

const onConfigCardSelect = (modelConfig: AmModelConfig) => {
  configId.value = modelConfig.mcId
  currentConfig.value = modelConfig
  role.value = JSON.parse(modelConfig?.mcParamsJson ?? '{}')?.role
}

const paAudioSelect = (mood: PaMood) => {
  if (!mood.currentAudio || !mood.currentAudio.paAudio) {
    mood.currentAudio = mood.paAudios[0]
  }

  const audioModelInfo: AudioModelInfoKey = {
    amType: COSY_VOICE,
    amPaId: mood.currentAudio.paId,
    amMcParamsJson: JSON.stringify({
      ...JSON.parse(currentConfig.value?.mcParamsJson ?? '{}'),
      mode: modelMode.value,
      role: role.value
    })
  } as AudioModelInfoKey

  emits('modelSelect', audioModelInfo)
}

const roleSelect = () => {
  const audioModelInfo: AudioModelInfoKey = {
    amType: COSY_VOICE,
    amMcId: configId.value,
    amMcParamsJson: JSON.stringify({
      ...JSON.parse(currentConfig.value?.mcParamsJson ?? '{}'),
      mode: modelMode.value,
      role: role.value
    })
  } as AudioModelInfoKey

  emits('modelSelect', audioModelInfo)
}

const langDicts = ref<LangDict[]>([])

const handleLangDicts = async () => {
  const {data} = await queryLangDicts()
  langDicts.value = data;
}

onMounted(() => {
  handleLangDicts()
})

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryPromptAudios();
        await handleQueryModelConfigs();

        if (props.audioModelInfo) {
          modelMode.value = JSON.parse(props.audioModelInfo?.amMcParamsJson ?? '{}')?.mode ?? 'preset';
          role.value = JSON.parse(props.audioModelInfo?.amMcParamsJson as string ?? '{}')?.role;

          const find = modelConfigs.value.find((item) => item.mcId = props.audioModelInfo?.amMcId as string)
          if (find) {
            currentConfig.value = find;
            configId.value = props.audioModelInfo?.amMcId as string ?? '-1';
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
      if (props.activeTabKey !== COSY_VOICE) {
        stopAudio();
      }
    },
    {immediate: true}
);

</script>

<template>
  <div style="display: flex">
    <div style="width: 60%">
      <div v-if="modelMode === 'custom'">
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
                            {{ item.paRoleLang ?? '未知' }}
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
      <div v-if="modelMode === 'advanced'">
        <a-space>
          <a-input
              v-model="configSearchText"
              allow-clear
              placeholder="搜索"
              size="small"
          />
        </a-space>
        <n-scrollbar style="height: 500px; margin-top: 10px">
          <div style="margin-right: 10px">
            <a-grid :cols="1" :col-gap="10" :row-gap="10">
              <a-grid-item
                  v-for="(item, index) in computedModelConfigs"
                  :key="index"
              >
                <a-card
                    hoverable
                    style="border: 1px #ccc solid; border-radius: 8px"
                    :bordered="false"
                    @click="onConfigCardSelect(item)"
                >
                  <a-descriptions :title="item?.mcName" :column="1">
                    <a-descriptions-item label="role">
                      {{ JSON.parse(item?.mcParamsJson ?? '{}')?.role }}
                    </a-descriptions-item>
                    <a-descriptions-item label="instruct">
                      {{ JSON.parse(item?.mcParamsJson ?? '{}')?.instruct }}
                    </a-descriptions-item>
                  </a-descriptions>
                </a-card>
              </a-grid-item>
            </a-grid>
          </div>
        </n-scrollbar>
      </div>
      <div v-if="modelMode === 'preset'" style="height: 538px">
      </div>
    </div>
    <a-divider direction="vertical"/>
    <div style="width: 40%">
      <div style="height: 28px; display: flex; place-items: center">
        <a-radio-group
            v-model="modelMode"
            @change="() => {
              role = ''
              currentConfig = {} as any
            }"
        >
          <a-radio value="preset">预置语音</a-radio>
          <a-radio value="custom">定制语音</a-radio>
          <a-radio value="advanced">高级语音</a-radio>
        </a-radio-group>
      </div>
      <a-divider style="margin: 10px 0"/>
      <div v-if="modelMode === 'custom'">
        <div v-if="currentAudio?.paRole">
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
          </div>
          <a-divider style="margin: 10px 0"/>
          <n-scrollbar
              :style="{height: `${380 -(currentAudio?.paRoleTags && currentAudio.paRoleTags.length ? 40 : 0)}px`}">
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
                        <a-button size="mini" type="primary" @click="paAudioSelect(item)">使用</a-button>
                      </div>
                    </div>
                  </div>
                </div>
              </a-space>
            </div>
          </n-scrollbar>
        </div>
      </div>
      <div v-else>
        <div style="display: flex; place-items: center; margin-top: 10px">
          <span style="white-space: nowrap; margin-right: 10px">
            音色
          </span>
          <a-select v-model="role" size="small">
            <a-option
                v-for="(item, index) in roleOptions"
                :key="index"
            >
              {{ item }}
            </a-option>
          </a-select>
        </div>
        <a-divider style="margin: 10px 0"/>
        <a-card
            v-if="modelMode === 'preset' && role"
            style="border: 1px #ccc solid; border-radius: 8px"
        >
          <div style="display: flex; justify-content: space-between">
            <div>
              <span>
                {{ role }}
              </span>
              <a-button v-if="false" type="outline" size="mini" style="margin-left: 20px">
                <icon-play-arrow/>
              </a-button>
            </div>
            <a-button
                type="primary"
                size="mini"
                style="margin-left: 20px"
                @click="roleSelect"
            >
              使用
            </a-button>
          </div>
        </a-card>
        <a-card
            v-if="modelMode === 'advanced' && role && currentConfig?.mcParamsJson"
            style="border: 1px #ccc solid; border-radius: 8px"
        >
          <div style="display: flex; justify-content: space-between">
            <div>
              <span>
                {{ role }}
              </span>
              <a-button v-if="false" type="outline" size="mini" style="margin-left: 20px">
                <icon-play-arrow/>
              </a-button>
            </div>
            <a-button
                type="primary"
                size="mini"
                style="margin-left: 20px"
                @click="roleSelect"
            >
              使用
            </a-button>
          </div>
          <div>
            <a-divider style="margin: 10px 0"/>
            <a-descriptions layout="inline-vertical">
              <a-descriptions-item label="instruct">
                <template #label>
                  <span style="color: #303030; font-size: 18px">
                    {{ currentConfig?.mcName }}
                  </span>
                </template>
                {{ JSON.parse(currentConfig?.mcParamsJson ?? '{}')?.instruct }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </a-card>
      </div>
    </div>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
</style>