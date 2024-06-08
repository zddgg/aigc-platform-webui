<script setup lang="ts">

import {onMounted, ref} from "vue";
import {LangText, queryEdgeTtsConfig, updateEdgeTtsConfig} from "@/api/config.ts";
import {Message} from "@arco-design/web-vue";
import useLoading from "@/hooks/loading.ts";

const {loading, setLoading} = useLoading();

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

const showValueChange = async (data: LangText) => {
  try {
    setLoading(true);
    const {msg} = await updateEdgeTtsConfig(data);
    Message.success(msg);
    setTimeout(() => setLoading(false), 1000)
  } catch (error) {
    setLoading(false);
  }
}

onMounted(() => {
  handleQueryEdgeTtsConfig();
})
</script>

<template>
  <div>
    <a-grid :col-gap="20" :row-gap="20" :cols="3">
      <a-grid-item
          v-for="(item, index) in langTexts"
          :key="index"
      >
        <a-card
            hoverable
        >
          <a-descriptions
              :column="1"
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
            <a-descriptions-item label="是否展示">
              <a-switch
                  v-model="item.show"
                  checked-text="是"
                  :checked-value="true"
                  unchecked-text="否"
                  :unchecked-value="false"
                  :loading="loading"
                  type="round"
                  @change="() => showValueChange(item)"
              />
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<style scoped>

</style>