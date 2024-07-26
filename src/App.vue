<script setup lang="ts">
import layout from '@/layout/index.vue'

import {NConfigProvider, GlobalThemeOverrides} from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {},
}
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <layout/>
  </n-config-provider>
</template>

<style scoped>
:deep(.n-tabs-bar) {
  background-color: #165dff !important;
}

:deep(.n-tabs-tab:hover) {
  color: #165dff !important;
}

:deep(.n-tabs-tab--active) {
  color: #165dff !important;
}

:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}

:deep(.arco-typography-edit-content) {
  margin: 0;
}
</style>
