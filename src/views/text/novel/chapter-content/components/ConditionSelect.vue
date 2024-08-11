<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {chapterCondition, ChapterInfo} from "@/api/text-chapter.ts";
import {CascaderOption} from "naive-ui";
import {COSY_VOICE, FISH_SPEECH, GPT_SOVITS} from "@/types/model-types.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  }
});
const emits = defineEmits(['update:visible', 'select']);

const showModal = ref(false)
const chapterInfos = ref<ChapterInfo[]>([])

const form = ref({
  role: '',
  amType: '',
  amMfId: '',
  amMcId: '',
  amPaId: '',
})

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  emits('select', form.value);
  done(true);
}

const close = () => {
  emits('update:visible', false);
}

const handleQueryChapterCondition = async () => {
  const {data} = await chapterCondition({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  });
  chapterInfos.value = data;
}

const computedRoleOptions = computed(() => {
  return Array.from(new Set(chapterInfos.value.map((item) => item.role)))
      .map((item) => {
        return {
          label: item,
          value: item,
        }
      })
})

const computedModelTypeOptions = computed(() => {
  return Array.from(new Set(chapterInfos.value.map((item) => item.amType)))
      .map((item) => {
        return {
          label: item,
          value: item,
        }
      })
})

const computedModelFileOptions = computed(() => {
  const set = new Set();
  return chapterInfos.value
      .filter((item) => item.amType === form.value.amType && !!item.amMfId && item.amMfId !== '-1')
      .map((item) => {
        if (set.has(item.amMfId)) {
          return undefined
        } else {
          set.add(item.amMfId)
          return item
        }
      })
      .filter((item) => !!item)
      .reduce((acc: any, item) => {
        const amMfGroup = item?.amMfGroup;
        let groupItem = acc.find((g: { group: string, list: [] }) => g.group === amMfGroup);
        if (!groupItem) {
          groupItem = {group: amMfGroup, list: []} as any;
          acc.push(groupItem);
        }
        groupItem.list.push(item);
        return acc;
      }, [])
      .map((item: any) => {
        return {
          label: item.group,
          value: item.group,
          children: item.list.map((item1: ChapterInfo) => {
            return {
              label: item1.amMfRole,
              value: item1.amMfId
            };
          }),
        };
      });
})

const computedModelConfigOptions = computed(() => {
  const set = new Set();
  return chapterInfos.value
      .filter((item) => item.amType === form.value.amType && !!item.amMcId)
      .map((item) => {
        if (set.has(item.amMcId)) {
          return undefined
        } else {
          set.add(item.amMcId)
          return item
        }
      })
      .filter((item) => !!item)
      .map((item) => {
        return {
          label: item?.amMcId === '-1' ? '空' : item?.amMcName,
          value: item?.amMcId,
        }
      })
})

function groupChapterInfos(chapterInfos: ChapterInfo[]): CascaderOption[] {
  const groupMap: { [key: string]: CascaderOption } = {};

  chapterInfos.forEach(model => {
    if (!groupMap[model.amPaGroup]) {
      groupMap[model.amPaGroup] = {
        label: model.amPaGroup,
        value: model.amPaGroup,
        children: []
      };
    }

    const group1 = groupMap[model.amPaGroup];

    let group2 = group1.children?.find(g => g.value === model.amPaRole);
    if (!group2) {
      group2 = {label: model.amPaRole, value: model.amPaRole, children: []};
      group1.children?.push(group2);
    }

    let group3 = group2.children?.find(g => g.value === model.amPaMood);
    if (!group3) {
      group3 = {label: model.amPaMood, value: model.amPaMood, children: []};
      group2.children?.push(group3);
    }

    let group4 = group3.children?.find(g => g.value === model.amPaAudio);
    if (!group4) {
      group4 = {
        label: model.amPaAudio,
        value: model.amPaId,
      };
      group3.children?.push(group4);
    }
  });

  return Object.values(groupMap);
}

const computedPromptAudioOptions = computed(() => {
  const set = new Set();
  const result = chapterInfos.value
      .filter((item) => item.amType === form.value.amType && !!item.amPaId && item.amPaId !== '-1')
      .map((item) => {
        if (set.has(item.amPaId)) {
          return undefined
        } else {
          set.add(item.amPaId)
          return item
        }
      })
      .filter((item) => !!item);
  return groupChapterInfos(result as any);
})

watch(() => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        handleQueryChapterCondition();
        form.value = {} as any;
      }
    },
    {immediate: true}
)
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="条件选择"
        :unmount-on-close="true"
        :width="760"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-form :model="form" :label-col-props="{span: 4}" :wrapper-col-props="{span: 20}">
        <a-form-item label="角色名称">
          <a-select v-model="form.role" :options="computedRoleOptions" allow-clear/>
        </a-form-item>
        <a-form-item label="模型类型">
          <a-select
              v-model="form.amType"
              :options="computedModelTypeOptions"
              allow-clear
              @change="() => {
                form.amMfId = ''
                form.amMcId = ''
                form.amPaId = ''
              }"
          />
        </a-form-item>
        <a-form-item v-if="[GPT_SOVITS].includes(form.amType)" label="模型文件">
          <a-cascader v-model="form.amMfId" :options="computedModelFileOptions" allow-clear/>
        </a-form-item>
        <a-form-item v-if="form.amType" label="模型配置">
          <a-select v-model="form.amMcId" :options="computedModelConfigOptions" allow-clear/>
        </a-form-item>
        <a-form-item v-if="[GPT_SOVITS, FISH_SPEECH, COSY_VOICE].includes(form.amType)" label="参考音频">
          <a-cascader v-model="form.amPaId" :options="computedPromptAudioOptions" allow-clear/>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>