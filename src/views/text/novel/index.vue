<script setup lang="ts">
import {ref} from "vue";
import ChapterTitle from "@/views/text/novel/chapter-title/index.vue";
import ChapterContent from "@/views/text/novel/chapter-content/index.vue";
import ChapterRole from "@/views/text/novel/chapter-role/index.vue";

const chapterContentRef = ref<{ refresh: Function } | null>(null);

const roleModelChange = () => {
  chapterContentRef.value?.refresh();
}
</script>


<template>
  <div style="display: flex; padding: 10px 20px">
    <div style="width: 15%">
      <chapter-title/>
    </div>
    <div style="width: 65%;; margin-left: 20px">
      <chapter-content ref="chapterContentRef"/>
    </div>
    <div style="width: 20%; margin-left: 20px">
      <chapter-role
          @role-model-change="roleModelChange"
      />
    </div>
  </div>
</template>

<style scoped>
</style>