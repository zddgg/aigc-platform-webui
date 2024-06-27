<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {GptSovitsModel, models as queryModels} from "@/api/gpt-sovits.ts";

const gsvModels = ref<GptSovitsModel[]>([])
const groupOptions = ref<string[]>([])

const computedGsvModels = computed(() => {
  return Object.entries(gsvModels.value.reduce((result: any, item: GptSovitsModel) => {
    if (!result[item.modelGroup]) {
      result[item.modelGroup] = [];
    }
    result[item.modelGroup].push(item);
    return result;
  }, {})).map(([group, items]) => ({group: group, list: items} as { group: string, list: GptSovitsModel[] }));
})

const handleQueryConfig = async () => {
  const {data} = await queryModels();
  gsvModels.value = data;
  groupOptions.value = [...new Set(data.map((item) => item.modelGroup))];
}

const refresh = () => {
  handleQueryConfig();
}

defineExpose({refresh})

onMounted(() => {
  handleQueryConfig();
})
</script>

<template>
  <div>
    <a-tabs :default-active-key="groupOptions[0]" size="large">
      <a-tab-pane v-for="(item) in groupOptions" :key="item" :title="item">
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
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped>
</style>