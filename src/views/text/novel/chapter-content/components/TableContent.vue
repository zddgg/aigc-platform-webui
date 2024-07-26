<script setup lang="ts">
import {computed, h, inject, onBeforeUnmount, onMounted, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message, Modal, Notification, TableColumnData, TableRowSelection} from "@arco-design/web-vue";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import useLoading from "@/hooks/loading.ts";
import {IWebSocketService} from '@/services/textWebsocketService.ts';
import {IconSettings} from "@arco-design/web-vue/es/icon";
import CombineExport from "@/views/text/novel/chapter-content/components/CombineExport.vue";
import {EventBus} from "@/vite-env";
import {ROLE_CHANGE} from "@/types/event-types.ts";
import {AudioModelConfig} from "@/api/model.ts";
import {
  addChapterInfo,
  audioModelChange,
  ChapterInfo,
  chapterInfos as queryChapterInfoList,
  chapterInfoSort,
  createAudio,
  deleteChapterInfo,
  updateChapterText,
  updateControls,
  updateInterval,
  updateSpeed,
  updateVolume
} from "@/api/text-chapter.ts";
import {VueDraggable} from "vue-draggable-plus";
import TextEditor from "@/components/TextEditor.vue";

const route = useRoute();
const props = defineProps({
  textContentConfig: {
    type: Object as PropType<TextContentConfig>,
    default: {} as TextContentConfig
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
const chapterInfos = ref<(ChapterInfo &
    {
      showAudioCard: boolean,
      showAddOtherItem: boolean,
      showAudioControls: boolean,
      newItem: boolean,
    }
    )[]>([]);
const combineExportModalVisible = ref(false);

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
      disabled: !item.audioUrl,
      showAudioCard: false,
      showAddOtherItem: false,
      showAudioControls: false,
      newItem: false,
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

const onTextChange = async (chapterInfo: ChapterInfo) => {
  await updateChapterText(chapterInfo);
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
        audioUrl: data.audioUrl,
        disabled: !data.audioUrl
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

const TextWebsocketService = inject<IWebSocketService>('TextWebsocketService') as IWebSocketService;


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
    return;
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

const handleDeleteChapterInfo = async (chapterInfo: ChapterInfo) => {
  const {msg} = await deleteChapterInfo({
    id: chapterInfo.id
  } as ChapterInfo)
  eventBus?.emit(ROLE_CHANGE)
  Message.success(msg);
}

const addTextItem = (index: number, deleteCount: number) => {
  console.log(index)
  if (deleteCount) {
    chapterInfos.value.splice(index, deleteCount)
  } else {
    chapterInfos.value.splice(index, deleteCount, {newItem: true} as any)
  }
  console.log(chapterInfos.value)
}

const handleAddChapterInfo = async (index: number, text: string) => {
  if (text) {
    const {msg} = await addChapterInfo({
      projectId: route.query.projectId as string,
      chapterId: route.query.chapterId as string,
      text: text,
      sortOrder: index,
    } as ChapterInfo)
    Message.success(msg);
    eventBus?.emit(ROLE_CHANGE)
  }
}

const onDraggableEnd = async () => {
  const params = chapterInfos.value
      .filter((item) => !!item.id)
      .map((item, index) => {
        return {
          id: item.id,
          sortOrder: index,
        } as ChapterInfo
      })
  await chapterInfoSort(params)
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
    async () => {
      if (route.query.chapterId) {
        await handleQueryChapterInfo()
        eventBus?.emit(ROLE_CHANGE)
        TextWebsocketService.addResultHandler(
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
    <a-space direction="vertical" style="width: 100%">
      <vue-draggable
          v-model="chapterInfos"
          :animation="150"
          handle=".handle"
          class="flex flex-col gap-3"
          @end="onDraggableEnd"
      >
        <div
            v-for="(item, index) in chapterInfos"
            :key="item.id"
            class="flex bg-gray-500/5 rounded"
        >
          <div style="width: 100%; display: flex; align-items: center">
            <div
                v-if="props.textContentConfig.edit"
                style="width: 24px; height: 100%;" class="text-card-left-option"
            >
              <div
                  v-if="props.textContentConfig.edit"
                  style="display: flex; place-items: center; justify-content: center"
                  :style="{height: props.textContentConfig.edit ? '50%' : '100%'}"
              >
                <a-checkbox/>
              </div>
              <div
                  v-if="props.textContentConfig.edit"
                  style="height: 50%; display: flex; place-items: center; justify-content: center"
                  class="handle cursor-move"
              >
                <icon-drag-arrow/>
              </div>
            </div>
            <a-card style="flex: 1" :body-style="{padding: '10px 20px'}">
              <div v-if="item.newItem" style="display: flex; align-items: center;">
                <a-textarea v-model="item.text" :auto-size="{minRows: 1, maxRows: 5}" style="flex: 1"/>
                <a-button
                    size="small" type="outline" style="margin-left: 10px"
                    @click="handleAddChapterInfo(index, item.text)"
                >
                  <icon-check/>
                </a-button>
                <a-button
                    size="small" type="outline" status="danger" style="margin-left: 10px"
                    @click="addTextItem(index, 1)"
                >
                  <icon-close/>
                </a-button>
              </div>
              <div v-else style="width: 100%; display: flex; place-items: center">
                <div style="width: 100px">
                  <a-dropdown>
                    <a-button
                        :type="item.role !== '旁白' ? 'outline' : 'secondary'"
                        style="width: 100%; display: flex; text-align: left"
                    >
                      <div style="width: 100%">
                        <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                          {{ item.role }}
                        </a-typography-text>
                      </div>
                    </a-button>
                    <template #content>
                      <a-doption @click="() => {
                          currentChapterInfo = item;
                          roleChangeModelVisible = true;
                        }"
                      >
                        改角色
                      </a-doption>
                    </template>
                  </a-dropdown>
                </div>
                <a-divider direction="vertical"/>
                <div style="width: 160px">
                  <a-dropdown>
                    <div v-if="item.audioModelType">
                      <a-button
                          style="height: 100%; width: 100%; display: flex; flex-direction: column; text-align: left">
                        <div style="width: 100%">
                          <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                            {{ item.audioModelType }}
                          </a-typography-text>
                        </div>
                        <div v-if="['gpt-sovits'].includes(item.audioModelType)" style="width: 100%">
                          <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                            {{ `${item.gptSovitsModel?.modelGroup}/${item.gptSovitsModel?.modelName}` }}
                          </a-typography-text>
                          <a-typography-text v-if="item.audioConfigId !== '-1'" style="display: block; white-space: nowrap">
                            {{ item.gptSovitsConfig?.configName }}
                          </a-typography-text>
                          <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                            {{
                              `${item.refAudio?.audioGroup}/${item.refAudio?.audioName}/${item.refAudio?.moodName}`
                            }}
                          </a-typography-text>
                        </div>
                        <div v-if="['fish-speech'].includes(item.audioModelType)" style="width: 100%">
                          <a-typography-text v-if="item.audioConfigId !== '-1'" style="display: block; white-space: nowrap">
                            {{ item.fishSpeechConfig?.configName }}
                          </a-typography-text>
                          <a-typography-text style="display: block; white-space: nowrap">
                            {{
                              `${item.refAudio?.audioGroup}/${item.refAudio?.audioName}/${item.refAudio?.moodName}`
                            }}
                          </a-typography-text>
                        </div>
                        <div v-if="['chat-tts'].includes(item.audioModelType)" style="width: 100%">
                          <a-typography-text style="display: block; white-space: nowrap">
                            {{ item.chatTtsConfig?.configName }}
                          </a-typography-text>
                        </div>
                        <div v-if="['edge-tts'].includes(item.audioModelType)" style="width: 100%">
                          <a-typography-text style="display: block; white-space: nowrap">
                            {{ voiceNameFormat(item.audioConfigId) }}
                          </a-typography-text>
                        </div>
                      </a-button>
                    </div>
                    <div v-else>
                      <a-button size="mini" type="outline" status="danger">
                        未设置
                      </a-button>
                    </div>
                    <template #content>
                      <a-doption @click="() => {
                        currentChapterInfo = item;
                        modelSelectVisible = true;
                      }"
                      >
                        改配置
                      </a-doption>
                    </template>
                  </a-dropdown>
                </div>
                <a-divider direction="vertical"/>
                <div style="flex: 1">
                  <div>
                    <text-editor :chapter-info="item"/>
                  </div>
                  <div style="margin-top: 10px">
                    <n-select
                        :options="[
                          {
                            label: 'Everybody\'s Got Something to Hide Except Me and My Monkey',
                            value: 'song0',
                          },
                          {
                            label: 'Drive My Car',
                            value: 'song1'
                          }]"
                        size="tiny"
                        filterable
                        tag
                        placeholder="instruct"
                    >

                    </n-select>
                  </div>
                  <div>
                    <a-divider style="margin: 10px 0"/>
                    <div style="height: 24px; display: flex; justify-content: space-between; align-items: center">
                      <div style="height: 100%; display: flex; place-items: center; align-items: center;">
                        <a-space size="small">
                          <a-button
                              v-if="!item.showAudioControls"
                              size="mini"
                              @click="() => (item.showAudioControls = true)"
                          >
                            <icon-settings/>
                            <icon-right/>
                          </a-button>
                          <a-button
                              v-else
                              size="mini"
                              @click="() => (item.showAudioControls = false)"
                          >
                            <icon-left/>
                            <icon-settings/>
                          </a-button>
                          <a-space v-if="item.showAudioControls" size="small">
                            <div style="height: 100%; display: flex; place-items: center">
                              <span style="white-space: nowrap; font-size: 12px">音量</span>
                              <n-slider
                                  v-model:value="item.audioVolume"
                                  style="width: 80px; margin-left: 5px"
                                  :step="0.1"
                                  :max="2"
                                  :min="0.1"
                                  :format-tooltip="(value: number) => `${value}x`"
                                  @dragend="onVolumeChangeEnd(item)"
                              >
                              </n-slider>
                            </div>
                            <div style="height: 100%; display: flex; place-items: center">
                              <span style="white-space: nowrap; font-size: 12px">倍速</span>
                              <n-slider
                                  v-model:value="item.audioSpeed"
                                  style="width: 80px; margin-left: 5px"
                                  :step="0.1"
                                  :max="2"
                                  :min="0.1"
                                  :format-tooltip="(value: number) => `${value}x`"
                                  @dragend="onSpeedChange(item)"
                              >
                              </n-slider>
                            </div>
                            <div style="height: 100%; display: flex; place-items: center">
                              <span style="white-space: nowrap; font-size: 12px">间隔</span>
                              <n-slider
                                  v-model:value="item.nextAudioInterval"
                                  style="width: 80px; margin-left: 5px"
                                  :step="100"
                                  :max="3000"
                                  :min="0"
                                  :format-tooltip="(value: number) => `${value}ms`"
                                  @dragend="onIntervalChange(item)"
                              >
                              </n-slider>
                            </div>
                          </a-space>
                        </a-space>
                      </div>
                      <div>
                        <a-space>
                          <a-button
                              :disabled="!item.audioModelType"
                              size="mini"
                          >
                            <icon-backward/>
                          </a-button>
                          <a-button
                              v-if="activeAudioKey === item.index"
                              type="outline"
                              status="danger"
                              size="mini"
                              @click="stopAudio"
                          >
                            <icon-pause/>
                          </a-button>
                          <a-button
                              v-else
                              size="mini"
                              :disabled="!item.audioModelType"
                              @click="playAudio(item)"
                          >
                            <icon-play-arrow/>
                          </a-button>
                          <a-button
                              :disabled="!item.audioModelType"
                              size="mini"
                          >
                            <icon-forward/>
                          </a-button>
                        </a-space>
                      </div>
                      <div>
                        <a-space>
                          <!--                          <a-button-->
                          <!--                              v-if="!item.showAudioCard"-->
                          <!--                              size="mini"-->
                          <!--                              @click="() => (item.showAudioCard = true)"-->
                          <!--                          >-->
                          <!--                            <icon-down/>-->
                          <!--                          </a-button>-->
                          <!--                          <a-button-->
                          <!--                              v-else-->
                          <!--                              size="mini"-->
                          <!--                              @click="() => (item.showAudioCard = false)"-->
                          <!--                          >-->
                          <!--                            <icon-up/>-->
                          <!--                          </a-button>-->
                          <a-popconfirm
                              type="warning"
                              content="确认生成?"
                              @ok="handleCreateAudio(item)"
                          >
                            <a-button
                                size="mini"
                                :status="props.creatingIds?.includes(item.index) ? 'danger' : 'normal'"
                                :disabled="!item.audioModelType || props.creatingIds?.includes(item.index)"
                            >
                              <icon-refresh
                                  :spin="props.creatingIds?.includes(item.index)"
                              />
                            </a-button>
                          </a-popconfirm>
                          <a-popconfirm
                              v-if="textContentConfig.edit"
                              type="error"
                              content="确认删除?"
                              @ok="handleDeleteChapterInfo(item)"
                          >
                            <a-button size="mini">
                              <icon-delete/>
                            </a-button>
                          </a-popconfirm>
                        </a-space>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a-card>
          </div>
          <div
              v-if="props.textContentConfig.edit"
              style="width: 14px; margin-right: 10px"
              @mouseover="() => (item.showAddOtherItem = true)"
              @mouseleave="() => (item.showAddOtherItem = false)"
          >
            <div
                v-if="item.showAddOtherItem"
                style="height: 50%; display: flex; place-items: center; justify-content: center"
                class="add-other-item"
                @click="addTextItem(index, 0)"
            >
              <icon-plus :size="10"/>
            </div>
            <div
                v-if="item.showAddOtherItem"
                style="height: 50%; display: flex; place-items: center; justify-content: center"
                class="add-other-item"
                @click="addTextItem(index + 1, 0)"
            >
              <icon-plus :size="12"/>
            </div>
          </div>
        </div>
      </vue-draggable>
    </a-space>
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

.add-other-item:hover {
  background-color: #cccccc;
}

.text-card-left-option :deep(.arco-checkbox) {
  padding-left: 0;
}
</style>