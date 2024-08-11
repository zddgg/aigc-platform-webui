<script setup lang="ts">

import {getGlobalSetting, GlobalSetting, updateGlobalSetting} from "@/api/global-setting.ts";
import {onMounted, ref} from "vue";
import {debounce} from "lodash";

const globalSetting = ref<GlobalSetting>({} as GlobalSetting);

const handleGetGlobalSetting = async () => {
  const {data} = await getGlobalSetting()
  globalSetting.value = data
}

const handleUpdateGlobalSetting = debounce(async () => {
  await updateGlobalSetting(globalSetting.value)
}, 500)

onMounted(() => {
  handleGetGlobalSetting();
})

</script>

<template>
  <div>
    <a-space size="large" direction="vertical" style="width: 100%">
      <a-card>
        <a-space size="large">
          <span>字幕优化</span>
          <a-switch v-model="globalSetting.subtitleOptimize" @change="handleUpdateGlobalSetting"/>
        </a-space>
      </a-card>
    </a-space>
  </div>
</template>

<style scoped>

</style>