<script setup lang="ts">

import {onMounted, ref} from "vue";
import {LangText, queryEdgeTtsConfig, updateEdgeTtsConfig} from "@/api/config.ts";
import {Message} from "@arco-design/web-vue";

const langTexts = ref<LangText[]>([])
const handleQueryEdgeTtsConfig = async () => {
  const {data} = await queryEdgeTtsConfig();
  langTexts.value = data.langTexts
}

const backupText = ref<string>('');
const editStart = (value: string) => {
  backupText.value = value;
}
const editEnd = async (data: LangText, value: string) => {
  if (value === backupText.value) {
    return;
  }
  const {msg} = await updateEdgeTtsConfig(data);
  Message.success(msg);
}

onMounted(() => {
  handleQueryEdgeTtsConfig();
})
</script>

<template>
  <div>
    <a-space wrap size="medium">
      <a-row :gutter="24">
        <a-col
            v-for="(item, index) in langTexts"
            :key="index"
            :span="8"
        >
          <a-card
              hoverable
          >
            <a-descriptions
                :column="1"
                bordered
            >
              <template #title>
                {{ item.enName }}
              </template>
              <a-descriptions-item label="展示名称">
                <a-typography-text
                    v-model:edit-text="item.zhName"
                    editable
                    @edit-start="editStart(item.zhName)"
                    @edit-end="editEnd(item, item.zhName)"
                >
                  {{ item.zhName }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item label="文本">
                <a-typography-text
                    v-model:edit-text="item.text"
                    editable
                    @edit-start="editStart(item.text)"
                    @edit-end="editEnd(item, item.text)"
                >
                  {{ item.text }}
                </a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>
    </a-space>
  </div>
</template>

<style scoped>

</style>