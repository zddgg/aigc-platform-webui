<script setup lang="ts">
import {onMounted, onUnmounted, provide, ref, watch} from "vue";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import TableContent from "./components/TableContent.vue";
import CommonRole from "./components/CommonRole.vue";
import TextRole from "./components/TextRole.vue";
import {Message} from "@arco-design/web-vue";
import {ROLE_CHANGE} from "@/types/event-types.ts";
import {getTextChapter, roleInference, stopCreateAudio, TextChapter, TextContentConfig} from "@/api/text-chapter.ts";
import {AudioTaskState, EventTypes, TextProjectType} from "@/types/global.ts";
import AudioPreview from "@/views/text/novel/chapter-content/components/AudioPreview.vue";
import {getTextProject, TextProject} from "@/api/text-project.ts";
import ChapterEditModal from "@/views/text/novel/chapter-title/components/ChapterEditModal.vue";
import GlobalWebsocketService from "@/services/globalWebsocketService.ts";
import emitter from "@/mitt";
import RoleInferenceModal from "@/views/text/novel/chapter-content/components/RoleInferenceModal.vue";

const route = useRoute();
const {loading, setLoading} = useLoading();

const selectedIndexes = ref<string[]>([])
const textContentConfig = ref<TextContentConfig>({
  edit: false,
  showDialogue: true
})
const audioPreviewModelVisible = ref<boolean>(false);
const chapterEditModalVisible = ref<boolean>(false);
const roleInferenceModalVisible = ref<boolean>(false);
const playStartIndex = ref<string>('')

const tableContentRef = ref<
    {
      playAllAudio: Function,
      handleSelectAllValue: Function,
      handleConditionSelect: Function,
      handleAudioGenerate: Function,

      handleBatchRoleChange: Function,
      handleBatchModelChange: Function,
      handleAudioParamsChange: Function,
      handleCombineExport: Function,
      handleMarkupDialogue: Function,
      handleTextCombine: Function,
      handleBatchDelete: Function,
    } | null
>(null);

