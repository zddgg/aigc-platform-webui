<script setup lang="ts">
import {computed, inject, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message, TableColumnData, TableRowSelection} from "@arco-design/web-vue";
import {ChapterInfo, createAudio, queryChapterInfo, textModelChange, updateChapterText} from "@/api/text.ts";
import {audioNameFormat, modelNameFormat, voiceNameFormat} from "@/utils/model-util.ts";
import {ModelSelect} from "@/api/ref-audio.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import useLoading from "@/hooks/loading.ts";
import {IWebSocketService} from '@/services/websocketService.ts';

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
  }
});

const emits = defineEmits(['update:selectedIndexes']);


const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素
const {loading, setLoading} = useLoading();
const chapterInfos = ref<ChapterInfo[]>([]);

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
    title: '模型',
    slotName: 'model',
  },
  {
    title: '台词',
    slotName: 'text'
  },
  {
    title: '控制',
    slotName: 'controls',
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
    tmp =  tmp.filter(item => {
      return roleFilter.value.includes(item.role)
    });
  }
  if (props.selectedIndexes && props.selectedIndexes.length > 0) {
    tmp =  tmp.filter(item => {
      return props.selectedIndexes.includes(item.index)
    });
  }
  return tmp;
})

const modelSelectVisible = ref<boolean>(false);
const roleChangeModelVisible = ref<boolean>(false)
const currentChapterInfo = ref<ChapterInfo>({} as ChapterInfo);

const onChangeRole = (chapterInfo: ChapterInfo) => {
  currentChapterInfo.value = chapterInfo;
  roleChangeModelVisible.value = true;
}

const onChangeModel = (chapterInfo: ChapterInfo) => {
  currentChapterInfo.value = chapterInfo;
  modelSelectVisible.value = true;
}

const handleQueryChapterInfo = async () => {
  const {data} = await queryChapterInfo({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
  })
  chapterInfos.value = data;
}

const refresh = () => {
  handleQueryChapterInfo();
}

const modelSelect = async (modelSelect: ModelSelect) => {

  chapterInfos.value = chapterInfos.value.map((item) => {
    if (item.p === currentChapterInfo.value.p && item.s === currentChapterInfo.value.s) {
      return {
        ...item,
        ...modelSelect
      };
    }
    return item;
  });

  const {msg} = await textModelChange({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: {
      ...currentChapterInfo.value,
      ...modelSelect,
    },
  });
  Message.success(msg);
  refresh();
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
  })
};
const handleCreateAudio = async (record: ChapterInfo) => {
  try {
    createAudioKey.value = `${record.p}-${record.s}`;
    setLoading(true);
    const {data, msg} = await createAudio({
      chapter: {
        project: route.query.project as string,
        chapter: route.query.chapter as string,
      },
      chapterInfo: record
    })
    handleChapterInfoUpdate({
      ...data
    })
    Message.success(msg);
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

const onVolumeChange = (number: number, chapterInfo: ChapterInfo) => {
  if (audioElement.value && activeAudioKey.value === `${chapterInfo.p}-${chapterInfo.s}`) {
    audioElement.value.volume = number / 100;
  }
}

const onSpeedChange = (number: number, chapterInfo: ChapterInfo) => {
  if (audioElement.value && activeAudioKey.value === `${chapterInfo.p}-${chapterInfo.s}`) {
    audioElement.value.playbackRate = number;
  }
}

const onVolumeChangeEnd = (chapterInfo: ChapterInfo) => {
  console.log(chapterInfo)
}

const onSpeedChangeEnd = (chapterInfo: ChapterInfo) => {
  console.log(chapterInfo)
}

const selectedIndexes = ref([]);
const onSelectionChange = (rowKeys: (string | number)[]) => {
  emits('update:selectedIndexes', rowKeys)
}

defineExpose({playAllAudio, refresh})

watch(
    () => route.query.chapter,
    () => {
      handleQueryChapterInfo();
      if (route.query.chapter as string) {
        WebSocketService.addMessageHandler(
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
        @selectionChange="onSelectionChange"
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
                <a-doption @click="onChangeRole(record)">改角色</a-doption>
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
            <a-typography-text
                v-if="record.modelType === 'edge-tts'"
                style="display: block; white-space: nowrap">
              {{ voiceNameFormat(record.model[0]) }}
            </a-typography-text>
            <a-typography-text
                v-else
                style="display: block; white-space: nowrap">
              {{ modelNameFormat(record) }}
            </a-typography-text>
            <a-typography-text style="display: block; white-space: nowrap">
              {{ audioNameFormat(record) }}
            </a-typography-text>
          </div>
          <div v-else>
            <a-button size="mini" type="outline" status="danger">
              未设置
            </a-button>
          </div>
          <template #content>
            <a-doption @click="onChangeModel(record)">改模型</a-doption>
          </template>
        </a-dropdown>
      </template>
      <template #text="{ record }">
        <a-typography-text
            v-model:edit-text="record.text"
            :editable="props.textContentConfig.textEdit"
            @edit-start="editStart(record)"
            @edit-end="editEnd(record)"
        >
          {{ record.text }}
        </a-typography-text>
      </template>
      <template #controls="{ record }">
        <a-space direction="vertical" style="width: 80px;">
          <div>
            <n-slider
                v-model:value="record.volume"
                :step="1"
                :max="100"
                :min="1"
                :format-tooltip="(value: number) => `${value}%`"
                @update:value="(value: number) => {onVolumeChange(value, record)}"
                @dragend="onVolumeChangeEnd(record)"
            >
              <template #thumb>
                <icon-sound-fill/>
              </template>
            </n-slider>
          </div>
          <div>
            <n-slider
                v-model:value="record.speed"
                :step="0.1"
                :max="2"
                :min="0.1"
                @update:value="(value: number) => {onSpeedChange(value, record)}"
                @dragend="onSpeedChangeEnd(record)"
            >
              <template #thumb>
                <icon-forward/>
              </template>
            </n-slider>
          </div>
        </a-space>
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
                :disabled="loading && createAudioKey === `${record.p}-${record.s}`"
            >
              <icon-refresh :spin="loading && createAudioKey === `${record.p}-${record.s}`"/>
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>
    <audio-select
        v-model:visible="modelSelectVisible"
        :model-select="currentChapterInfo"
        @change="modelSelect"
    />
    <role-change-model
        v-model:visible="roleChangeModelVisible"
        :chapter-info="currentChapterInfo"
        @success="refresh"
    />
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>
.container {
  ::v-deep(.n-slider .n-slider-rail .n-slider-rail__fill) {
    background-color: #165dff;
    --n-rail-height: 2px;
  }

  ::v-deep(.n-slider .n-slider-rail) {
    --n-rail-height: 2px;
  }
}
</style>