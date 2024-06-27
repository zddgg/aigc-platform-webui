<script setup lang="ts">
import {computed, h, inject, onBeforeUnmount, onMounted, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message, Modal, Notification, TableColumnData, TableRowSelection} from "@arco-design/web-vue";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import useLoading from "@/hooks/loading.ts";
import {IWebSocketService} from '@/services/websocketService.ts';
import {IconSettings} from "@arco-design/web-vue/es/icon";
import CombineExport from "@/views/text/novel/chapter-content/components/CombineExport.vue";
import {EventBus} from "@/vite-env";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {AudioModelConfig} from "@/api/model.ts";
import {
  audioModelChange,
  ChapterInfo,
  chapterInfos as queryChapterInfoList, createAudio,
  updateChapterText,
  updateControls,
  updateInterval,
  updateSpeed,
  updateVolume
} from "@/api/text-chapter.ts";

const route = useRoute();
const props = defineProps({
  textContentConfig: {
    type: Object as PropType<TextContentConfig>,
    default: {
      textViewType: 'text'
    } as TextContentConfig
  },
  selectedIndexes: {
    type: Array as PropType<string[]>,
    default: []
  },
  creatingIds: {
    type: Array as PropType<string[]>,
    default: []
  }
});

const eventBus = inject<EventBus>('eventBus');
const emits = defineEmits(['update:creatingIds'])

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素
const {loading, setLoading} = useLoading();
const chapterInfos = ref<ChapterInfo[]>([]);
const combineExportModalVisible = ref(false);

const textContentConfig = ref<TextContentConfig>(props.textContentConfig)

const computedFilterRole = computed(() => {
  return Array.from(new Set(chapterInfos.value.map(item => item.role))).map(item => {
    return {
      text: item,
      value: item
    }
  })
})

const roleFilter = ref<string[]>([]);

const filterRole = (value: string[], record: ChapterInfo) => {
  roleFilter.value = value;
  return value.includes(record.role);
}

const columns: TableColumnData[] = [
  {
    title: '序号',
    slotName: 'index',
  },
  {
    title: '角色',
    slotName: 'role',
    filterable: {
      filters: computedFilterRole as any,
      filter: (value, record) => filterRole(value, record as ChapterInfo),
      multiple: true
    }
  },
  {
    title: '文本',
    slotName: 'text'
  },
  {
    title: '模型配置',
    slotName: 'model',
  },
  {
    title: '控制',
    slotName: 'controls',
    filterable: {
      filter: (value, record) => record.name.includes(value),
      slotName: 'controls-filter',
      icon: () => h(IconSettings)
    }
  },
  {
    title: '操作',
    slotName: 'operations',
  },
];

const rowSelection = ref<TableRowSelection>({
  type: 'checkbox',
  showCheckedAll: true,
  onlyCurrent: false,
});

const computedChapterInfos = computed(() => {
  let tmp = chapterInfos.value;
  if (roleFilter.value && roleFilter.value.length > 0) {
    tmp = tmp.filter(item => {
      return roleFilter.value.includes(item.role)
    });
  }
  if (props.selectedIndexes && props.selectedIndexes.length > 0) {
    tmp = tmp.filter(item => {
      return props.selectedIndexes.includes(item.index)
    });
  }
  return tmp;
})

const modelSelectVisible = ref<boolean>(false);
const roleChangeModelVisible = ref<boolean>(false)
const currentChapterInfo = ref<ChapterInfo>({} as ChapterInfo);

