<script setup lang="ts">
import {computed, h, inject, onBeforeUnmount, onMounted, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message, Modal, TableColumnData, TableRowSelection} from "@arco-design/web-vue";
import {
  ChapterInfo,
  createAudio,
  queryChapterInfo,
  textModelChange,
  updateChapterText,
  updateControls,
  updateInterval,
  updateSpeed,
  updateVolume
} from "@/api/text.ts";
import {audioNameFormat, modelNameFormat, voiceNameFormat} from "@/utils/model-util.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import useLoading from "@/hooks/loading.ts";
import {IWebSocketService} from '@/services/websocketService.ts';
import {IconSettings} from "@arco-design/web-vue/es/icon";
import CombineExport from "@/views/text/novel/chapter-content/components/CombineExport.vue";
import {EventBus} from "@/vite-env";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {ModelConfig} from "@/api/model.ts";
import { Notification } from '@arco-design/web-vue';

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
    title: 'index',
    dataIndex: 'index',
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
    title: '模型',
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
  const {data} = await queryChapterInfo({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
  })
  chapterInfos.value = data.map((item) => {
    return {
      ...item,
      disabled: !item.modelType
    }
  });
  console.log(chapterInfos.value)
  selectedIndexes.value = data.filter(item => item.export).map(item => item.index)
}

const onRoleChange = () => {
  eventBus?.emit(ROLE_CHANGE);
}

