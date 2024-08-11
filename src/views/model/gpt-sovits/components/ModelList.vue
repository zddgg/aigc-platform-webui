<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {AmModelFile, getByModelType} from "@/api/am-model-file.ts";
import {GPT_SOVITS} from "@/types/model-types.ts";

const gsvModels = ref<AmModelFile[]>([])
const groupOptions = ref<string[]>([])

const activeKey = ref('1');

const computedGsvModels = computed(() => {
  return Object.entries(gsvModels.value.reduce((result: any, item: AmModelFile) => {
    if (!result[item.mfGroup]) {
      result[item.mfGroup] = [];
    }
    result[item.mfGroup].push(item);
    return result;
  }, {})).map(([group, items]) => ({group: group, list: items} as { group: string, list: AmModelFile[] }));
})

const handleQueryModelFiles = async () => {
  const {data} = await getByModelType({modelType: GPT_SOVITS});
  gsvModels.value = data;
  groupOptions.value = [...new Set(data.map((item) => item.mfGroup))];
  activeKey.value = groupOptions.value[0]
}

onMounted(() => {
  handleQueryModelFiles();
})
</script>

<template>
  <div>
    <n-tabs v-model:value="activeKey" type="card" size="small" animated>
      <n-tab-pane v-for="(item) in groupOptions" :name="item" :tab="item">
        <a-space size="medium" wrap>
          <a-card
              v-for="(item1, index1) in computedGsvModels
                .filter(value => value.group === item)
                .flatMap(value => value.list)"
              :key="index1"
              hoverable
          >
            <a-descriptions
                size="large"
                :title="item1.mfRole"
                :column="1"
                bordered
                style="min-width: 350px"
            >
              <a-descriptions-item
                  v-for="(item2, index2) in JSON.parse(item1.mfJson)"
                  :key="index2"
                  :label="item2.fileType"
              >
                {{ item2.fileName }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-space>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
</style>