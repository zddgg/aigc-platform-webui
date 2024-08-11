<script setup lang="ts">
import {onMounted, ref} from "vue";
import {editLangDict, LangDict, langDictSort, queryLangDicts} from "@/api/dict.ts";
import {TableColumnData} from "@arco-design/web-vue";
import {VueDraggable} from "vue-draggable-plus";

const columns: TableColumnData[] = [
  {title: '英文描述', dataIndex: 'enName', width: 200},
  {title: '中文描述', slotName: 'zhName'},
  {title: '示例文本', slotName: 'text'},
  {title: '操作', slotName: 'operations', width: 200},
]

const langDicts = ref<(LangDict & { edit: boolean })[]>([])

const handleLangDicts = async () => {
  const {data} = await queryLangDicts()
  langDicts.value = data as any;
}

const handleLangEdit = async (langDict: LangDict & { edit: boolean }) => {
  await editLangDict(langDict);
  langDict.edit = false;
}

const handleLangSort = async () => {
  await langDictSort(langDicts.value);
}

onMounted(() => {
  handleLangDicts();
})
</script>

<template>
  <div>
    <a-empty v-if="!langDicts || !langDicts.length"/>
    <div v-else>
      <vue-draggable v-model="langDicts" target="tbody" :animation="150" :on-update="handleLangSort">
        <a-table
            :data="langDicts"
            :columns="columns"
            :bordered="{cell:true}"
            :pagination="false"
        >
          <template #zhName="{ record }">
            <span v-if="!record.edit">
              {{ record.zhName }}
            </span>
            <div v-else>
              <a-input v-model="record.zhName"/>
            </div>
          </template>
          <template #text="{ record }">
            <span v-if="!record.edit">
              {{ record.text }}
            </span>
            <div v-else>
              <a-input v-model="record.text"/>
            </div>
          </template>
          <template #operations="{ record }">
            <a-space>
              <a-button
                  v-if="!record.edit"
                  size="mini"
                  @click="record.edit = true"
              >
                <icon-edit/>
              </a-button>
              <a-button
                  v-else
                  type="outline"
                  size="mini"
                  @click="handleLangEdit(record)"
              >
                <icon-check/>
              </a-button>
            </a-space>
          </template>
        </a-table>
      </vue-draggable>
    </div>
  </div>
</template>

<style scoped>

</style>