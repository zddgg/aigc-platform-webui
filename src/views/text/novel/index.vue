<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
import ChapterTitle from "@/views/text/novel/chapter-title/index.vue";
import ChapterContent from "@/views/text/novel/chapter-content/index.vue";
import {useRoute} from "vue-router";
import {TextProjectType} from "@/types/global.ts";
import {createTextWebsocketService} from "@/services/textWebsocketService.ts";

const route = useRoute();

const collapsed = ref<boolean>(false);
const toggleCollapse = (value: boolean) => {
  collapsed.value = value;
}

const textWebsocketService = createTextWebsocketService();

onMounted(() => {
  if (route.query.projectId) {
    textWebsocketService.connect(route.query.projectId as string);
  }
})

onUnmounted(() => {
  textWebsocketService.disconnect();
});

</script>

<template>
  <div style="display: flex; padding: 20px">
    <div
        v-show="route.query.projectType as string === TextProjectType.long_text"
        :style="!collapsed && {width: '240px'}"
    >
      <chapter-title @toggle-collapse="toggleCollapse"/>
    </div>
    <a-divider v-if="route.query.projectType as string === TextProjectType.long_text" direction="vertical" style="margin: 0"/>
    <div style="flex: 1">
      <chapter-content/>
    </div>
  </div>
</template>

<style scoped>
</style>