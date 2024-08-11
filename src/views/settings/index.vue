<script setup lang="ts">
import {ref} from "vue";
import GlobalSetting from "@/views/settings/components/global-setting-view.vue";
import CacheSetting from "@/views/settings/components/cache-setting-view.vue";
import LangDictSetting from "@/views/settings/components/lang-dict-setting-view.vue";

const modelTypes = [
  '通用设置', '缓存设置', '语言字典设置'
]
const activeModelType = ref('文本大模型')

const changeModelType = (item: string) => {
  activeModelType.value = item
}
</script>

<template>
  <div style="display: flex; padding: 20px 10px 20px 20px">
    <div style="width: 10%; height: calc(100vh - 42px)">
      <n-scrollbar style="max-height: calc(100vh - 42px)">
        <div style="padding-right: 10px">
          <a-space style="width: 100%" direction="vertical">
            <a-card
                v-for="(item, index) in modelTypes"
                :key="index"
                style="border: 1px #cccccc solid; border-radius: 8px"
                :style="activeModelType === item && { backgroundColor: '#C3F6F6' }"
                @click="changeModelType(item)"
            >
              <div style="padding: 10px 0">
                {{ item }}
              </div>
            </a-card>
          </a-space>
        </div>
      </n-scrollbar>
    </div>
    <a-divider direction="vertical" style="margin: 0 20px 0 10px"/>
    <div style="width: 90%">
      <n-scrollbar style="max-height: calc(100vh - 42px);">
        <div style="padding-right: 10px">
          <div v-if="activeModelType === '通用设置'">
            <global-setting/>
          </div>
          <div v-if="activeModelType === '缓存设置'">
            <cache-setting/>
          </div>
          <div v-if="activeModelType === '语言字典设置'">
            <lang-dict-setting/>
          </div>
        </div>
      </n-scrollbar>
    </div>
  </div>
</template>

<style scoped>

</style>