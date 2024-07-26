<script setup lang="ts">
import {ref} from "vue";
import ChapterTitle from "@/views/text/novel/chapter-title/index.vue";
import ChapterContent from "@/views/text/novel/chapter-content/index.vue";
import {useRoute} from "vue-router";

const route = useRoute();

const collapsed = ref<boolean>(false);
const toggleCollapse = (value: boolean) => {
  collapsed.value = value;
}

</script>

<template>
  <div style="display: flex; padding: 20px">
    <div
        v-show="route.query.projectType as string === 'long_text'"
        :style="!collapsed && {width: '240px'}"
    >
      <chapter-title @toggle-collapse="toggleCollapse"/>
    </div>
    <a-divider direction="vertical" style="margin: 0"/>
    <div style="flex: 1">
      <chapter-content/>
    </div>
  </div>
</template>

<style scoped>
</style>