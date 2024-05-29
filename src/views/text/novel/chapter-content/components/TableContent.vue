<script setup lang="ts">
import {inject, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message, TableColumnData} from "@arco-design/web-vue";
import {ChapterInfo, createAudio, queryChapterInfo, textModelChange, updateChapterText} from "@/api/text.ts";
import {audioNameFormat, modelNameFormat, voiceNameFormat} from "@/utils/model-util.ts";
import {ModelSelect} from "@/api/ref-audio.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'
import useLoading from "@/hooks/loading.ts";
import {IWebSocketService} from '@/services/websocketService.ts'; // Adjust the path as needed

const route = useRoute();
const props = defineProps({
  textContentConfig: {
    type: Object as PropType<TextContentConfig>,
    default: {
      textViewType: 'text'
    } as TextContentConfig
  },
})
const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素
const {loading, setLoading} = useLoading();

const columns: TableColumnData[] = [
  {
    title: '角色',
    slotName: 'role',
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
    title: '操作',
    slotName: 'operations',
  },
]

const chapterInfos = ref<ChapterInfo[]>([]);
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
const playAudio = (key: string, url: string) => {
  activeAudioKey.value = key;
  if (audioElement.value && url) {
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

const createAudioKey = ref<string>('');
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

const handleChapterInfoUpdate = (data: ChapterInfo) => {
  chapterInfos.value = chapterInfos.value.map((item) => {
    if (item.p === data.p && item.s === data.s) {
      return {
        ...item,
        ...data,
      }
    }
    return item;
  })
};

const WebSocketService = inject<IWebSocketService>('WebSocketService') as IWebSocketService;

watch(
    () => route.query.chapter,
    () => {
      handleQueryChapterInfo();
      if (route.query.chapter as string) {
        WebSocketService.addMessageHandler(
            `${route.query.project as string}-${route.query.chapter as string}`, handleChapterInfoUpdate
        );
      }
    },
    {immediate: true}
);

</script>

<template>
  <div>
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
    <a-table :data="chapterInfos"
             :columns="columns"
             :bordered="{cell:true}"
             :pagination="false"
    >
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
              @click="playAudio(`${record.p}-${record.s}`, record.audioUrl)"
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

</style>