const modelSelect = async (modelConfig: ModelConfig) => {

  const {msg} = await textModelChange({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: {
      ...currentChapterInfo.value,
      ...modelConfig,
    },
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
  const {msg} = await updateChapterText({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: chapterInfo,
  });
  Message.success(msg);
}

const activeAudioKey = ref<string>('');
const playAudio = (chapterInfo: ChapterInfo) => {
  const url = chapterInfo.audioUrl;

  activeAudioKey.value = `${chapterInfo.p}-${chapterInfo.s}`;
  if (audioElement.value && url) {
    audioElement.value.src = url;
    audioElement.value.volume = chapterInfo.volume / 100;
    audioElement.value.playbackRate = chapterInfo.speed;
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

const createAudioKey = ref<string>('');

const handleChapterInfoUpdate = (data: ChapterInfo) => {
  chapterInfos.value = chapterInfos.value.map((item) => {
    if (item.p === data.p && item.s === data.s) {
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
    const {data, msg} = await createAudio({
      chapter: {
        project: route.query.project as string,
        chapter: route.query.chapter as string,
      },
      chapterInfo: record
    })
    Message.success(msg);
    emits('update:creatingIds', data)
  } finally {
    createAudioKey.value = ''
    setLoading(false);
  }
}

const WebSocketService = inject<IWebSocketService>('WebSocketService') as IWebSocketService;

const playAll = ref(false);
const activeAudioIndex = ref<number>(-1);

const playNext = () => {
  activeAudioIndex.value += 1;
  const chapterInfo = computedChapterInfos.value[activeAudioIndex.value];
  if (chapterInfo) {
    setTimeout(() => {
      playAudio(chapterInfo);
    }, 500);
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
  if (audioElement.value && activeAudioKey.value === `${chapterInfo.p}-${chapterInfo.s}`) {
    audioElement.value.volume = chapterInfo.volume / 100;
  }
  await updateVolume({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: chapterInfo,
  })
}

const onSpeedChange = async (chapterInfo: ChapterInfo) => {
  if (audioElement.value && activeAudioKey.value === `${chapterInfo.p}-${chapterInfo.s}`) {
    audioElement.value.playbackRate = chapterInfo.speed;
  }
  await updateSpeed({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: chapterInfo,
  })
}

const onIntervalChange = async (chapterInfo: ChapterInfo) => {
  await updateInterval({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: chapterInfo,
  })
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
  volume: 100,
  enableSpeed: false,
  speed: 1.0,
  enableInterval: false,
  interval: 500,
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
      project: route.query.project as string,
      chapter: route.query.chapter as string,
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
    () => route.query.chapter,
    () => {
      handleQueryChapterInfo();
      if (route.query.chapter as string) {
        WebSocketService.addResultHandler(
            `${route.query.project as string}-${route.query.chapter as string}`, handleChapterInfoUpdate
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
    <!--    <a-space size="small" direction="vertical">-->
    <!--      <a-card-->
    <!--          v-for="(item, index) in chapterInfos"-->
    <!--          :key="index"-->
    <!--          :body-style="{padding: '10px'}"-->
    <!--      >-->

    <!--        <a-descriptions-->
    <!--            :column="5"-->
    <!--            bordered-->
    <!--            table-layout="fixed"-->
    <!--        >-->
    <!--          <a-descriptions-item label="角色" :span="1">-->
    <!--            {{ item.role }}-->
    <!--          </a-descriptions-item>-->
    <!--          <a-descriptions-item label="性别" :span="1">-->
    <!--            {{ item.gender }}-->
    <!--          </a-descriptions-item>-->
    <!--          <a-descriptions-item label="年龄" :span="1">-->
    <!--            {{ item.ageGroup }}-->
    <!--          </a-descriptions-item>-->
    <!--        </a-descriptions>-->
    <!--        <a-descriptions-->
    <!--            :column="5"-->
    <!--            bordered-->
    <!--            table-layout="fixed"-->
    <!--        >-->
    <!--          <a-descriptions-item label="模型类型" :span="1">-->
    <!--            {{ item.modelType }}-->
    <!--          </a-descriptions-item>-->
    <!--          <a-descriptions-item label="模型" :span="1">-->
    <!--            {{ modelNameFormat(item) }}-->
    <!--          </a-descriptions-item>-->
    <!--          <a-descriptions-item label="音频" :span="2">-->
    <!--            {{ audioNameFormat(item) }}-->
    <!--          </a-descriptions-item>-->
    <!--        </a-descriptions>-->
    <!--        <a-descriptions-->
    <!--            :column="5"-->
    <!--            bordered-->
    <!--            table-layout="fixed"-->
    <!--        >-->
    <!--          <a-descriptions-item label="台词" :span="5">-->
    <!--            {{ item.text }}-->
    <!--          </a-descriptions-item>-->
    <!--        </a-descriptions>-->
    <!--        <div style="text-align: center; margin-top: 10px">-->
    <!--          <a-space size="large">-->
    <!--            <a-tooltip content="播放">-->
    <!--              <a-button type="outline" size="mini">-->
    <!--                <icon-play-arrow />-->
    <!--              </a-button>-->
    <!--            </a-tooltip>-->
    <!--            <a-tooltip content="生成">-->
    <!--              <a-button type="outline" size="mini">-->
    <!--                <icon-refresh />-->
    <!--              </a-button>-->
    <!--            </a-tooltip>-->
    <!--          </a-space>-->
    <!--        </div>-->
    <!--      </a-card>-->
    <!--    </a-space>-->
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
        {{ `${record.p}-${record.s}` }}
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
          <div v-if="record.modelType"
               style="padding: 5px; border: 1px solid #125CFE; border-radius: 2px; cursor: pointer"
          >
            <a-typography-text style="display: block; white-space: nowrap">
              {{ record.modelType }}
            </a-typography-text>
            <div v-if="['gpt-sovits', 'fish-speech'].includes(record.modelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ modelNameFormat(record) }}
              </a-typography-text>
              <a-typography-text style="display: block; white-space: nowrap">
                {{ audioNameFormat(record) }}
              </a-typography-text>
            </div>
            <div v-if="['edge-tts'].includes(record.modelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ voiceNameFormat(record.model[0]) }}
              </a-typography-text>
            </div>
            <div v-if="['chat-tts'].includes(record.modelType)">
              <a-typography-text style="display: block; white-space: nowrap">
                {{ record.chatTtsConfig.configName }}
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
              改模型
            </a-doption>
          </template>
        </a-dropdown>
      </template>
      <template #text="{ record }">
        <a-typography-text
            v-model:edit-text="record.text"
            :class="{'lines-color': textContentConfig.showLines && record.linesFlag}"
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
                v-model:value="record.volume"
                :step="1"
                :max="200"
                :min="0"
                :format-tooltip="(value: number) => `${value}%`"
                @dragend="onVolumeChangeEnd(record)"
            >
            </n-slider>
          </div>
          <div style="display: flex; justify-content: center; align-items: center">
            <span style="white-space: nowrap; font-size: 12px; margin-right: 10px">语速</span>
            <n-slider
                v-model:value="record.speed"
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
                v-model:value="record.interval"
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
                  :step="1"
                  :max="200"
                  :min="0"
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
              v-if="activeAudioKey === `${record.p}-${record.s}`"
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
              :disabled="!record.modelType"
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
                :disabled="!record.modelType || props.creatingIds?.includes(record.index)"
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
        :model-config="currentChapterInfo"
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