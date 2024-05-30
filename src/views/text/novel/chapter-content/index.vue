<script setup lang="ts">
import {onMounted, onUnmounted, provide, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {aiInference, startCreateAudio} from "@/api/text.ts";
import useLoading from "@/hooks/loading.ts";
import TextContent from "@/views/text/novel/chapter-content/components/TextContent.vue";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import TableContent from "@/views/text/novel/chapter-content/components/TableContent.vue";
import {Message, Modal} from "@arco-design/web-vue";
import WebSocketService from '@/services/websocketService.ts';
import BatchChangeModal from "@/views/text/novel/chapter-content/components/BatchChangeModal.vue";
import CombineExport from "@/views/text/novel/chapter-content/components/CombineExport.vue";

const route = useRoute();
const {loading, setLoading} = useLoading();

const batchChangeModalVisible = ref(false);
const combineExportModalVisible = ref(false);

const selectedIndexes = ref<string[]>([])

const textContentConfig = ref<TextContentConfig>({
  textViewType: 'table'
} as TextContentConfig)

const aiResultText = ref<string>('')

const handleAiInferenceMessage = (data: string[], index: number) => {
  aiResultText.value += data.join('');
  console.log('Received data chunk', data.join(''), 'at index', index);
};

const handleAiInferenceDone = () => {
  setLoading(false);
  console.log('Request done', aiResultText.value);
};

const handleAiInferenceError = (response: Response) => {
  setLoading(false);
  console.error('Request failed', response);
};

const handleAiInferenceTimeout = () => {
  setLoading(false);
  console.error('Request timed out');
};

const handleAiInference = () => {
  try {
    setLoading(true);
    aiInference(
        '/api/text/chapter/aiInference',
        {
          project: route.query.project as string,
          chapter: route.query.chapter as string,
        },
        handleAiInferenceMessage,
        handleAiInferenceDone,
        handleAiInferenceError,
        handleAiInferenceTimeout
    )
  } catch (err) {
    setLoading(false);
  }
};

const handleStartCreateAudio = async (actionType: 'all' | 'modified') => {
  const {msg} = await startCreateAudio({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
    actionType: actionType,
  });
  Message.success(msg);
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

const textContentRef = ref<
    {
      playAllAudio: Function,
      refresh: Function,
    } | null
>(null);

const tableContentRef = ref<
    {
      playAllAudio: Function,
      refresh: Function,
    } | null
>(null);

const refresh = () => {
  textContentRef.value?.refresh()
  tableContentRef.value?.refresh()
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
  if (!selectedIndexes.value || !selectedIndexes.value.length) {
    Modal.warning({
      title: '没有选择导出内容',
      content: '请选择需要导出的内容'
    })
  } else {
    combineExportModalVisible.value = true;
  }
}

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  WebSocketService.disconnect();
});

function connectWebSocket() {
  WebSocketService.connect(route.query.project as string);
}

provide('WebSocketService', WebSocketService);

watch(
    () => route.query.chapter,
    () => {
      scrollToTop('text-content');
      selectedIndexes.value = []
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-affix>
      <div class="text-space-header">
        <div style="width: 80%; display: flex; justify-content: space-between; align-items: center">
          <a-space size="large">
            <div>
              <a-button type="primary"
                        :loading="loading"
                        @click="handleAiInference"
              >
                角色推理
              </a-button>
            </div>
            <div>
              <a-dropdown-button type="primary">
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
                      <div v-if="textContentConfig.textViewType !== 'table'">
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
        style="max-height: calc(100vh - 76px); padding-right: 10px; overflow: auto;
         border-top: 1px solid #CCCCCCFF"
    >
      <div id="text-content">
        <div v-if="textContentConfig.textViewType === 'table'">
          <table-content
              ref="tableContentRef"
              v-model:text-content-config="textContentConfig"
              v-model:selected-indexes="selectedIndexes"
          />
        </div>
        <div v-else>
          <text-content
              ref="textContentRef"
              v-model:text-content-config="textContentConfig"
          />
        </div>
      </div>
    </n-scrollbar>
    <batch-change-modal
        v-model:visible="batchChangeModalVisible"
    />
    <combine-export
        v-model:visible="combineExportModalVisible"
        v-model:selected-indexes="selectedIndexes"
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
</style>