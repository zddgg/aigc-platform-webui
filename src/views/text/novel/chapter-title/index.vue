<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {queryChapters} from "@/api/text.ts";
import {useRoute, useRouter} from "vue-router";
import ChapterSplitModal from "@/views/text/novel/chapter-title/components/ChapterSplitModal.vue";

const route = useRoute();
const router = useRouter();

const chapterSplitModalVisible = ref(false);

const activeChapterIndex = ref(0)
const chapterTitles = ref<string[]>([])
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
  return chapterTitles.value && chapterTitles.value.length > 0 ? chapterTitles.value : tmpChapterTitles.value
})

onMounted(async () => {
  await handleQueryChapters();
  await router.push({
    name: route.name as string,
    query: {
      ...route.query,
      chapter: chapterTitles.value[0],
    }
  })
})
</script>

<template>
  <div>
    <a-affix>
      <div class="text-space-header">
        <a-button
            type="outline"
            @click="() => (chapterSplitModalVisible = true)"
        >
          章节解析
        </a-button>
      </div>
    </a-affix>
    <n-scrollbar style="max-height: calc(100vh - 74px); padding-right: 10px">
      <a-space direction="vertical" style="width: 100%">
        <a-card v-if="!computedChapterTitles || computedChapterTitles.length === 0">
          <a-empty description="先完成章节解析"/>
        </a-card>
        <a-card
            v-else
            v-for="(item, index) in computedChapterTitles"
            :key="index"
            style="border: 1px #ccc solid; border-radius: 8px"
            hoverable
            :style="index == activeChapterIndex && {backgroundColor: '#c3f6f6'}"
            @click="chapterSelect(item, index)"
        >
          <a-descriptions :column="1" size="small">
            <template #title>
              <span style="font-size: 18px; font-weight: 500">
                {{ item.split('--')[1] }}
              </span>
            </template>
            <a-descriptions-item>
              <template #label>
                <span style="color: #000">
                  文本数量
                </span>
              </template>
              70
            </a-descriptions-item>
            <a-descriptions-item>
              <template #label>
                <span style="color: #000">
                角色数量
              </span>
              </template>
              8
            </a-descriptions-item>
          </a-descriptions>
          <a-button
              type="outline"
              size="mini"
              style="margin-top: 5px"
          >
            台词解析
          </a-button>
        </a-card>
      </a-space>
    </n-scrollbar>
    <chapter-split-modal
        v-model:visible="chapterSplitModalVisible"
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