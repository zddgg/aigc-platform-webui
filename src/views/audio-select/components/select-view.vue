<script setup lang="ts">
import {voiceNameFormat} from "@/utils/model-util.ts";
import {onMounted, PropType, ref, watch} from "vue";
import {ModelSelect, Mood, MoodAudio, RefAudio} from "@/api/ref-audio.ts";
import {CascaderOption} from "naive-ui";
import {queryModels as queryGsvModels} from "@/api/gpt-sovits.ts";
import {queryModels as queryFsModels} from "@/api/fish-speech.ts";
import {Model} from "@/api/model.ts";
import {queryVoiceAudioUrl} from "@/api/config.ts";
import useLoading from "@/hooks/loading.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelSelect: {
    type: Object as PropType<ModelSelect>
  },
  refAudio: {
    type: Object as PropType<RefAudio>,
    default: () => {
    }
  },
})
const emits = defineEmits(['change']);

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素
const {loading, setLoading} = useLoading();

const currentModel = ref<string[]>([])
const modelDataOptions = ref<CascaderOption[]>([]);

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

const createAudioKey = ref('')
const createAudio = async (mood: Mood) => {
  const key = `${props.refAudio.group}-${props.refAudio.name}-${mood.name}`
  console.log(key)

  if (!mood?.currentMoodAudio?.url) {
    if (!mood.moodAudios && props.refAudio.modelType === 'edge-tts') {
      let newUrl = '';
      try {
        createAudioKey.value = props.refAudio.name;
        setLoading(true);
        const {data} = await queryVoiceAudioUrl(props.refAudio.name);
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

const change = (mood: Mood) => {

  const activeModel: ModelSelect = {} as ModelSelect;
  if (props.refAudio.modelType !== 'edge-tts') {
    activeModel.modelType = currentModel.value[0]
    activeModel.model = [currentModel.value[1], currentModel.value[2]]

    if (!mood.currentMoodAudio || !mood.currentMoodAudio.name) {
      mood.currentMoodAudio = mood.moodAudios[0]
    }

    activeModel.audio = [props.refAudio.group, props.refAudio.name, mood.name, mood.currentMoodAudio.name]
  } else {
    activeModel.modelType = 'edge-tts'
    activeModel.model = [props.refAudio.name]
  }

  emits('change', activeModel);
}

onMounted(() => {
  handleQueryModel();
})

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        if (props.modelSelect?.modelType) {
          currentModel.value = [props.modelSelect?.modelType, props.modelSelect?.model[0], props.modelSelect?.model[1]];
        }
      }
    },
    {immediate: true}
);

</script>

<template>
  <div id="select-view">
    <div>
      <div style="display: flex; align-items: center">
        <div v-if="refAudio?.avatar">
          <a-avatar :image-url="refAudio?.avatar"
          />
        </div>
        <div v-else>
          <a-avatar>
            <span>{{ voiceNameFormat(refAudio?.name) }}</span>
          </a-avatar>
        </div>
        <div style="margin-left: 20px">
          <a-descriptions size="small" :title="voiceNameFormat(refAudio?.name)" :column="2">
            <a-descriptions-item label="群组">
              {{ refAudio?.group }}
            </a-descriptions-item>
            <a-descriptions-item label="性别">
              {{ refAudio?.gender }}
            </a-descriptions-item>
            <a-descriptions-item label="年龄">
              {{ refAudio?.ageGroup }}
            </a-descriptions-item>
            <a-descriptions-item label="语言">
              {{ refAudio?.language }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
      <div v-if="refAudio?.tags" style="margin: 5px 0 0 60px">
        <a-space wrap>
          <a-tag
              v-for="(item, index) in refAudio?.tags"
              :key="index"
              color="blue"
          >
            {{ item }}
          </a-tag>
        </a-space>
      </div>
      <div v-if="refAudio?.modelType !== 'edge-tts'" style="margin: 5px 0 0 10px">
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
    <n-scrollbar style="height: 400px">
      <a-space direction="vertical" style="width: 100%">
        <div
            v-if="refAudio?.moods"
            v-for="(item, index) in refAudio.moods"
            :key="index"
            style="display: flex; align-items: center; padding: 0 15px 5px 0; border-bottom: 1px solid #cccccc">
          <div v-if="item?.avatar ?? refAudio?.avatar">
            <a-avatar :image-url="item?.avatar ?? refAudio?.avatar"
            />
          </div>
          <div v-else>
            <a-avatar>
              <span>{{ refAudio.name }}</span>
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
                      v-if="activeAudioKey === `${refAudio.group}-${refAudio.name}-${item.name}`"
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
                              v-if="activeAudioKey === `${refAudio.group}-${refAudio.name}-${item.name}-${item1.name}`"
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
                              @click.stop="playAudio(`${refAudio.group}-${refAudio.name}-${item.name}-${item1.name}`, item1.url)"
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
                <a-button size="mini" type="primary" @click="change(item)">使用</a-button>
              </div>
            </div>
          </div>
        </div>
      </a-space>
    </n-scrollbar>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>

</style>