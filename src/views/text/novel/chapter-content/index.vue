<script setup lang="ts">
import {inject, onMounted, onUnmounted, provide, ref, watch} from "vue";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import {TextContentConfig} from "./useChapterContent.ts";
import TableContent from "./components/TableContent.vue";
import BatchChangeModal from "./components/BatchChangeModal.vue";
import CommonRole from "./components/CommonRole.vue";
import TextRole from "./components/TextRole.vue";
import {Message, Modal} from "@arco-design/web-vue";
import TextWebsocketService from "@/services/textWebsocketService.ts";
import {ROLE_CHANGE} from "@/types/event-types.ts";
import {EventBus} from "@/vite-env";
import {
  checkRoleInference,
  loadRoleInference,
  roleInference,
  startCreateAudio,
  stopCreateAudio
} from "@/api/text-chapter.ts";

const route = useRoute();
const {loading, setLoading} = useLoading();

const emits = defineEmits(['refresh']);
const eventBus = inject<EventBus>('eventBus');

const batchChangeModalVisible = ref(false);

const selectedIndexes = ref<string[]>([])

const textContentConfig = ref<TextContentConfig>({} as TextContentConfig)

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
  TextWebsocketService.disconnect();
});

function connectWebSocket() {
  TextWebsocketService.connect(route.query.projectId as string);
}

provide('TextWebsocketService', TextWebsocketService);

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
  TextWebsocketService.addStageHandler(stageHandler)
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
      <div class="text-space-header" style="border-bottom: 1px solid rgb(229,230,235)">
        <div style="width: 90%; display: flex">
          <a-space size="large" align="start">
            <div>
              <a-button
                  type="primary"
                  :loading="loading"
                  size="small"
                  @click="onAiInference"
              >
                角色推理
              </a-button>
            </div>
            <div>
              <a-dropdown-button
                  type="primary"
                  size="small"
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
                  size="small"
                  @click="playAllAudio"
              >
                顺序播放
              </a-button>
            </div>
            <div v-if="false">
              <a-button
                  type="primary"
                  size="small"
                  @click="() => (batchChangeModalVisible = true)"
              >
                批量处理
              </a-button>
            </div>
            <div>
              <a-button
                  type="primary"
                  size="small"
                  @click="onCombineExport"
              >
                合并导出
              </a-button>
            </div>
            <div style="display: flex; place-items: center">
              <span style="margin-right: 10px">编辑</span>
              <a-switch v-model="textContentConfig.edit"/>
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
        </div>
      </div>
    </a-affix>
    <div style="display: flex; margin-top: 10px">
      <div style="flex: 1; margin-left: 10px">
        <n-scrollbar
            style="max-height: calc(100vh - 90px); padding-right: 10px; overflow: auto"
        >
          <div id="text-content">
            <table-content
                ref="tableContentRef"
                v-model:text-content-config="textContentConfig"
                v-model:selected-indexes="selectedIndexes"
                v-model:creating-ids="creatingIds"
            />
          </div>
        </n-scrollbar>
      </div>
      <a-divider direction="vertical" style="margin: 0"/>
      <div style="width: 20%; margin-left: 10px">
        <n-scrollbar
            style="max-height: calc(100vh - 90px); overflow: auto"
        >
          <a-card :bordered="false" style="border-radius: 8px" :body-style="{ padding: '0 10px 0 0' }">
            <n-tabs
                default-value="1"
                justify-content="space-evenly"
                type="line"
            >
              <n-tab-pane
                  name="1"
                  tab="文中角色"
                  display-directive="show:lazy"
              >
                <text-role/>
              </n-tab-pane>
              <n-tab-pane
                  name="2"
                  tab="预置角色"
                  display-directive="show:lazy"
              >
                <common-role/>
              </n-tab-pane>
            </n-tabs>
          </a-card>
        </n-scrollbar>
      </div>
    </div>


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

  </div>
</template>

<style scoped>
.text-space-header {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: center;
}

</style>