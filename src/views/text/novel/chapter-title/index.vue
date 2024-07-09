<script setup lang="ts">
import {inject, onBeforeUnmount, onMounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import ChapterSplitModal from "@/views/text/novel/chapter-title/components/ChapterSplitModal.vue";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {EventBus} from "@/vite-env";
import {deleteChapter, pageChapters, TextChapter, TextChapterPage} from "@/api/text-chapter.ts";
import ChapterEditModal from "@/views/text/novel/chapter-title/components/ChapterEditModal.vue";
import {Message, Modal} from "@arco-design/web-vue";
import {Pagination} from "@/types/global.ts";
import ChapterAddModal from "@/views/text/novel/chapter-title/components/ChapterAddModal.vue";

const route = useRoute();
const router = useRouter();

const emits = defineEmits(['toggleCollapse', 'refresh'])
const eventBus = inject<EventBus>('eventBus');

const collapsed = ref(false);
const chapterSplitModalVisible = ref(false);
const chapterAddModalVisible = ref(false);
const chapterEditModalVisible = ref(false);

const activeChapterIndex = ref(0)
const textChapters = ref<TextChapter[]>([])
const currentChapter = ref<TextChapter | null>(null)

const basePagination: Pagination = {
  current: 1,
  pageSize: 50,
};
const pagination = reactive({
  ...basePagination,
});

const fetchData = async (
    params: Pagination = {
      current: 1,
      pageSize: 50,
    }
) => {
  const {data} = await pageChapters({
    ...params,
    projectId: route.query.projectId as string,
  })
  textChapters.value = data.records
  pagination.current = params.current;
  pagination.total = data.total;
  pagination.pages = data.pages
};

const onPageChange = (current: number) => {
  fetchData({...pagination, current} as TextChapterPage);
};

const chapterSelect = (textChapter: TextChapter, index: number) => {
  activeChapterIndex.value = index;
  router.push({
    name: route.name as string,
    query: {
      ...route.query,
      chapter: textChapter.chapterName,
      chapterId: textChapter.chapterId,
    }
  })
}

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  emits('toggleCollapse', collapsed.value);
}

const refresh = async () => {
  await fetchData(pagination)
  await router.push({
    name: route.name as string,
    query: {
      ...route.query,
      chapterId: textChapters.value[0].chapterId,
    }
  })
}

const handleDeleteChapter = (textChapter: TextChapter) => {
  Modal.error({
    title: '删除章节',
    content:
        '会删除章节相关数据，包括章节文本、角色台词、模型配置、语音配置、生成的音频等',
    async onOk() {
      try {
        const {msg} = await deleteChapter(textChapter);
        Message.success(msg);
        eventBus?.emit(ROLE_CHANGE)
      } finally {
      }
    },
  });
}

const onPrevPage = () => {
  if (pagination.current > 1) {
    pagination.current = pagination.current - 1
  } else {
    pagination.current = Math.max(pagination.current, 1);
  }

  fetchData(pagination)
}

const onNextPage = () => {
  if (pagination.current < (pagination.pages ?? 0)) {
    pagination.current = pagination.current + 1
  } else {
    pagination.current = Math.min(pagination.current, (pagination.pages ?? 0));
  }

  console.log(pagination)

  fetchData(pagination)
}

const roleChangeEvent = () => {
  fetchData(pagination);
}

onMounted(() => {
  eventBus?.on(ROLE_CHANGE, roleChangeEvent);
});

onBeforeUnmount(() => {
  eventBus?.off(ROLE_CHANGE, roleChangeEvent);
});

onMounted(async () => {
  await fetchData(pagination);
  if (textChapters.value && textChapters.value.length > 0) {
    await router.push({
      name: route.name as string,
      query: {
        ...route.query,
        chapterId: textChapters.value[0].chapterId,
      }
    })
  }
})
</script>

