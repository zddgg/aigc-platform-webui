<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {ModelSelect, Mood, MoodAudio, queryRefAudios, RefAudio} from "@/api/ref-audio.ts";
import {queryModels as queryGsvModels} from "@/api/gpt-sovits.ts";
import {queryModels as queryFsModels} from "@/api/fish-speech.ts";
import {Model} from "@/api/model.ts";
import {CascaderOption} from "naive-ui";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import useLoading from "@/hooks/loading.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {EdgeTtsVoice, queryEdgeTtsConfig, queryVoiceAudioUrl} from "@/api/config.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelSelect: {
    type: Object as PropType<ModelSelect>
  }
})

const emits = defineEmits(['update:visible', 'change']);
const {loading, setLoading} = useLoading();

const showModal = ref(false);
const audios = ref<RefAudio[]>([])
const gsvModels = ref<Model[]>([])
const fsModels = ref<Model[]>([])
const currentAudio = ref<RefAudio>({} as RefAudio)
const currentModel = ref<string[]>([])

const groupOptions = ref<string[]>([])
const selectGroup = ref<string>('')
const genderOptions = ref<SelectOptionData[]>([])
const selectGender = ref<string>('')
const ageGroupOptions = ref<string[]>([])
const selectAgeGroup = ref<string>('')
const languageOptions = ref<string[]>([])
const selectLanguage = ref<string>('')
const tagOptions = ref<string[]>([])
const selectTag = ref<string>('')
const voiceNameInput = ref<string>('')

