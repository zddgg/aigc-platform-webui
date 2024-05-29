<script setup lang="ts">
import CommonRole from "@/views/text/novel/chapter-role/components/CommonRole.vue";
import TextRole from "@/views/text/novel/chapter-role/components/TextRole.vue";

const emits = defineEmits(['roleModelChange'])

const roleModelChange = () => {
  emits('roleModelChange')
}

</script>

<template>
  <div style="margin-top: 42px; border: 1px #ccc solid; border-radius: 8px">
    <n-scrollbar style="max-height: calc(100vh - 74px)">
      <a-card :bordered="false" style="border-radius: 8px">
        <n-tabs
            default-value="1"
            justify-content="space-evenly"
            type="line"
        >
          <n-tab-pane
              name="1"
              tab="文本中的角色"
              display-directive="show:lazy"
          >
            <text-role @role-model-change="roleModelChange"/>
          </n-tab-pane>
          <n-tab-pane
              name="2"
              tab="预置角色"
              display-directive="show"
          >
            <common-role @role-model-change="roleModelChange"/>
          </n-tab-pane>
        </n-tabs>
      </a-card>
    </n-scrollbar>

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