<template>
  <div>
    <a-affix>
      <div class="text-space-header">
        <a-button
            v-if="!collapsed"
            type="outline"
            @click="() => (chapterSplitModalVisible = true)"
        >
          章节设置
        </a-button>
        <a-space size="medium">
          <a-button
              v-if="!collapsed && textChapters && textChapters.length !== 0"
              type="outline"
              size="mini"
              @click="() => (chapterAddModalVisible = true)"
          >
            <icon-plus/>
          </a-button>
          <a-button
              v-if="textChapters && textChapters.length !== 0"
              type="outline"
              size="mini"
              @click="toggleCollapse"
          >
            <icon-menu-unfold v-if="collapsed"/>
            <icon-menu-fold v-else/>
          </a-button>
        </a-space>
      </div>
    </a-affix>
    <n-scrollbar style="height: calc(100vh - 60px - 40px); padding-right: 10px">
      <a-space direction="vertical" style="width: 100%">
        <a-card
            :id="`chapter-title-${item.chapterId}`"
            v-for="(item, index) in textChapters"
            :key="index"
            style="border: 1px #ccc solid; border-radius: 8px"
            hoverable
            :style="route.query.chapterId === item.chapterId && {backgroundColor: '#c3f6f6'}"
            @click="chapterSelect(item, index)"
        >
          <div
              v-if="collapsed"
              style="text-align: center"
          >
            {{ (item.sortOrder ?? 0) + 1 }}
          </div>
          <div v-else>
            <a-descriptions :column="1" size="small">
              <template #title>
              <span style="font-size: 18px; font-weight: 500">
                {{ item.chapterName }}
              </span>
              </template>
              <a-descriptions-item>
                <template #label>
                <span style="color: #000">
                  文本数量
                </span>
                </template>
                {{ item.textNum ?? 0 }}
              </a-descriptions-item>
              <a-descriptions-item>
                <template #label>
                  <span style="color: #000">
                    角色数量
                  </span>
                </template>
                {{ item.roleNum ?? 0 }}
              </a-descriptions-item>
            </a-descriptions>
            <div
                style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; white-space: nowrap">
              <div>
                <div v-if="item.stage" style="cursor: pointer">
                  <a-tag
                      v-if="item.stage === '合并完成'"
                      color="green"
                      size="small"
                  >
                    <template #icon>
                      <icon-check-circle-fill/>
                    </template>
                    <span>
                    {{ item.stage }}
                </span>
                  </a-tag>
                  <a-tag
                      v-else
                      color="blue"
                      size="small"
                  >
                    <template #icon>
                      <icon-clock-circle/>
                    </template>
                    <span>
                    {{ item.stage }}
                  </span>
                  </a-tag>
                </div>
              </div>
              <div>
                <a-tag
                    size="small"
                    style="cursor: pointer; margin-left: 5px"
                    @click="() => {
                        currentChapter = item;
                        chapterEditModalVisible = true;
                      }"
                >
                  <icon-edit/>
                </a-tag>
                <a-tag
                    size="small"
                    style="cursor: pointer; margin-left: 5px"
                    @click="handleDeleteChapter(item)"
                >
                  <icon-delete/>
                </a-tag>
              </div>
            </div>
          </div>
        </a-card>
      </a-space>
    </n-scrollbar>
    <div style="height: 40px; width: 100%; display: flex; justify-content: center; align-items: center">
      <a-pagination
          v-if="!collapsed"
          :total="pagination.total || 0"
          :page-size="pagination.pageSize"
          size="mini"
          simple
          @change="onPageChange"
      />
      <div v-else style="padding-right: 10px">
        <a-button-group size="mini">
          <a-button
              style="padding: 10px"
              @click="onPrevPage"
          >
            <icon-left/>
          </a-button>
          <a-button
              style="padding: 10px"
              @click="onNextPage"
          >
            <icon-right/>
          </a-button>
        </a-button-group>
      </div>
    </div>

    <chapter-split-modal
        v-model:visible="chapterSplitModalVisible"
        @refresh="refresh"
    />
    <chapter-add-modal
        v-model:visible="chapterAddModalVisible"
    />
    <chapter-edit-modal
        v-model:visible="chapterEditModalVisible"
        :chapter-id="currentChapter?.chapterId"
    />

  </div>
</template>

<style scoped>
.text-space-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  margin-bottom: 10px;
}
</style>