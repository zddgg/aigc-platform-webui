<script setup lang="ts">
import {inject, onBeforeUnmount, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import ChapterSplitModal from "@/views/text/novel/chapter-title/components/ChapterSplitModal.vue";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";
import {EventBus} from "@/vite-env";
import {chapters as queryTextChapterList, TextChapter} from "@/api/text-chapter.ts";

const route = useRoute();
const router = useRouter();

const emits = defineEmits(['toggleCollapse', 'refresh'])
const eventBus = inject<EventBus>('eventBus');

const collapsed = ref(false);
const chapterSplitModalVisible = ref(false);

const activeChapterIndex = ref(0)
const textChapters = ref<TextChapter[]>([])

const handleQueryChapters = async () => {
  const {data} = await queryTextChapterList({
    projectId: route.query.projectId as string,
  });
  textChapters.value = data;
}

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

const refresh = () => {
  handleQueryChapters().then(() => {
    router.push({
      name: route.name as string,
      query: {
        ...route.query,
        chapterId: textChapters.value[0].chapterId,
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
          章节解析
        </a-button>
        <a-button
            v-if="textChapters && textChapters.length !== 0"
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
            v-for="(item, index) in textChapters"
            :key="index"
            style="border: 1px #ccc solid; border-radius: 8px"
            hoverable
            :style="index == activeChapterIndex && {backgroundColor: '#c3f6f6'}"
            @click="chapterSelect(item, index)"
        >
          <div v-if="collapsed" style="text-align: center"
               :style="item?.stage === '合并完成' && {backgroundColor: 'green'}">
            {{ index }}
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px">
              <div v-if="item.stage" style="cursor: pointer">
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