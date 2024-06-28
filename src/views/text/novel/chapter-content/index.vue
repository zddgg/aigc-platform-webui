<script setup lang="ts">
import {inject, onMounted, onUnmounted, provide, ref, watch} from "vue";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import TextContent from "@/views/text/novel/chapter-content/components/TextContent.vue";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import TableContent from "@/views/text/novel/chapter-content/components/TableContent.vue";
import {Message, Modal} from "@arco-design/web-vue";
import BatchChangeModal from "@/views/text/novel/chapter-content/components/BatchChangeModal.vue";
import WebSocketService from "@/services/websocketService.ts";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {EventBus} from "@/vite-env";
import {
  checkRoleInference,
  loadRoleInference,
  roleInference,
  startCreateAudio,
  stopCreateAudio
} from "@/api/text-chapter.ts";
import LinesParseModal from "@/views/text/novel/chapter-content/components/LinesParseModal.vue";

const route = useRoute();
const {loading, setLoading} = useLoading();

const emits = defineEmits(['refresh']);
const eventBus = inject<EventBus>('eventBus');

const batchChangeModalVisible = ref(false);

const selectedIndexes = ref<string[]>([])
const linesParseModalVisible = ref(false);

const textContentConfig = ref<TextContentConfig>({
  textViewType: 'table'
} as TextContentConfig)

const textContentRef = ref<
    {
      playAllAudio: Function,
      onCombineExport: Function,
    } | null
>(null);

const tableContentRef = ref<
    {
      playAllAudio: Function,
      onCombineExport: Function,
    } | null
>(null);

const refresh = () => {
  eventBus?.emit(ROLE_CHANGE);
}


const aiResultText = ref<string>('')

const handleAiInferenceMessage = (data: string[], index: number) => {
  aiResultText.value += data.join('');
  console.log('Received data chunk', data.join(''), 'at index', index);
};

const handleAiInferenceDone = () => {
  setLoading(false);
  setTimeout(() => {
    refresh();
  }, 500)
  console.log('Request done\n', aiResultText.value);
};

const handleAiInferenceError = async (response: Response) => {
  setLoading(false);
  const errorBody = await response.json();
  if (response.status === 401) {
    Message.error(errorBody.error);
  } else if (response.status === 400) {
    Message.error(errorBody.error);
  } else {
    Message.error('Unexpected error occurred');
  }
};

const handleAiInferenceTimeout = () => {
  setLoading(false);
  console.error('Request timed out');
};

const handleAiInference = () => {
  try {
    setLoading(true);
    roleInference(
        '/api/sse/textChapter/roleInference',
        {
          projectId: route.query.projectId as string,
          chapterId: route.query.chapterId as string,
        },
        handleAiInferenceMessage,
        handleAiInferenceDone,
        handleAiInferenceError,
        handleAiInferenceTimeout
    )
    aiResultModalVisible.value = false;
  } catch (err) {
    setLoading(false);
  }
};

const aiResultBool = ref<boolean>(false);
const onCheckAiResult = async () => {
  const {data} = await checkRoleInference({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  });
  aiResultBool.value = data;
  return data;
}

const handleUseCache = async () => {
  await loadRoleInference({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  });
  aiResultModalVisible.value = false;
  refresh();
};

const aiResultModalVisible = ref<boolean>(false);
const onAiInference = () => {
  onCheckAiResult().then(data => {
    if (data) {
      aiResultModalVisible.value = true;
    } else {
      handleAiInference()
    }
  });
}

const handleStartCreateAudio = async (actionType: 'all' | 'modified') => {
  const {data, msg} = await startCreateAudio({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
    actionType: actionType,
  });
  Message.success(msg);
  creatingIds.value = data;
}

const onStartCreateAudio = (actionType: 'all' | 'modified') => {
  Modal.warning({
    title: actionType === 'all' ? '全部重新生成？' : '增量修改生成?',
    content: '',
    onOk() {
      handleStartCreateAudio(actionType);
    },
  })
}


defineExpose({refresh})

const scrollToTop = (id: string) => {
  const targetElement = document.getElementById(id);
  if (targetElement) {
    targetElement.scrollIntoView({behavior: 'smooth'});
  }
};

const playAllAudio = () => {
  textContentRef.value?.playAllAudio()
  tableContentRef.value?.playAllAudio()
}

const onCombineExport = () => {
  tableContentRef.value?.onCombineExport();
  // do something
}

const stopLoading = ref<boolean>(false);
const handleStopCreateAudio = async () => {
  await stopCreateAudio();
  stopLoading.value = true;
}

onUnmounted(() => {
  WebSocketService.disconnect();
});

function connectWebSocket() {
  WebSocketService.connect(route.query.projectId as string);
}

provide('WebSocketService', WebSocketService);

const taskNum = ref(0);
const creatingIds = ref<string[]>([])
const stageHandler = (data: any) => {
  taskNum.value = data.taskNum;
  creatingIds.value = data.creatingIds;
  if (data.taskNum === 0) {
    stopLoading.value = false;
  }
}

onMounted(() => {
  connectWebSocket();
  WebSocketService.addStageHandler(stageHandler)
});