const computedAudios = computed(() => {
  let tmp = audios.value;
  if (selectGroup.value) {
    return audios.value.filter(item => item.group === selectGroup.value);
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
})

const close = () => {
  stopAudio();
  emits('update:visible', false);
}

const handleQueryAudio = async () => {
  const {data} = await queryRefAudios();
  audios.value = data;
}

const modelDataOptions = ref<CascaderOption[]>([]);

const handleQueryModel = async () => {
  const gsvRes = await queryGsvModels();
  gsvModels.value = gsvRes.data;
  const fsRes = await queryFsModels();
  fsModels.value = fsRes.data;
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

const tabKey = ref('1')

const handleTabChange = (key: string | number) => {
  tabKey.value = key as string;

  const langArr = ['中文', '英文', '日文', '韩文'];

  if (!langArr.includes(selectLanguage.value)) {
    selectLanguage.value = '';
  }

  if (key === '1') {
    const data = audios.value;
    currentAudio.value = data[0];

    groupOptions.value = [...new Set(data.filter((item) => !!item.group).map((item) => item.group))]
    genderOptions.value = Array.from(new Set(data.filter((item) => !!item.gender).map((item) => item.gender)))
        .map(gender => ({
          label: gender,
          value: gender
        }));
    ageGroupOptions.value = [...new Set(data.filter((item) => !!item.ageGroup).map((item) => item.ageGroup))]
    languageOptions.value = [...new Set(data.filter((item) => !!item.language).map((item) => item.language))]
    const audioTags = data.flatMap(item => item.tags).filter(item => !!item);
    const moodAudioTags = data
        .flatMap(item => item.moods
            .flatMap(mood => mood.moodAudios
                .flatMap(moodAudio => moodAudio.tags))).filter(item => !!item);
    const res = [...audioTags, ...moodAudioTags]
    tagOptions.value = [...new Set(res)]
  }

  if (key === '2') {
    const data = edgeTtsVoices.value;
    // currentAudio.value = data[0];

    genderOptions.value = Array.from(new Set(data.map(item => item.gender)))
        .map(gender => ({
          label: gender === 'Male' ? '男' : gender === 'Female' ? '女' : gender,
          value: gender === 'Male' ? '男' : gender === 'Female' ? '女' : gender
        }));
    languageOptions.value = Array.from(new Set(data.map((item) => item.locale.substring(0, item.locale.indexOf('-')))))
        .map(language => {
          return language === 'zh' ? '中文' :
              language === 'en' ? '英文' :
                  language === 'ja' ? '日文' :
                      language === 'ko' ? '韩文' :
                          language;
        })
        .sort((a, b) => {
          const sa = langArr.includes(a) ? 0 : 1
          const sb = langArr.includes(b) ? 0 : 1
          return sa - sb;
        })
    ;
  }
}

const edgeTtsVoices = ref<EdgeTtsVoice[]>([])
const handleQueryVoices = async () => {
  const {data} = await queryEdgeTtsConfig()
  edgeTtsVoices.value = data.voices
}
const computedVoices = computed(() => {
  let tmp = edgeTtsVoices.value;
  if (selectGender.value) {
    tmp = tmp.filter(item => (item.gender === 'Male' ? '男' : item.gender === 'Female' ? '女' : item.gender) === selectGender.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => {
      const language = item.locale.substring(0, item.locale.indexOf('-'));
      const lang = language === 'zh' ? '中文' :
          language === 'en' ? '英文' :
              language === 'ja' ? '日文' :
                  language === 'ko' ? '韩文' :
                      language;
      return lang === selectLanguage.value
    })
  }
  if (voiceNameInput.value) {
    tmp = tmp.filter(item => item.shortName.substring(item.shortName.lastIndexOf('-') + 1)
        .replace('Neural', '').toLowerCase()
        .includes(voiceNameInput.value.toLowerCase()))
  }
  return tmp;
})

const audioSelect = (audio: RefAudio) => {
  currentAudio.value = audio;
}

const voiceSelect = (voice: EdgeTtsVoice) => {
  const language = voice.locale.substring(0, voice.locale.indexOf('-'));
  const find = audios.value.find(item => item.group === 'edge-tts' && item.name === voice.shortName);
  if (find) {
    currentAudio.value = {
      ...find,
      modelType: 'et',
      name: voice.shortName,
      gender: voice.gender === 'Male' ? '男' : voice.gender === 'Female' ? '女' : voice.gender,
      language: language === 'zh' ? '中文' :
          language === 'en' ? '英文' :
              language === 'ja' ? '日文' :
                  language === 'ko' ? '韩文' :
                      language,
    } as RefAudio;
  } else {

    currentAudio.value = {
      modelType: 'et',
      group: 'edge-tts',
      name: voice.shortName,
      gender: voice.gender === 'Male' ? '男' : voice.gender === 'Female' ? '女' : voice.gender,
      language: language === 'zh' ? '中文' :
          language === 'en' ? '英文' :
              language === 'ja' ? '日文' :
                  language === 'ko' ? '韩文' :
                      language,
      moods: [
        {
          name: '默认',
        }
      ]
    } as RefAudio
  }
}

const modelSelect = (mood: Mood) => {

  const activeModel: ModelSelect = {} as ModelSelect;
  if (tabKey.value === '1') {
    activeModel.modelType = currentModel.value[0]
    activeModel.model = [currentModel.value[1], currentModel.value[2]]

    if (!mood.currentMoodAudio || !mood.currentMoodAudio.name) {
      mood.currentMoodAudio = mood.moodAudios[0]
    }

    activeModel.audio = [currentAudio.value.group, currentAudio.value.name, mood.name, mood.currentMoodAudio.name]
  }
  if (tabKey.value === '2') {
    activeModel.modelType = 'edge-tts'
    activeModel.model = [currentAudio.value.name]
  }

  emits('change', activeModel);
  emits('update:visible', false)
}

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

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

const createAudioKey = ref('')
const createAudio = async (mood: Mood) => {
  const key = `${tabKey.value}-${currentAudio.value.group}-${currentAudio.value.name}-${mood.name}`

  if (!mood?.currentMoodAudio?.url) {
    if (!mood.moodAudios && tabKey.value === '2') {
      let newUrl = '';
      try {
        createAudioKey.value = currentAudio.value.name;
        setLoading(true);
        const {data} = await queryVoiceAudioUrl(currentAudio.value.name);
        newUrl = data;
        mood.currentMoodAudio = {url: newUrl} as MoodAudio
      } catch (error) {
        console.error('Error fetching audio URL:', error);
        // 错误处理逻辑
        return; // 如果出错，提前退出函数
      } finally {
        createAudioKey.value = '';
        setLoading(false);
      }
    } else {
      mood.currentMoodAudio = mood.moodAudios[0]
    }
  }
  playAudio(key, mood.currentMoodAudio.url);
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


watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryAudio();
        await handleQueryModel();
        await handleQueryVoices();

        console.log(props.modelSelect)

        if (props.modelSelect?.modelType) {
          if (props.modelSelect.modelType === 'edge-tts') {
            handleTabChange('2');
            const find = edgeTtsVoices.value.find(item => item.shortName === props.modelSelect?.model[0]);
            if (find) {
              voiceSelect(find);
            }
          } else {
            handleTabChange('1');
            currentModel.value = [props.modelSelect?.modelType, props.modelSelect?.model[0], props.modelSelect?.model[1]];
            const find = audios.value.find(item => item.group === props.modelSelect?.audio[0]
                && item.name === props.modelSelect?.audio[1]);
            if (find) {
              audioSelect(find);
            }
          }
        } else {
          handleTabChange('1');
        }
      }

      showModal.value = props.visible
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <a-modal v-model:visible="showModal"
             title="选择音频"
             :hide-title="true"
             :footer="false"
             :width="960"
             :unmount-on-close="true"
             @close="close"
             @cancel="close"
    >
      <div style="display: flex; height: 710px; cursor: pointer">
        <div style="width: 60%">
          <a-tabs :default-active-key="tabKey" size="large" @change="handleTabChange">
            <a-tab-pane key="1" title="GPT-SoVITS\fish-speech">
              <a-space>
                <a-select v-model="selectGroup"
                          :options="groupOptions"
                          allow-clear
                          placeholder="群组"
                          style="width: 100px"
                />
                <a-select v-model="selectGender"
                          :options="genderOptions"
                          allow-clear
                          placeholder="性别"
                          style="width: 100px"
                />
                <a-select v-model="selectAgeGroup"
                          :options="ageGroupOptions"
                          allow-clear
                          placeholder="年龄"
                          style="width: 100px"
                />
                <a-select v-model="selectLanguage"
                          :options="languageOptions"
                          allow-clear
                          placeholder="语言"
                          style="width: 100px"
                />
                <a-select v-model="selectTag"
                          :options="tagOptions"
                          allow-clear
                          placeholder="标签"
                          style="width: 100px"
                />
              </a-space>
              <div style="margin-top: 10px">
                <n-scrollbar style="height: 500px">
                  <a-grid :cols="3" :col-gap="10" :row-gap="10" style="margin-right: 10px">
                    <a-grid-item
                        v-for="(item, index) in computedAudios"
                        :key="index"
                    >
                      <a-card
                          hoverable
                          :body-style="{padding: '10px'}"
                          style="border: 1px #ccc solid; border-radius: 8px"
                          @click="audioSelect(item)"
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
                </n-scrollbar>
              </div>
            </a-tab-pane>
            <a-tab-pane key="2" title="Edge-TTS">
              <a-space>
                <a-select v-model="selectGender"
                          :options="genderOptions"
                          allow-clear
                          placeholder="性别"
                          style="width: 100px"
                />
                <a-select v-model="selectLanguage"
                          :options="languageOptions"
                          allow-clear
                          placeholder="语言"
                          style="width: 100px"
                />
                <a-input
                    v-model="voiceNameInput"
                    placeholder="搜索"
                    allow-clear
                    style="width: 200px"
                />
              </a-space>
              <div style="margin-top: 10px">
                <n-scrollbar style="height: 600px">
                  <a-grid :cols="3" :col-gap="10" :row-gap="10" style="margin-right: 10px">
                    <a-grid-item
                        v-for="(item, index) in computedVoices"
                        :key="index"
                    >
                      <a-card
                          hoverable
                          :body-style="{padding: '10px'}"
                          style="border: 1px #ccc solid; border-radius: 8px"
                          @click="voiceSelect(item)"
                      >
                        <div style="display: flex; justify-content: center; align-items: center">
                          <div style="width: 50%; text-align: center">
                            <div>
                              <a-avatar>
                                <span>{{ voiceNameFormat(item.shortName) }}</span>
                              </a-avatar>
                            </div>
                            <div style="text-align: center; margin-top: 5px">
                              <a-typography-text ellipsis>{{ voiceNameFormat(item.shortName) }}</a-typography-text>
                            </div>
                          </div>
                          <div style="width: 50%; margin-left: 10px">
                            <a-space direction="vertical" style="width: 100%">
                              <a-tag color="blue" style="display: block; width: 100%">
                                {{ item.gender === 'Male' ? '男' : item.gender === 'Female' ? '女' : item.gender }}
                              </a-tag>
                              <a-tag color="green" style="display: block; width: 100%">
                                {{ '未知' }}
                              </a-tag>
                              <a-tag color="cyan" style="display: block; width: 100%">
                                <a-typography-text ellipsis>
                                  {{ item.locale ?? '未知' }}
                                </a-typography-text>
                              </a-tag>
                            </a-space>
                          </div>
                        </div>
                      </a-card>
                    </a-grid-item>
                  </a-grid>
                </n-scrollbar>
              </div>

            </a-tab-pane>
          </a-tabs>
        </div>
        <a-divider direction="vertical"/>
        <div style="width: 40%">
          <div
              style="height: 44px; display: flex;
              justify-content: right;
              align-items: center;
              border-bottom: 1px #cccccc solid"
          >
            <icon-close :size="24"
                        @click="close"
            />
          </div>
          <div style="padding-right: 20px">
            <div style="margin-top: 16px">
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
              <div v-if="currentAudio.tags" style="margin: 5px 0 0 60px">
                <a-space wrap>
                  <a-tag
                      v-for="(item, index) in currentAudio.tags"
                      :key="index"
                      color="blue"
                  >
                    {{ item }}
                  </a-tag>
                </a-space>
              </div>
              <div v-if="currentAudio.modelType !== 'et'" style="margin: 5px 0 0 10px">
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
            <a-divider/>
            <a-space direction="vertical" style="width: 100%">
              <div
                  v-if="currentAudio?.moods"
                  v-for="(item, index) in currentAudio.moods"
                  :key="index"
                  style="display: flex; align-items: center; border-bottom: 1px solid #cccccc">
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
                            v-if="activeAudioKey.startsWith(`${tabKey}-${currentAudio.group}-${currentAudio.name}-${item.name}`)"
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
                            :loading="loading"
                            @click="createAudio(item)"
                        >
                          <icon-play-arrow/>
                        </a-button>
                      </div>
                      <a-dropdown position="br">
                        <a-button
                            v-if="item.moodAudios"
                            size="mini" type="outline"
                        >
                          更多音频
                          <icon-down/>
                        </a-button>
                        <template #content>
                          <a-doption v-for="(item1, index1) in item.moodAudios"
                                     :key="index1"
                                     @click="() => (item.currentMoodAudio = item1)"
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
                                    v-if="activeAudioKey === `${tabKey}-${currentAudio.group}-${currentAudio.name}-${item.name}-${item1.name}`"
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
                                    @click.stop="playAudio(`${tabKey}-${currentAudio.group}-${currentAudio.name}-${item.name}-${item1.name}`, item1.url)"
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
        </div>
      </div>
    </a-modal>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>

</style>