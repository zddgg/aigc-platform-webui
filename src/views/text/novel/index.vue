<script setup lang="ts">
import {ref} from "vue";
import ChapterTitle from "@/views/text/novel/chapter-title/index.vue";
import ChapterContent from "@/views/text/novel/chapter-content/index.vue";
import ChapterRole from "@/views/text/novel/chapter-role/index.vue";

const chapterContentRef = ref<{ refresh: Function } | null>(null);

const roleModelChange = () => {
  chapterContentRef.value?.refresh();
}

const collapsed = ref<boolean>(false);
const toggleCollapse = (value: boolean) => {
  collapsed.value = value;
}
</script>


<template>
  <div style="display: flex; padding: 0 20px">
    <div :style="!collapsed && {width: '15%'}" style="padding-top: 10px">
      <chapter-title @toggle-collapse="toggleCollapse"/>
    </div>
    <div style="flex: 1; margin-left: 20px; padding-top: 10px">
      <chapter-content ref="chapterContentRef"/>
    </div>
    <div style="width: 20%; margin-left: 30px; padding-top: 10px">
      <chapter-role
          @role-model-change="roleModelChange"
      />
    </div>
  </div>
</template>

<style scoped>
</style>