const refresh = () => {
  emitter?.emit(ROLE_CHANGE);
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

const handleAiInference = (param: any) => {
  try {
    setLoading(true);
    roleInference(
        '/api/sse/textChapter/roleInference',
        {
          projectId: route.query.projectId as string,
          chapterId: route.query.chapterId as string,
          ...param,
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

const aiResultModalVisible = ref<boolean>(false);

const onStartCreateAudio = (actionType: 'all' | 'modified' | 'selected') => {
  tableContentRef.value?.handleAudioGenerate(actionType)
}

const playAllAudio = () => {
  tableContentRef.value?.playAllAudio(playStartIndex.value)
  playStartIndex.value = ''
}

const stopLoading = ref<boolean>(false);
const handleStopCreateAudio = async () => {
  await stopCreateAudio();
  stopLoading.value = true;
}

provide('GlobalWebsocketService', GlobalWebsocketService);

const taskNum = ref(0);
const creatingIds = ref<string[]>([])
const wsDataHandler = (data: any) => {
  taskNum.value = data?.taskNum ?? 0;
  creatingIds.value = data?.creatingIds ?? [];
  if (data?.taskNum ?? 0 === 0) {
    stopLoading.value = false;
  }
}

const textProject = ref<TextProject | null>(null)
const textChapter = ref<TextChapter | null>(null)

const handleQueryProject = async () => {
  const {data} = await getTextProject({
    projectId: route.query.projectId as string,
  })
  textProject.value = data
}

const handleQueryChapter = async () => {
  const {data} = await getTextChapter({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  textChapter.value = data
}

const handleAudioCombineEvent = () => {
  handleQueryChapter();
}

onMounted(() => {
  emitter?.on(EventTypes.chapter_refresh, handleAudioCombineEvent);
  emitter?.on(EventTypes.audio_generate_summary, wsDataHandler);
});

onUnmounted(() => {
  emitter?.off(EventTypes.chapter_refresh, handleAudioCombineEvent);
  emitter?.off(EventTypes.audio_generate_summary, wsDataHandler);
});

watch(
    () => route.query.chapterId,
    () => {
      selectedIndexes.value = [];
      if (route.query.chapterId) {
        handleQueryProject();
        handleQueryChapter();
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
            <div v-if="route.query.projectType === TextProjectType.short_text">
              <a-button
                  type="primary"
                  size="small"
                  @click="chapterEditModalVisible = true"
              >
                章节编辑
              </a-button>
            </div>
            <div v-if="textProject?.projectType !== TextProjectType.format_text">
              <a-button
                  type="primary"
                  :loading="loading"
                  size="small"
                  @click="() => (roleInferenceModalVisible = true)"
              >
                角色推理
              </a-button>
            </div>
            <div>
              <a-dropdown-button
                  type="primary"
                  size="small"
              >
                音频生成
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
                    修改部分生成
                  </a-doption>
                  <a-doption
                      v-if="textContentConfig.edit"
                      @click="onStartCreateAudio('selected')"
                  >
                    生成选中部分
                  </a-doption>
                </template>
              </a-dropdown-button>
            </div>
            <div>
              <a-button-group>
                <a-button
                    size="small"
                    type="primary"
                    :status="textContentConfig.edit ? 'warning' : 'normal'"
                    @click="() => {
                      if (textContentConfig.edit) {
                        tableContentRef?.handleSelectAllValue(false)
                      }
                      textContentConfig.edit = !textContentConfig.edit
                    }"
                >
                  {{ textContentConfig.edit ? '关闭编辑' : '编辑模式' }}
                </a-button>
                <a-dropdown
                    v-if="textContentConfig.edit"
                    position="br"
                >
                  <a-button
                      type="primary"
                      size="small"
                  >
                    <template #icon>
                      <icon-down/>
                    </template>
                  </a-button>
                  <template #content>
                    <a-doption @click="tableContentRef?.handleSelectAllValue(true)">
                      全选
                    </a-doption>
                    <a-doption @click="tableContentRef?.handleConditionSelect(true)">
                      条件选择
                    </a-doption>
                    <a-doption @click="tableContentRef?.handleSelectAllValue(false)">
                      取消全选
                    </a-doption>
                  </template>
                </a-dropdown>
              </a-button-group>
            </div>
            <div v-if="textContentConfig.edit">
              <a-dropdown-button
                  type="primary"
                  size="small"
              >
                批量处理
                <template #icon>
                  <icon-down/>
                </template>
                <template #content>
                  <a-doption
                      style="margin-right: 5px"
                      @click="tableContentRef?.handleBatchRoleChange()"
                  >
                    角色修改
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleBatchModelChange()">
                    模型修改
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleAudioParamsChange()">
                    音频参数
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleCombineExport()">
                    合并导出
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleMarkupDialogue(true)">
                    标记对话
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleMarkupDialogue(false)">
                    取消标记
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleTextCombine()">
                    文本合并
                  </a-doption>
                  <a-doption @click="tableContentRef?.handleBatchDelete()">
                    批量删除
                  </a-doption>
                </template>
              </a-dropdown-button>
            </div>
            <div>
              <a-dropdown-button
                  type="primary"
                  size="small"
              >
                音频播放
                <template #icon>
                  <icon-down/>
                </template>
                <template #content>
                  <a-doption @click="playAllAudio">
                    <div style="display: flex; align-items: center">
                      <a-input v-model="playStartIndex" placeholder="0-0" size="small" style="width: 100px"
                               @click.stop/>
                      <div style="margin-left: 10px">
                        顺序播放
                      </div>
                    </div>
                  </a-doption>
                  <a-doption
                      v-if="textChapter?.audioTaskState === AudioTaskState.combined"
                      @click="audioPreviewModelVisible = true"
                  >
                    音频预览
                  </a-doption>
                </template>
              </a-dropdown-button>
            </div>
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
              <a-dropdown-button size="small">
                其他
                <template #icon>
                  <icon-down/>
                </template>
                <template #content>
                  <a-doption>
                    <a-checkbox v-model="textContentConfig.showDialogue">标记对话</a-checkbox>
                  </a-doption>
                </template>
              </a-dropdown-button>
            </div>
          </a-space>
        </div>
      </div>
    </a-affix>
    <div style="display: flex; margin-top: 10px">
      <div style="flex: 1"
           :style="route.query.projectType as string === TextProjectType.long_text && {marginLeft: '10px'}">
        <a-scrollbar
            style="max-height: calc(100vh - 90px); padding-right: 10px; overflow: auto"
        >
          <table-content
              ref="tableContentRef"
              v-model:text-content-config="textContentConfig"
              v-model:selected-indexes="selectedIndexes"
              v-model:creating-ids="creatingIds"
          />
        </a-scrollbar>
      </div>
      <a-divider direction="vertical" style="margin: 0"/>
      <div style="width: 20%; margin-left: 10px">
        <a-scrollbar
            style="max-height: calc(100vh - 100px); overflow: auto"
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
        </a-scrollbar>
      </div>
    </div>
    <role-inference-modal
        v-model:visible="roleInferenceModalVisible"
        @success="handleAiInference"
    />
    <audio-preview v-model:visible="audioPreviewModelVisible"/>
    <chapter-edit-modal
        v-model:visible="chapterEditModalVisible"
        :chapter-id="route.query.chapterId as string"
    />
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