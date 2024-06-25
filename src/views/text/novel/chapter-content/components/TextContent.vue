<script setup lang="ts">
import ContextMenu from "@/components/ContextMenu.vue";
import {computed, inject, onMounted, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import {Message, Notification} from "@arco-design/web-vue";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import {scrollToTop} from '@/utils/view-utils.ts'
import {IWebSocketService} from "@/services/websocketService.ts";
import useLoading from "@/hooks/loading.ts";
import {AudioModelConfig} from "@/api/model.ts";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {EventBus} from "@/vite-env";
import {
  audioModelChange,
  ChapterInfo,
  chapterInfos as queryChapterInfos, createAudio,
  updateChapterText
} from "@/api/text-chapter.ts";

const route = useRoute();
const props = defineProps({
  textContentConfig: {
    type: Object as PropType<TextContentConfig>,
    default: {
      textViewType: 'text'
    } as TextContentConfig
  },
  creatingIds: {
    type: Array as PropType<string[]>,
    default: []
  }
})

const emits = defineEmits(['update:creatingIds'])

const {loading, setLoading} = useLoading();
const eventBus = inject<EventBus>('eventBus');

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const textContentConfig = ref<TextContentConfig>(props.textContentConfig)

const chapterInfos = ref<ChapterInfo[]>([])
const roleChangeModelVisible = ref<boolean>(false)
const modelSelectVisible = ref<boolean>(false);
const currentChapterInfo = ref<ChapterInfo>({} as ChapterInfo);

const handleQueryChapterInfo = async () => {
  const {data} = await queryChapterInfos({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  chapterInfos.value = data;
}

const computedChapterInfo = computed(() => {
  return chapterInfos.value.reduce((accumulator: ChapterInfo[][], currentValue: ChapterInfo) => {
    // 检查accumulator中是否已经有了当前b值的分组
    const group = accumulator.find(group => group[0].paragraphIndex === currentValue.paragraphIndex);

    if (group) {
      // 如果存在，将当前对象添加到该分组中
      group.push(currentValue);
    } else {
      // 如果不存在，创建一个新的分组
      accumulator.push([currentValue]);
    }

    return accumulator;
  }, []);
});

const textSelect = (e: Event) => {
  e.preventDefault();
  const target = e.target as HTMLElement | null;
  if (target) {
    const strings = target.id.split('-');
    console.log(strings)
    if (strings.length === 3) {
      const find = chapterInfos.value
          .find((item) => item.index === `${strings[1]}-${strings[2]}`);
      if (find) {
        console.log(find)
        currentChapterInfo.value = find;
      }
    }
  }
}

const contextMenuSelect = (key: string) => {
  if (key === 'changeRole') {
    roleChangeModelVisible.value = true;
  }
  if (key === 'changeModel') {
    modelSelectVisible.value = true;
  }
}

const textModelFormat = computed(() => (chapterInfo: ChapterInfo) => {
  let modelType = '';
  let ext = '';

  if (chapterInfo.audioModelType === 'gpt-sovits') {
    modelType = 'gs';
    if (chapterInfo.gptSovitsModel && chapterInfo.refAudio) {
      ext = `${chapterInfo.gptSovitsModel.modelName}-${chapterInfo.refAudio.audioName}-${chapterInfo.refAudio.moodName}`
    }
  }
  if (chapterInfo.audioModelType === 'fish-speech') {
    modelType = 'fs'
    if (chapterInfo.fishSpeechModel && chapterInfo.refAudio) {
      ext = `${chapterInfo.fishSpeechModel.modelName}-${chapterInfo.refAudio.audioName}-${chapterInfo.refAudio.moodName}`
    }
  }

  if (chapterInfo.audioModelType === 'chat-tts') {
    modelType = 'ct';
    ext = chapterInfo.chatTtsConfig?.configName as string;
  }

  if (chapterInfo.audioModelType === 'edge-tts') {
    modelType = 'et';
    if (chapterInfo.edgeTtsConfig) {
      ext = voiceNameFormat(chapterInfo.edgeTtsConfig.shortName) as string;
    }
  }

  if (modelType && ext) {
    return `${modelType}-${ext}`;
  }
  return null;
})

const modelSelect = async (modelConfig: AudioModelConfig) => {
  const {msg} = await audioModelChange({
    ...currentChapterInfo.value,
    ...modelConfig,
  });
  Message.success(msg);
  await handleQueryChapterInfo();
}

const backupText = ref<string>('');
const editStart = (chapterInfo: ChapterInfo) => {
  backupText.value = chapterInfo.text;
}
const editEnd = async (chapterInfo: ChapterInfo) => {
  if (chapterInfo.text === backupText.value) {
    return;
  }
  const {msg} = await updateChapterText(chapterInfo);
  Message.success(msg);
}

const playAll = ref(false);
const activeAudioIndex = ref<number>(-1);

const activeAudioKey = ref<string>('');
const playAudio = (chapterInfo: ChapterInfo) => {
  const url = chapterInfo.audioUrl;
  activeAudioKey.value = chapterInfo.index;
  if (audioElement.value && url) {
    audioElement.value.src = `${url}?timestamp=${Date.now()}`;
    audioElement.value.volume = chapterInfo.audioVolume;
    audioElement.value.playbackRate = chapterInfo.audioSpeed;
    audioElement.value.play();
  }
  playAll.value = false;
  activeAudioIndex.value = -1;
};

const stopAudio = () => {
  if (audioElement.value) {
    // 停止音频播放
    audioElement.value.pause();
    audioElement.value.currentTime = 0; // 将播放进度设置为音频开头
  }
  activeAudioKey.value = '';
};

const playNext = () => {
  activeAudioIndex.value += 1;
  const chapterInfo = chapterInfos.value[activeAudioIndex.value];
  if (chapterInfo) {
    setTimeout(() => {
      const url = chapterInfo.audioUrl;
      activeAudioKey.value = chapterInfo.index;
      if (audioElement.value && url) {
        audioElement.value.src = `${url}?timestamp=${Date.now()}`;
        audioElement.value.volume = chapterInfo.audioVolume;
        audioElement.value.playbackRate = chapterInfo.audioSpeed;
        audioElement.value.play();
      }
    }, 300);
  } else {
    activeAudioIndex.value = -1;
  }
};

const playAllAudio = () => {
  playAll.value = true;
  // if (playStartIndex.value) {
  //   let start = -1;
  //   roleSpeechConfigs.value.forEach((item, index) => {
  //     if (item.linesIndex === playStartIndex.value) {
  //       start = index - 1;
  //     }
  //   });
  //   activeAudioIndex.value = start;
  // }
  activeAudioIndex.value = -1;
  playNext();
}

const handleAudioEnded = () => {
  if (playAll.value && activeAudioIndex.value < chapterInfos.value.length) {
    playNext();
  } else {
    activeAudioKey.value = '';
    playAll.value = false;
  }
};


const handleChapterInfoUpdate = (data: ChapterInfo) => {
  chapterInfos.value = chapterInfos.value.map((item) => {
    if (item.index === data.index) {
      return {
        ...item,
        audioUrl: data.audioUrl
      }
    }
    return item;
  });
  Notification.success({
    title: `${data.index}生成成功`,
    content: '',
    position: 'bottomRight',
    duration: 2000
  })
};
const createAudioKey = ref<string>('');
const handleCreateAudio = async (record: ChapterInfo) => {
  if (loading.value && createAudioKey.value === record.index) {
    return;
  }
  try {
    createAudioKey.value = record.index;
    setLoading(true);
    const {data, msg} = await createAudio(record)
    Message.success(msg);
    emits('update:creatingIds', data)
  } finally {
    createAudioKey.value = ''
    setLoading(false);
  }
}

const onRoleChange = () => {
  eventBus?.emit(ROLE_CHANGE);
}

const WebSocketService = inject<IWebSocketService>('WebSocketService') as IWebSocketService;

const roleChangeEvent = () => {
  handleQueryChapterInfo();
}

onMounted(() => {
  eventBus?.on(ROLE_CHANGE, roleChangeEvent);
});

defineExpose({playAllAudio})

watch(
    () => route.query.chapter,
    async () => {
      await handleQueryChapterInfo();
      scrollToTop('text-content')
      stopAudio();
      if (route.query.chapter as string) {
        WebSocketService.addResultHandler(
            `${route.query.project as string}-${route.query.chapter as string}`, handleChapterInfoUpdate
        );
      }
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <a-card v-if="!computedChapterInfo || computedChapterInfo.length === 0">
      <a-empty/>
    </a-card>
    <a-card
        v-else
        id="text-content"
        :bordered="false"
        style="border-radius: 8px"
        @click.right="(e) => e.preventDefault()"
        class="text-content"
    >
      <div>
        <p
            v-for="(item, index) in computedChapterInfo"
            :key="index"
            :class="{'text': textContentConfig.textViewType === 'text'}"
        >
          <span
              v-for="(item1, index1) in item"
              :id="`sentence-${item1.index}`"
              :key="index1"
              :class="{'text-list': textContentConfig.textViewType === 'text-list'}"
          >
            <span v-if="textContentConfig.showRole && item1.role">
              <span
                  :id="`role-${index}-${index1}`"
                  style="background-color: #c3f6f6; margin-right: 5px"
                  :style="item1.sentenceIndex !==0 && textContentConfig.textViewType === 'text' && {marginLeft: '10px'}"
              >
                {{ item1.role }}
              </span>
            </span>
            <span v-if="textContentConfig.showModal && textModelFormat(item1)">
              <span
                  :id="`model-${index}-${index1}`"
                  style="background-color: #f6dcc3; margin-right: 5px"
              >
                {{ textModelFormat(item1) }}
              </span>
            </span>
            <span v-if="textContentConfig.showAudio && item1.audioModelType">
              <a-button
                  v-if="activeAudioKey === item1.index"
                  size="mini"
                  type="outline"
                  status="danger"
                  style="margin-right: 5px"
                  @click="stopAudio"
              >
                <icon-mute-fill/>
              </a-button>
              <a-button
                  v-else
                  size="mini"
                  type="outline"
                  style="margin-right: 5px"
                  @click="playAudio(item1)"
              >
                <icon-play-arrow/>
              </a-button>
              <a-popconfirm
                  type="warning"
                  content="确认生成?"
                  @ok="handleCreateAudio(item1)"
              >
                <a-button
                    size="mini"
                    type="outline"
                    style="margin-right: 5px"
                    :status="props.creatingIds?.includes(item1.index) ? 'danger' : 'normal'"
                    :disabled="!item1.audioModelType || props.creatingIds?.includes(item1.index)"
                >
                  <icon-refresh
                      :spin="props.creatingIds?.includes(item1.index)"
                  />
                </a-button>
              </a-popconfirm>
            </span>
            <span>
              <context-menu
                  :menu="[
                     { label: '改角色', value: 'changeRole' },
                     { label: '改模型', value: 'changeModel' }
                   ]"
                  @select="contextMenuSelect"
              >
                <a-typography-text
                    v-model:edit-text="item1.text"
                    :id="`text-${item1.index}`"
                    :type="item1.audioModelType ? 'normal' : 'danger'"
                    :class="{'lines-color': textContentConfig.showLines && item1.dialogueFlag}"
                    :mark="activeAudioKey === item1.index"
                    :editable="props.textContentConfig.textEdit"
                    @edit-start="editStart(item1)"
                    @edit-end="editEnd(item1)"
                    @click.right="textSelect"
                >
                  {{ item1.text }}
                </a-typography-text>
              </context-menu>
            </span>
          </span>
        </p>
      </div>
    </a-card>
    <audio-select
        v-model:visible="modelSelectVisible"
        :model-config="currentChapterInfo"
        @model-select="modelSelect"
    />
    <role-change-model
        v-model:visible="roleChangeModelVisible"
        :chapter-info="currentChapterInfo"
        @change="onRoleChange"
    />
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
.text-content {
  font-size: 18px;
  line-height: 1.5;
}

.text-list {
  display: block;
}

.text {
  text-indent: 2em;
}

.lines-color {
  background-color: #3367D1;
  color: #ffffff;
}

.highlight {
  background-color: yellow;
  color: #000000;
}
</style>