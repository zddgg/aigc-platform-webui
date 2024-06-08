<script setup lang="ts">
import {computed, inject, onBeforeUnmount, onMounted, ref} from "vue";
import {Chapter, queryChapters} from "@/api/text.ts";
import {useRoute, useRouter} from "vue-router";
import ChapterSplitModal from "@/views/text/novel/chapter-title/components/ChapterSplitModal.vue";
import LinesParseModal from "@/views/text/novel/chapter-title/components/LinesParseModal.vue";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {EventBus} from "@/vite-env";
import useLoading from "@/hooks/loading.ts";

const route = useRoute();
const router = useRouter();

const emits = defineEmits(['toggleCollapse', 'refresh'])
const eventBus = inject<EventBus>('eventBus');

const {loading, setLoading} = useLoading(true);

const collapsed = ref(false);
const chapterSplitModalVisible = ref(false);
const linesParseModalVisible = ref(false);

const activeChapterIndex = ref(0)
const chapterTitles = ref<Chapter[]>([])
const tmpChapterTitles = ref<string[]>([]);

const handleQueryChapters = async () => {
  const {data} = await queryChapters({
    project: route.query.project as string,
  });
  chapterTitles.value = data;
}

const chapterSelect = (chapterTitle: string, index: number) => {
  activeChapterIndex.value = index;
  router.push({
    name: route.name as string,
    query: {
      ...route.query,
      chapter: chapterTitle,
    }
  })
}

const computedChapterTitles = computed(() => {
  return chapterTitles.value && chapterTitles.value.length > 0
      ? chapterTitles.value
      : tmpChapterTitles.value.map(item => {
        return {
          chapter: item,
        } as Chapter
      })
})

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  emits('toggleCollapse', collapsed.value);
}

const currentChapter = ref<string>('');
const handleLinesParse = (chapter: Chapter) => {
  linesParseModalVisible.value = true
  currentChapter.value = chapter.chapter
}

const refresh = () => {
  handleQueryChapters().then(() => {
    router.push({
      name: route.name as string,
      query: {
        ...route.query,
        chapter: chapterTitles.value[0].chapter,
      }
    })
  });
}

const roleChangeEvent = () => {
  handleQueryChapters();
}

onMounted(() => {
  eventBus?.on(ROLE_CHANGE, roleChangeEvent);
});

onBeforeUnmount(() => {
  eventBus?.off(ROLE_CHANGE, roleChangeEvent);
});

onMounted(async () => {
  await handleQueryChapters();
  if (chapterTitles.value && chapterTitles.value.length > 0) {
    await router.push({
      name: route.name as string,
      query: {
        ...route.query,
        chapter: chapterTitles.value[0].chapter,
      }
    })
  }
  setLoading(false);
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
          章节解析
        </a-button>
        <a-button
            v-if="computedChapterTitles && computedChapterTitles.length !== 0"
            type="outline"
            @click="toggleCollapse"
        >
          <icon-menu-unfold v-if="collapsed"/>
          <icon-menu-fold v-else/>
        </a-button>
      </div>
    </a-affix>
    <n-scrollbar style="max-height: calc(100vh - 76px); padding-right: 10px">
      <a-space direction="vertical" style="width: 100%">
        <a-card
            v-if="!computedChapterTitles || computedChapterTitles.length === 0"
            :loading="loading"
        >
          <a-empty description="先完成章节解析"/>
        </a-card>
        <a-card
            v-else
            v-for="(item, index) in computedChapterTitles"
            :key="index"
            style="border: 1px #ccc solid; border-radius: 8px"
            hoverable
            :style="index == activeChapterIndex && {backgroundColor: '#c3f6f6'}"
            @click="chapterSelect(item.chapter, index)"
        >
          <div v-if="collapsed" style="text-align: center" :style="item?.stage === '合并完成' && {backgroundColor: 'green'}">
            {{ index }}
          </div>
          <div v-else>
            <a-descriptions :column="1" size="small">
              <template #title>
              <span style="font-size: 18px; font-weight: 500">
                {{ item.chapter?.split('--')[1] }}
              </span>
              </template>
              <a-descriptions-item>
                <template #label>
                <span style="color: #000">
                  文本数量
                </span>
                </template>
                {{ item.textNum }}
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px">
              <a-button
                  type="outline"
                  size="mini"
                  @click="handleLinesParse(item)"
              >
                台词解析
              </a-button>
              <div v-if="item.stage" style="margin-left: 20px; cursor: pointer">
                <a-tag
                    v-if="item.stage === '合并完成'"
                    color="green"
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
          </div>
        </a-card>
      </a-space>
    </n-scrollbar>
    <chapter-split-modal
        v-model:visible="chapterSplitModalVisible"
        @refresh="refresh"
    />
    <lines-parse-modal
        v-model:visible="linesParseModalVisible"
        :chapter-title="currentChapter"
        @refresh="emits('refresh')"
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