watch(
    () => route.query.chapter,
    () => {
      scrollToTop('text-content');
      selectedIndexes.value = [];
      if (route.query.chapter) {
        onCheckAiResult();
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-affix>
      <div class="text-space-header">
        <div style="width: 90%; display: flex; justify-content: space-between; align-items: center">
          <a-space size="large">
            <div>
              <a-button
                  type="outline"
                  @click="() => (linesParseModalVisible = true)"
              >
                台词解析
              </a-button>
            </div>
            <div>
              <a-button
                  type="primary"
                  :loading="loading"
                  @click="onAiInference"
              >
                角色推理
              </a-button>
            </div>
            <div>
              <a-dropdown-button
                  type="primary"
              >
                批量生成
                <template #icon>
                  <icon-down/>
                </template>
                <template #content>
                  <a-doption
                      @click="onStartCreateAudio('all')"
                  >
                    全部重新生成
                  </a-doption>
                  <a-doption
                      @click="onStartCreateAudio('modified')"
                  >
                    增量修改生成
                  </a-doption>
                </template>
              </a-dropdown-button>
            </div>
            <div>
              <a-button
                  type="primary"
                  @click="playAllAudio"
              >
                顺序播放
              </a-button>
            </div>
            <div v-if="false">
              <a-button
                  type="primary"
                  @click="() => (batchChangeModalVisible = true)"
              >
                批量处理
              </a-button>
            </div>
            <div>
              <a-button
                  type="primary"
                  @click="onCombineExport"
              >
                合并导出
              </a-button>
            </div>
          </a-space>
          <div v-if="taskNum">
            <a-space>
              <span>任务队列: {{ taskNum }}</span>
              <a-button
                  size="small"
                  status="danger"
                  :loading="stopLoading"
                  @click="handleStopCreateAudio"
              >
                停止
              </a-button>
            </a-space>
          </div>
          <div>
            <a-space size="small">
              <a-trigger
                  trigger="click"
                  :unmount-on-close="false"
              >
                <a-button type="outline" size="mini">
                  <icon-down/>
                </a-button>
                <template #content>
                  <a-card>
                    <a-space direction="vertical" style="width: 100%">
                      <div v-if="textContentConfig.textViewType !== 'table'">
                        <a-checkbox v-model="textContentConfig.showRole">角色</a-checkbox>
                      </div>
                      <div v-if="textContentConfig.textViewType !== 'table'">
                        <a-checkbox v-model="textContentConfig.showModal">模型</a-checkbox>
                      </div>
                      <div>
                        <a-checkbox v-model="textContentConfig.showLines">台词</a-checkbox>
                      </div>
                      <div v-if="textContentConfig.textViewType !== 'table'">
                        <a-checkbox v-model="textContentConfig.showAudio">音频</a-checkbox>
                      </div>
                      <div>
                        <a-checkbox v-model="textContentConfig.textEdit">文本编辑</a-checkbox>
                      </div>
                    </a-space>
                  </a-card>
                </template>
              </a-trigger>
              <a-dropdown>
                <a-button type="outline" size="mini">
                  <icon-file v-if="textContentConfig.textViewType === 'text'"/>
                  <icon-list v-if="textContentConfig.textViewType === 'text-list'"/>
                  <icon-apps v-if="textContentConfig.textViewType === 'table'"/>
                </a-button>
                <template #content>
                  <a-doption @click="() => (textContentConfig.textViewType = 'text')">
                    <template #icon>
                      <icon-file/>
                    </template>
                    <template #default>文本模式</template>
                  </a-doption>
                  <a-doption @click="() => (textContentConfig.textViewType = 'text-list')">
                    <template #icon>
                      <icon-list/>
                    </template>
                    <template #default>列表模式</template>
                  </a-doption>
                  <a-doption @click="() => (textContentConfig.textViewType = 'table')">
                    <template #icon>
                      <icon-apps/>
                    </template>
                    <template #default>表格模式</template>
                  </a-doption>
                </template>
              </a-dropdown>
            </a-space>
          </div>
        </div>
      </div>
    </a-affix>
    <n-scrollbar
        style="max-height: calc(100vh - 76px); padding-right: 10px; overflow: auto"
    >
      <div id="text-content">
        <div v-if="textContentConfig.textViewType === 'table'">
          <table-content
              ref="tableContentRef"
              v-model:text-content-config="textContentConfig"
              v-model:selected-indexes="selectedIndexes"
              v-model:creating-ids="creatingIds"
          />
        </div>
        <div v-else>
          <text-content
              ref="textContentRef"
              v-model:text-content-config="textContentConfig"
              v-model:creating-ids="creatingIds"
          />
        </div>
      </div>
    </n-scrollbar>
    <batch-change-modal
        v-model:visible="batchChangeModalVisible"
    />
    <a-modal
        v-model:visible="aiResultModalVisible"
        title="检测到推理结果缓存"
        :footer="false"
    >
      <div style="display: flex; justify-content: center; align-items: center;">
        <a-space size="large">
          <a-button @click="handleAiInference">重新推理</a-button>
          <a-button type="primary" @click="handleUseCache">使用缓存</a-button>
        </a-space>
      </div>
    </a-modal>

    <lines-parse-modal
        v-model:visible="linesParseModalVisible"
        @refresh="refresh"
    />

  </div>
</template>

<style scoped>
.text-space-header {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  margin-bottom: 10px;
}

.buttons-right {
  display: flex;
  justify-content: center;
}
</style>