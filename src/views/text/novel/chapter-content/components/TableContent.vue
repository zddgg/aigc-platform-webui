<script setup lang="ts">
import {onBeforeUnmount, onMounted, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message, Modal, Notification} from "@arco-design/web-vue";
import {voiceNameFormat} from "@/utils/model-util.ts";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import CombineExport from "@/views/text/novel/chapter-content/components/CombineExport.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import {ROLE_CHANGE} from "@/types/event-types.ts";
import {AudioModelInfoKey, AudioRoleInfo} from "@/api/model.ts";
import {
  addChapterInfo,
  audioModelChange,
  batchOperator,
  ChapterInfo,
  chapterInfos as queryChapterInfoList,
  chapterInfoSort,
  createAudio,
  deleteChapterInfo,
  playAudio,
  startCreateAudio,
  TextContentConfig,
  updateInterval,
  updateSpeed,
  updateVolume
} from "@/api/text-chapter.ts";
import {VueDraggable} from "vue-draggable-plus";
import TextEditor from "@/components/TextEditor.vue";
import ConditionSelect from "@/views/text/novel/chapter-content/components/ConditionSelect.vue";
import {debounce} from 'lodash';
import {COSY_VOICE} from "@/types/model-types.ts";
import AudioParamsChange from "@/views/text/novel/chapter-content/components/AudioParamsChange.vue";
import {AudioTaskState, EventTypes} from "@/types/global.ts";
import emitter from "@/mitt";

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

const emits = defineEmits(['update:creatingIds'])

const editMode = ref<'default' | 'batch'>('default')

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素
const chapterInfos = ref<(ChapterInfo &
    {
      showAudioCard: boolean,
      showAddOtherItem: boolean,
      newItem: boolean,
      selected: boolean,
    }
    )[]>([]);

const combineExportModalVisible = ref(false);
const conditionSelectVisible = ref(false);
const modelSelectVisible = ref<boolean>(false);
const roleChangeModelVisible = ref<boolean>(false)
const audioParamsChangeModelVisible = ref<boolean>(false)

const currentChapterInfo = ref<ChapterInfo>({} as ChapterInfo);