const selectedIndexes = ref<string[]>([]);
const handleQueryChapterInfo = async () => {
  const {data} = await queryChapterInfoList({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  chapterInfos.value = data.map((item) => {
    return {
      ...item,
      disabled: !item.audioModelType
    }
  });
  selectedIndexes.value = data.filter(item => item.audioExportFlag).map(item => item.index)
}

const onRoleChange = () => {
  eventBus?.emit(ROLE_CHANGE);
}

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

const playAll = ref(false);
const activeAudioIndex = ref<number>(-1);
const stopAudio = () => {
  if (audioElement.value) {
    // 停止音频播放
    audioElement.value.pause();
    audioElement.value.currentTime = 0; // 将播放进度设置为音频开头
  }
  activeAudioKey.value = '';
  playAll.value = false;
  activeAudioIndex.value = -1;
};

const createAudioKey = ref<string>('');

const handleChapterInfoUpdate = (data: ChapterInfo) => {
  chapterInfos.value = chapterInfos.value.map((item) => {
    if (item.paragraphIndex === data.paragraphIndex
        && item.sentenceIndex === data.sentenceIndex) {
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
const handleCreateAudio = async (record: ChapterInfo) => {
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

const WebSocketService = inject<IWebSocketService>('WebSocketService') as IWebSocketService;


const playNext = () => {
  activeAudioIndex.value += 1;
  const chapterInfo = computedChapterInfos.value[activeAudioIndex.value];
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

const onVolumeChangeEnd = async (chapterInfo: ChapterInfo) => {
  if (audioElement.value && activeAudioKey.value === `${chapterInfo.paragraphIndex}-${chapterInfo.sentenceIndex}`) {
    audioElement.value.volume = chapterInfo.audioVolume;
  }
  await updateVolume(chapterInfo)
}

const onSpeedChange = async (chapterInfo: ChapterInfo) => {
  if (audioElement.value && activeAudioKey.value === `${chapterInfo.paragraphIndex}-${chapterInfo.sentenceIndex}`) {
    audioElement.value.playbackRate = chapterInfo.audioSpeed;
  }
  await updateSpeed(chapterInfo)
}

const onIntervalChange = async (chapterInfo: ChapterInfo) => {
  await updateInterval(chapterInfo)
}

const onCombineExport = () => {
  if (!selectedIndexes.value.length) {
    Modal.warning({
      title: '没有选择导出内容',
      content: '请选择导出内容'
    })
  } else {
    combineExportModalVisible.value = true;
  }
}

const batchControls = ref({
  enableVolume: false,
  volume: 1.0,
  enableSpeed: false,
  speed: 1.0,
  enableInterval: false,
  interval: 300,
})

const handleUpdateControls = async () => {
  if (!batchControls.value.enableVolume
      && !batchControls.value.enableSpeed
      && !batchControls.value.enableInterval) {
    Message.warning("请选择要批量更新的配置？")
  }
  try {
    setLoading(true);
    const {msg} = await updateControls({
      projectId: route.query.projectId as string,
      chapterId: route.query.chapterId as string,
      ...batchControls.value
    });
    batchControls.value = {
      ...batchControls.value,
      enableVolume: false,
      enableSpeed: false,
      enableInterval: false,
    }
    Message.success(msg);
    await handleQueryChapterInfo()
  } finally {
    setLoading(false)
  }
}

const roleChangeEvent = () => {
  handleQueryChapterInfo();
}

onMounted(() => {
  eventBus?.on(ROLE_CHANGE, roleChangeEvent);
});

onBeforeUnmount(() => {
  eventBus?.off(ROLE_CHANGE, roleChangeEvent);
});

defineExpose({playAllAudio, onCombineExport})

watch(
    () => route.query.chapterId,
    () => {
      if (route.query.chapterId) {
        handleQueryChapterInfo()
            .then(() => {
              eventBus?.emit(ROLE_CHANGE);
            });
        WebSocketService.addResultHandler(
            `${route.query.projectId as string}-${route.query.chapterId as string}`, handleChapterInfoUpdate
        );
      }
      selectedIndexes.value = [];
      stopAudio();
    },
    {immediate: true}
);

</script>

<template>
  <div class="container">
    <a-table
        row-key="index"
        :data="chapterInfos"
        :columns="columns"
        :bordered="{cell:true}"
        :pagination="false"
        :row-selection="rowSelection"
        v-model:selected-keys="selectedIndexes"
    >
      <template #index="{ record }">
        <span style="white-space: nowrap">
          {{ record.index }}
        </span>
      </template>
      <template #role="{ record }">
        <div>
          <div>
            <a-dropdown>
              <a-button
                  :type="record.role !== '旁白' ? 'outline' : 'secondary'"
              >
                {{ record.role }}
              </a-button>
              <template #content>
                <a-doption @click="() => {
                    currentChapterInfo = record;
                    roleChangeModelVisible = true;
                }"
                >
                  改角色
                </a-doption>
              </template>
            </a-dropdown>
          </div>
          <div style="margin-top: 5px">
            <a-space>
              <a-tag v-if="record.gender && record.gender!=='未知'" color="blue">
                {{ record.gender }}
              </a-tag>
              <a-tag v-if="record.ageGroup && record.ageGroup!=='未知'" color="green">
                {{ record.ageGroup }}
              </a-tag>
            </a-space>
          </div>
        </div>
      </template>
      <template #model="{ record }">
        <a-dropdown>
          <div v-if="record.audioModelType"
               style="padding: 5px; border: 1px solid #125CFE; border-radius: 2px; cursor: pointer"
          >
            <a-typography-text style="display: block; white-space: nowrap">
              {{ record.audioModelType }}
            </a-typography-text>
            <div v-if="['gpt-sovits'].includes(record.audioModelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ `${record.gptSovitsModel?.modelGroup}/${record.gptSovitsModel?.modelName}` }}
              </a-typography-text>
              <a-typography-text style="display: block; white-space: nowrap">
                {{ `${record.refAudio?.audioGroup}/${record.refAudio?.audioName}/${record.refAudio?.moodName}` }}
              </a-typography-text>
            </div>
            <div v-if="['fish-speech'].includes(record.audioModelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ `${record.fishSpeechModel?.modelGroup}/${record.fishSpeechModel?.modelName}` }}
              </a-typography-text>
              <a-typography-text style="display: block; white-space: nowrap">
                {{ `${record.refAudio?.audioGroup}/${record.refAudio?.audioName}/${record.refAudio?.moodName}` }}
              </a-typography-text>
            </div>
            <div v-if="['chat-tts'].includes(record.audioModelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ record.chatTtsConfig?.configName }}
              </a-typography-text>
            </div>
            <div v-if="['edge-tts'].includes(record.audioModelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ voiceNameFormat(record.audioConfigId) }}
              </a-typography-text>
            </div>
          </div>
          <div v-else>
            <a-button size="mini" type="outline" status="danger">
              未设置
            </a-button>
          </div>
          <template #content>
            <a-doption @click="() => {
                currentChapterInfo = record;
                modelSelectVisible = true;
            }"
            >
              改配置
            </a-doption>
          </template>
        </a-dropdown>
      </template>
      <template #text="{ record }">
        <a-typography-text
            v-model:edit-text="record.text"
            :class="{'lines-color': textContentConfig.showLines && record.dialogueFlag}"
            :editable="props.textContentConfig.textEdit"
            @edit-start="editStart(record)"
            @edit-end="editEnd(record)"
        >
          {{ record.text }}
        </a-typography-text>
      </template>
      <template #controls="{ record }">
        <a-space direction="vertical" style="width: 120px;">
          <div style="display: flex; justify-content: center; align-items: center">
            <span style="white-space: nowrap; font-size: 12px; margin-right: 10px">音量</span>
            <n-slider
                v-model:value="record.audioVolume"
                :step="0.1"
                :max="2"
                :min="0.1"
                :format-tooltip="(value: number) => `${value}x`"
                @dragend="onVolumeChangeEnd(record)"
            >
            </n-slider>
          </div>
          <div style="display: flex; justify-content: center; align-items: center">
            <span style="white-space: nowrap; font-size: 12px; margin-right: 10px">语速</span>
            <n-slider
                v-model:value="record.audioSpeed"
                :step="0.1"
                :max="2"
                :min="0.1"
                :format-tooltip="(value: number) => `${value}x`"
                @dragend="onSpeedChange(record)"
            >
            </n-slider>
          </div>
          <div style="display: flex; justify-content: center; align-items: center">
            <span style="white-space: nowrap; font-size: 12px; margin-right: 10px">间隔</span>
            <n-slider
                v-model:value="record.nextAudioInterval"
                :step="100"
                :max="3000"
                :min="0"
                :format-tooltip="(value: number) => `${value}ms`"
                @dragend="onIntervalChange(record)"
            >
            </n-slider>
          </div>
        </a-space>
      </template>
      <template #controls-filter>
        <a-card>
          <a-space direction="vertical" style="width: 200px;">
            <div style="display: flex; justify-content: center; align-items: center">
              <a-checkbox
                  v-model="batchControls.enableVolume"
                  style="margin-right: 10px"
              >
                <span style="white-space: nowrap">音量</span>
              </a-checkbox>
              <n-slider
                  v-model:value="batchControls.volume"
                  :step="0.1"
                  :max="2"
                  :min="0.1"
                  :format-tooltip="(value: number) => `${value}%`"
              />
            </div>
            <div style="display: flex; justify-content: center; align-items: center">
              <a-checkbox
                  v-model="batchControls.enableSpeed"
                  style="margin-right: 10px"
              >
                <span style="white-space: nowrap">语速</span>
              </a-checkbox>
              <n-slider
                  v-model:value="batchControls.speed"
                  :step="0.1"
                  :max="2"
                  :min="0.1"
                  :format-tooltip="(value: number) => `${value}x`"
              />
            </div>
            <div style="display: flex; justify-content: center; align-items: center">
              <a-checkbox
                  v-model="batchControls.enableInterval"
                  style="margin-right: 10px"
              >
                <span style="white-space: nowrap">间隔</span>
              </a-checkbox>
              <n-slider
                  v-model:value="batchControls.interval"
                  :step="100"
                  :max="3000"
                  :min="0"
                  :format-tooltip="(value: number) => `${value}ms`"
              />
            </div>
            <div style="display: flex; justify-content: right">
              <a-popconfirm
                  content="更新章节所有配置?"
                  type="error"
                  @ok="handleUpdateControls"
              >
                <a-button
                    :loading="loading"
                    type="outline" size="mini"
                >
                  批量更新
                </a-button>
              </a-popconfirm>
            </div>
          </a-space>
        </a-card>
      </template>
      <template #operations="{ record }">
        <a-space direction="vertical" size="small">
          <a-button
              v-if="activeAudioKey === record.index"
              type="outline"
              status="danger"
              size="mini"
              @click="stopAudio"
          >
            <icon-mute-fill/>
          </a-button>
          <a-button
              v-else
              type="outline"
              size="mini"
              :disabled="!record.audioModelType || !record.audioUrl"
              @click="playAudio(record)"
          >
            <icon-play-arrow/>
          </a-button>
          <a-popconfirm
              type="warning"
              content="确认生成?"
              @ok="handleCreateAudio(record)"
          >
            <a-button
                type="outline"
                size="mini"
                :status="props.creatingIds?.includes(record.index) ? 'danger' : 'normal'"
                :disabled="!record.audioModelType || props.creatingIds?.includes(record.index)"
            >
              <icon-refresh
                  :spin="props.creatingIds?.includes(record.index)"
              />
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>
    <audio-select
        v-model:visible="modelSelectVisible"
        :audio-model-config="currentChapterInfo"
        @model-select="modelSelect"
    />
    <role-change-model
        v-model:visible="roleChangeModelVisible"
        :chapter-info="currentChapterInfo"
        @change="onRoleChange"
    />
    <combine-export
        v-model:visible="combineExportModalVisible"
        v-model:selected-indexes="selectedIndexes"
    />
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
.lines-color {
  background-color: #3367D1;
  color: #ffffff;
}
</style>