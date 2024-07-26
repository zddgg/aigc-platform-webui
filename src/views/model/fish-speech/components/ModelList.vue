<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {FishSpeechModel, models as queryModels} from "@/api/fish-speech.ts";

const gsvModels = ref<FishSpeechModel[]>([])
const groupOptions = ref<string[]>([])
const activeKey = ref('1');

const computedGsvModels = computed(() => {
  return Object.entries(gsvModels.value.reduce((result: any, item: FishSpeechModel) => {
    if (!result[item.modelGroup]) {
      result[item.modelGroup] = [];
    }
    result[item.modelGroup].push(item);
    return result;
  }, {})).map(([group, items]) => ({group: group, list: items} as { group: string, list: FishSpeechModel[] }));
})

const handleQueryConfig = async () => {
  const {data} = await queryModels();
  gsvModels.value = data;
  groupOptions.value = [...new Set(data.map((item) => item.modelGroup))];
  activeKey.value = groupOptions.value[0]
}

const modelListRefresh = () => {
  handleQueryConfig();
}

defineExpose({modelListRefresh})

onMounted(() => {
  handleQueryConfig();
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
                :title="item1.modelName"
                :column="1"
                bordered
                style="min-width: 350px"
            >
              <a-descriptions-item label="ckpt">
                {{ item1.ckpt }}
              </a-descriptions-item>
              <a-descriptions-item label="pth">
                {{ item1.pth }}
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