const selectedIds = ref<number[]>([]);
const handleQueryChapterInfo = async () => {
  const {data} = await queryChapterInfoList({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  chapterInfos.value = data.map((item) => {
    return {
      ...item,
      showAudioCard: false,
      showAddOtherItem: false,
      newItem: false,
      selected: false,
    }
  });
}

const onRoleChange = () => {
  emitter?.emit(ROLE_CHANGE);
}

const modelSelect = async (modelConfig: AudioModelInfoKey) => {

  const {msg} = await audioModelChange({
    projectId: currentChapterInfo.value.projectId,
    chapterId: currentChapterInfo.value.chapterId,
    ...modelConfig,
    ids: editMode.value === 'batch' ? selectedIds.value : [currentChapterInfo.value.id]
  });
  currentChapterInfo.value = {} as any;
  Message.success(msg);
  await handleQueryChapterInfo();
}

let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;

const startPlayAudio = (chapterInfo: ChapterInfo, url: string) => {
  if (audioElement.value && url) {
    audioElement.value.src = url;
    audioElement.value.playbackRate = chapterInfo.audioSpeed;

    if (!audioContext) {
      audioContext = new AudioContext();
    }

    if (!gainNode) {
      const source = audioContext.createMediaElementSource(audioElement.value);
      gainNode = audioContext.createGain();
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
    }

    gainNode.gain.value = chapterInfo.audioVolume; // 这里可以设置音量大于1的值

    audioElement.value.play();
  }
}

const activeAudioKey = ref<string>('');
const handlePlayAudio = async (chapterInfo: ChapterInfo) => {

  if (chapterInfo.audioFiles) {
    const response = await playAudio(chapterInfo);
    const url = URL.createObjectURL(response.data);

    activeAudioKey.value = chapterInfo.index;

    startPlayAudio(chapterInfo, url);

    playAll.value = false;
    activeAudioIndex.value = -1;
  }
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

const wsDataHandler = (data: any) => {
  if (data?.state === "success" && data?.chapterInfo) {
    chapterInfos.value = chapterInfos.value.map((item) => {
      if (item.index === data?.chapterInfo?.index) {
        return {
          ...item,
          ...data?.chapterInfo,
        }
      }
      return item;
    });
    Notification.success({
      title: `${data?.chapterInfo?.index} 音频生成成功`,
      content: '',
      position: 'topRight',
      duration: 2000
    })
  }
};

const handleCreateAudio = async (record: ChapterInfo) => {
  try {
    createAudioKey.value = record.index;
    await createAudio(record)
  } finally {
    createAudioKey.value = ''
  }
}

const playNext = () => {
  activeAudioIndex.value += 1;
  const chapterInfo = chapterInfos.value[activeAudioIndex.value];
  if (chapterInfo && chapterInfo.audioFiles) {
    setTimeout(async () => {
      const response = await playAudio(chapterInfo);
      const url = URL.createObjectURL(response.data);
      activeAudioKey.value = chapterInfo.index;
      startPlayAudio(chapterInfo, url)
    }, 300);
  } else {
    activeAudioIndex.value = -1;
    activeAudioKey.value = '';
  }
};

const playAllAudio = (startIndex: string) => {
  playAll.value = true;
  let start = -1
  chapterInfos.value.forEach((item, index) => {
    if (item.index === startIndex) {
      start = index - 1;
    }
  })
  activeAudioIndex.value = start;
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

const handleAudioBackward = (chapterInfo: ChapterInfo) => {
  if (audioElement.value && chapterInfo.index === activeAudioKey.value) {
    audioElement.value.currentTime = Math.max(0, audioElement.value.currentTime - 3);
  }
};

const handleAudioForward = (chapterInfo: ChapterInfo) => {
  if (audioElement.value && chapterInfo.index === activeAudioKey.value) {
    audioElement.value.currentTime = Math.min(audioElement.value.duration, audioElement.value.currentTime + 3);
  }
};

const debouncedUpdateVolume = debounce(async (chapterInfo: ChapterInfo) => {
  await updateVolume(chapterInfo);
}, 2000);

const onVolumeChangeEnd = (chapterInfo: ChapterInfo) => {
  if (gainNode && chapterInfo.index === activeAudioKey.value) {
    gainNode.gain.value = chapterInfo.audioVolume;
  }
  debouncedUpdateVolume(chapterInfo);
};

const debouncedUpdateSpeed = debounce(async (chapterInfo: ChapterInfo) => {
  await updateSpeed(chapterInfo);
}, 2000);

const onSpeedChange = (chapterInfo: ChapterInfo) => {
  if (audioElement.value && chapterInfo.index === activeAudioKey.value) {
    audioElement.value.playbackRate = chapterInfo.audioSpeed;
  }
  debouncedUpdateSpeed(chapterInfo);
};

const onIntervalChange = debounce(async (chapterInfo: ChapterInfo) => {
  await updateInterval(chapterInfo);
}, 2000);

const handleDeleteChapterInfo = async (chapterInfo: ChapterInfo) => {
  const {msg} = await deleteChapterInfo({
    id: chapterInfo.id
  } as ChapterInfo)
  emitter?.emit(ROLE_CHANGE)
  Message.success(msg);
}

const addTextItem = (index: number, deleteCount: number) => {
  if (deleteCount) {
    chapterInfos.value.splice(index, deleteCount)
  } else {
    chapterInfos.value.splice(index, deleteCount, {newItem: true} as any)
  }
}

const handleAddChapterInfo = async (index: number, text: string) => {
  if (text) {
    const {msg} = await addChapterInfo({
      projectId: route.query.projectId as string,
      chapterId: route.query.chapterId as string,
      text: text,
      textSort: index,
    } as ChapterInfo)
    Message.success(msg);
    emitter?.emit(ROLE_CHANGE)
  }
}

const onDraggableEnd = async () => {
  const params = chapterInfos.value
      .filter((item) => !!item.id)
      .map((item, index) => {
        return {
          id: item.id,
          textSort: index,
        } as ChapterInfo
      })
  await chapterInfoSort(params)
}

const handleSelectAllValue = (value: boolean) => {
  chapterInfos.value = chapterInfos.value
      .map((item) => {
        return {
          ...item,
          selected: value
        }
      })
}

const handleBatchOperator = (onSuccess: () => void) => {
  selectedIds.value = chapterInfos.value
      .filter((item) => item.selected)
      .map((item) => item.id);

  if (!selectedIds.value.length) {
    Modal.warning({
      title: '没有选择操作内容',
      content: '请选择操作内容'
    });
  } else {
    onSuccess();
  }
};

const handleBatchRoleChange = () => {
  handleBatchOperator(() => {
    editMode.value = 'batch'
    roleChangeModelVisible.value = true;
  });
}

const handleBatchModelChange = () => {
  handleBatchOperator(() => {
    editMode.value = 'batch'
    modelSelectVisible.value = true;
  });
}

const handleAudioParamsChange = () => {
  handleBatchOperator(() => {
    editMode.value = 'batch'
    audioParamsChangeModelVisible.value = true;
  });
}

const handleCombineExport = () => {
  handleBatchOperator(() => {
    combineExportModalVisible.value = true;
  });
}

const handleMarkupDialogue = (dialogueFlag: boolean) => {
  handleBatchOperator(() => {
    Modal.warning({
      title: dialogueFlag ? `给这(${selectedIds.value.length})个文本添加对话标记？` : `取消这(${selectedIds.value.length})个文本的对话标记？`,
      content: '',
      onOk: async () => {
        const {msg} = await batchOperator({
          projectId: route.query.projectId as string,
          chapterId: route.query.chapterId as string,
          chapterInfoIds: selectedIds.value,
          operatorType: 'dialogue_markup',
          booleanValue: dialogueFlag
        })
        Message.success(msg);
        emitter.emit(EventTypes.chapter_title_refresh)
        emitter.emit(EventTypes.chapter_info_refresh)
        emitter.emit(EventTypes.chapter_role_refresh)
      }
    });
  });
}

const handleBatchDelete = () => {
  handleBatchOperator(() => {
    Modal.error({
      title: `批量删除这(${selectedIds.value.length})个文本？`,
      content: '',
      onOk: async () => {
        const {msg} = await batchOperator({
          projectId: route.query.projectId as string,
          chapterId: route.query.chapterId as string,
          chapterInfoIds: selectedIds.value,
          operatorType: 'delete',
        });
        Message.success(msg);
        emitter.emit(EventTypes.chapter_title_refresh)
        emitter.emit(EventTypes.chapter_info_refresh)
        emitter.emit(EventTypes.chapter_role_refresh)
      }
    });
  });
}

const handleConditionSelect = (value: boolean) => {
  conditionSelectVisible.value = value
}

const handleStartCreateAudio = async (actionType: string, chapterInfoIds: number[]) => {
  await startCreateAudio({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
    actionType: actionType,
    chapterInfoIds: chapterInfoIds
  });
}

const handleAudioGenerate = (actionType: 'all' | 'modified' | 'selected') => {
  selectedIds.value = chapterInfos.value
      .filter((item) => item.selected)
      .map((item) => item.id);

  if (actionType === 'selected' && !selectedIds.value.length) {
    Modal.warning({
      title: '没有选择操作内容',
      content: '请选择操作内容'
    });
  } else {
    Modal.warning({
      title: actionType === 'all'
          ? '全部重新生成？'
          : actionType === 'modified'
              ? '增量修改生成？'
              : `生成选中部分(${selectedIds.value.length})？`,
      content: '',
      onOk() {
        handleStartCreateAudio(actionType, selectedIds.value);
      },
    })
  }
}

const onConditionSelect = (audioRoleInfo: AudioRoleInfo) => {
  chapterInfos.value = chapterInfos.value
      .map((item) => {
        let selected = true;

        if (!!audioRoleInfo.role) {
          selected = selected && audioRoleInfo.role === item.role;
        }
        if (!!audioRoleInfo.amType) {
          selected = selected && audioRoleInfo.amType === item.amType;
        }
        if (!!audioRoleInfo.amPaId) {
          selected = selected && audioRoleInfo.amPaId === item.amPaId;
        }
        if (!!audioRoleInfo.amMfId) {
          selected = selected && audioRoleInfo.amMfId === item.amMfId;
        }
        if (!!audioRoleInfo.amMcId) {
          selected = selected && audioRoleInfo.amMcId === item.amMcId;
        }
        return {
          ...item,
          selected: item.selected || selected
        }
      })
}

defineExpose({
  playAllAudio,
  handleSelectAllValue,
  handleConditionSelect,
  handleAudioGenerate,

  handleBatchRoleChange,
  handleBatchModelChange,
  handleAudioParamsChange,
  handleCombineExport,
  handleMarkupDialogue,
  handleBatchDelete
})

onMounted(() => {
  emitter?.on(ROLE_CHANGE, handleQueryChapterInfo);
  emitter?.on(EventTypes.chapter_info_refresh, handleQueryChapterInfo);
  emitter?.on(EventTypes.audio_generate_result, wsDataHandler);
});

onBeforeUnmount(() => {
  emitter?.off(ROLE_CHANGE, handleQueryChapterInfo);
  emitter?.off(EventTypes.chapter_info_refresh, handleQueryChapterInfo);
  emitter?.off(EventTypes.audio_generate_result, wsDataHandler);
});

watch(
    () => route.query.chapterId,
    async () => {
      if (route.query.chapterId) {
        await handleQueryChapterInfo()
      }
      selectedIds.value = [];
      stopAudio();
    },
    {immediate: true}
);

</script>

<template>
  <div class="container">
    <vue-draggable
        v-model="chapterInfos"
        :animation="150"
        handle=".handle"
        class="flex flex-col gap-3"
        :on-update="onDraggableEnd"
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
                style="height: 50%; display: flex; place-items: center; justify-content: center"
                :style="{height: props.textContentConfig.edit ? '50%' : '100%'}"
            >
              <a-checkbox v-model="item.selected"/>
            </div>
            <div
                style="height: 50%; display: flex; place-items: center; justify-content: center"
                class="handle cursor-move"
            >
              <icon-drag-arrow/>
            </div>
          </div>
          <div
              class="flex-1 px-5 py-2.5 bg-white border rounded-sm"
              :style="textContentConfig.showDialogue && item.dialogueFlag && {backgroundColor: '#E8F3FF'}"
          >
            <div v-if="item.newItem" class="flex items-center">
              <a-textarea v-model="item.text" :auto-size="{minRows: 1, maxRows: 5}" style="flex: 1"/>
              <a-button
                  size="small" type="outline" class="ml-2.5"
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
            <div v-else style="position: relative; width: 100%; display: flex; place-items: center">
              <div style="position: absolute; top: 0; left: 0; font-size: 12px; display: flex; justify-content: space-between; width: 100px">
                <div>
                  <span>
                  {{ item.index }}
                  </span>
                  <icon-check-circle-fill
                      v-if="item.audioTaskState >= AudioTaskState.created"
                      style="color: #00B42A; margin-left: 4px"
                  />
                  <icon-info-circle
                      v-else-if="item.audioTaskState >= AudioTaskState.modified"
                      style="color: #FF7D00; margin-left: 4px"
                  />
                </div>
                <div v-if="item.textMood" style="margin-left: 4px">
                  {{ item.textMood }}
                </div>
              </div>
              <div style="width: 100px">
                <a-dropdown>
                  <a-button
                      :status="item.role === '旁白'
                        ? 'normal'
                        : item.gender === '男'
                         ? 'success'
                         : item.gender === '女'
                         ? 'danger'
                         : 'warning'"
                      style="width: 100%; display: flex; text-align: left"
                  >
                    <div style="width: 100%">
                      <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                        {{ `${item.role}` }}
                      </a-typography-text>
                    </div>
                  </a-button>
                  <template #content>
                    <a-doption @click="() => {
                        editMode = 'default';
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
                  <a-button
                      v-if="item.amType"
                      style="width: 100%; height: 100%; display: flex; flex-direction: column; text-align: left"
                  >
                    <div style="width: 100%">
                      <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                        {{ item.amType }}
                      </a-typography-text>
                    </div>
                    <div v-if="['gpt-sovits'].includes(item.amType)" style="width: 100%">
                      <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                        {{ `${item.amMfGroup}/${item.amMfRole}` }}
                      </a-typography-text>
                      <a-typography-text v-if="item.amMcId !== '-1'"
                                         style="display: block; white-space: nowrap">
                        {{ item.amMcName }}
                      </a-typography-text>
                      <a-typography-text style="display: block; white-space: nowrap" ellipsis>
                        {{
                          `${item.amPaGroup}/${item.amPaRole}/${item.amPaMood}`
                        }}
                      </a-typography-text>
                    </div>
                    <div v-if="['fish-speech'].includes(item.amType)" style="width: 100%">
                      <a-typography-text v-if="item.amMcId !== '-1'"
                                         style="display: block; white-space: nowrap">
                        {{ item.amMcName }}
                      </a-typography-text>
                      <a-typography-text style="display: block; white-space: nowrap">
                        {{
                          `${item.amPaGroup}/${item.amPaRole}/${item.amPaMood}`
                        }}
                      </a-typography-text>
                    </div>
                    <div v-if="['chat-tts'].includes(item.amType)" style="width: 100%">
                      <a-typography-text style="display: block; white-space: nowrap">
                        {{ item.amMcName }}
                      </a-typography-text>
                    </div>
                    <div v-if="['edge-tts'].includes(item.amType)" style="width: 100%">
                      <a-typography-text style="display: block; white-space: nowrap">
                        {{ voiceNameFormat(item.amMcName) }}
                      </a-typography-text>
                    </div>
                    <div v-if="[COSY_VOICE].includes(item.amType)" style="width: 100%">
                      <a-typography-text style="display: block; white-space: nowrap">
                        {{ JSON.parse(item.amMcParamsJson)?.role }}
                      </a-typography-text>
                      <a-typography-text
                          v-if="JSON.parse(item.amMcParamsJson)?.mode === 'custom'"
                          style="display: block; white-space: nowrap"
                          ellipsis
                      >
                        {{
                          `${item.amPaGroup}/${item.amPaRole}/${item.amPaMood}`
                        }}
                      </a-typography-text>
                      <a-typography-text
                          v-if="JSON.parse(item.amMcParamsJson)?.mode === 'advanced'"
                          style="display: block; white-space: nowrap"
                      >
                        {{ item.amMcName }}
                      </a-typography-text>
                    </div>
                  </a-button>
                  <a-button style="" v-else type="outline" status="danger">
                    未设置
                  </a-button>
                  <template #content>
                    <a-doption @click="() => {
                        editMode = 'default';
                        currentChapterInfo = item;
                        modelSelectVisible = true;
                      }"
                    >
                      改模型
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
              <a-divider direction="vertical"/>
              <div style="flex: 1">
                <div>
                  <text-editor
                      :chapter-info="item"
                      :text-content-config="textContentConfig"
                      @change="handleQueryChapterInfo"
                  />
                </div>
                <div>
                  <a-divider style="margin: 10px 0"/>
                  <div style="height: 24px; display: flex; justify-content: space-between; align-items: center">
                    <div style="height: 100%; display: flex; place-items: center; align-items: center;">
                      <div style="height: 100%; display: flex; place-items: center; font-size: 12px">
                        <span style="white-space: nowrap; margin-right: 5px">音量</span>
                        <n-slider
                            v-if="textContentConfig.edit"
                            v-model:value="item.audioVolume"
                            style="width: 80px"
                            :step="0.1"
                            :max="2"
                            :min="0"
                            :format-tooltip="(value: number) => `${value}x`"
                            @dragend="onVolumeChangeEnd(item)"
                        >
                        </n-slider>
                        <span v-else>
                            {{ `${item.audioVolume}` }}
                          </span>
                      </div>
                      <a-divider direction="vertical"/>
                      <div style="height: 100%; display: flex; place-items: center; font-size: 12px">
                        <span style="white-space: nowrap; margin-right: 5px">倍速</span>
                        <n-slider
                            v-if="textContentConfig.edit"
                            v-model:value="item.audioSpeed"
                            style="width: 80px"
                            :step="0.1"
                            :max="2"
                            :min="0.1"
                            :format-tooltip="(value: number) => `${value}x`"
                            @dragend="onSpeedChange(item)"
                        >
                        </n-slider>
                        <span v-else>
                            {{ `${item.audioSpeed}x` }}
                          </span>
                      </div>
                      <a-divider direction="vertical"/>
                      <div style="height: 100%; display: flex; place-items: center; font-size: 12px">
                        <span style="white-space: nowrap; margin-right: 5px">间隔</span>
                        <n-slider
                            v-if="textContentConfig.edit"
                            v-model:value="item.audioInterval"
                            style="width: 80px"
                            :step="100"
                            :max="3000"
                            :min="0"
                            :format-tooltip="(value: number) => `${value}ms`"
                            @dragend="onIntervalChange(item)"
                        >
                        </n-slider>
                        <span v-else>
                            {{ `${item.audioInterval}ms` }}
                          </span>
                      </div>
                    </div>
                    <div>
                      <a-space>
                        <a-button
                            :disabled="!item.audioFiles"
                            size="mini"
                            @click="handleAudioBackward(item)"
                        >
                          <icon-backward/>
                        </a-button>
                        <div>
                          <a-button
                              v-if="activeAudioKey === item.index"
                              type="primary"
                              size="mini"
                              @click="stopAudio"
                          >
                            <icon-pause/>
                          </a-button>
                          <a-button
                              v-else
                              size="mini"
                              :disabled="!item.audioFiles"
                              @click="handlePlayAudio(item)"
                          >
                            <icon-play-arrow/>
                          </a-button>
                        </div>
                        <a-button
                            :disabled="!item.audioFiles"
                            size="mini"
                            @click="handleAudioForward(item)"
                        >
                          <icon-forward/>
                        </a-button>
                      </a-space>
                    </div>
                    <div>
                      <a-space>
                        <a-popconfirm
                            type="warning"
                            content="确认生成?"
                            @ok="handleCreateAudio(item)"
                        >
                          <a-button
                              size="mini"
                              :status="props.creatingIds?.includes(item.index) ? 'danger' : 'normal'"
                              :disabled="!item.amType || props.creatingIds?.includes(item.index)"
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
          </div>
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
    <audio-select
        v-model:visible="modelSelectVisible"
        :audio-model-info="currentChapterInfo"
        @model-select="modelSelect"
    />
    <role-change-model
        v-model:visible="roleChangeModelVisible"
        :chapter-info="currentChapterInfo"
        :chapter-info-ids="selectedIds"
        :edit-mode="editMode"
        @change="onRoleChange"
    />
    <combine-export
        v-model:visible="combineExportModalVisible"
        v-model:chapter-info-ids="selectedIds"
    />
    <condition-select
        v-model:visible="conditionSelectVisible"
        @select="onConditionSelect"
    />
    <audio-params-change
        v-model:visible="audioParamsChangeModelVisible"
        v-model:chapter-info-ids="selectedIds"
        @change="handleQueryChapterInfo"
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