<script setup lang="ts">
import CommonRole from "@/views/text/novel/chapter-role/components/CommonRole.vue";
import TextRole from "@/views/text/novel/chapter-role/components/TextRole.vue";
import {ref} from "vue";

const emits = defineEmits(['roleModelChange'])

const textRoleRef = ref<{
  refreshInner: Function
}>({
  refreshInner: () => {
  }
})

const roleModelChange = () => {
  emits('roleModelChange')
}

const refreshTextRole = () => {
  textRoleRef.value?.refreshInner()
}

defineExpose({refreshTextRole})

</script>

<template>
  <div>
    <div
        id="text-space-header"
        style="height: 32px; margin-bottom: 10px">
    </div>
    <div style="border-top: 1px #ccc solid">
      <n-scrollbar style="max-height: calc(100vh - 76px)">
        <a-card :bordered="false" style="border-radius: 8px" :body-style="{ padding: '0 10px 0 0' }">
          <n-tabs
              default-value="2"
              justify-content="space-evenly"
              type="line"
          >
            <n-tab-pane
                name="1"
                tab="文中角色"
                display-directive="show:lazy"
            >
              <text-role ref="textRoleRef" @role-model-change="roleModelChange"/>
            </n-tab-pane>
            <n-tab-pane
                name="2"
                tab="预置角色"
                display-directive="show:lazy"
            >
              <common-role @role-model-change="roleModelChange"/>
            </n-tab-pane>
          </n-tabs>
        </a-card>
      </n-scrollbar>
    </div>
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

:deep(.n-tabs-bar) {
  background-color: #165dff !important;
}

:deep(.n-tabs-tab:hover) {
  color: #165dff !important;
}

:deep(.n-tabs-tab--active) {
  color: #165dff !important;
}
</style>