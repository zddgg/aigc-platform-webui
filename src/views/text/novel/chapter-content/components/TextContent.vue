<script setup lang="ts">
import ContextMenu from "@/components/ContextMenu.vue";
import {computed, PropType, ref, watch} from "vue";
import {ChapterInfo, queryChapterInfo, textModelChange, updateChapterText} from "@/api/text.ts";
import {useRoute} from "vue-router";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {TextContentConfig} from "@/views/text/novel/chapter-content/useChapterContent.ts";
import {ModelSelect} from "@/api/ref-audio.ts";
import {Message} from "@arco-design/web-vue";
import RoleChangeModel from "@/views/text/novel/chapter-content/components/RoleChangeModel.vue";
import AudioSelect from '@/views/audio-select/index.vue'

const route = useRoute();
const props = defineProps({
  textContentConfig: {
    type: Object as PropType<TextContentConfig>,
    default: {
      textViewType: 'text'
    } as TextContentConfig
  },
})

const textContentConfig = ref<TextContentConfig>(props.textContentConfig)

const chapterInfos = ref<ChapterInfo[]>([])
const roleChangeModelVisible = ref<boolean>(false)
const modelSelectVisible = ref<boolean>(false);
const currentChapterInfo = ref<ChapterInfo>({} as ChapterInfo);

const handleQueryChapterInfo = async () => {
  const {data} = await queryChapterInfo({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
  })
  chapterInfos.value = data;
}

const computedChapterInfo = computed(() => {
  return chapterInfos.value.reduce((accumulator: ChapterInfo[][], currentValue: ChapterInfo) => {
    // 检查accumulator中是否已经有了当前b值的分组
    const group = accumulator.find(group => group[0].p === currentValue.p);

    if (group) {
      // 如果存在，将当前对象添加到该分组中
      group.push(currentValue);
    } else {
      // 如果不存在，创建一个新的分组
      accumulator.push([currentValue]);
    }

    return accumulator;
  }, []);
});

const textSelect = (e: Event) => {
  e.preventDefault();
  const target = e.target as HTMLElement | null;
  if (target) {
    const strings = target.id.split('-');
    if (strings.length === 3) {
      const find = chapterInfos.value
          .find((item) => item.p === Number.parseInt(strings[1]) && item.s === Number.parseInt(strings[2]));
      if (find) {
        currentChapterInfo.value = find;
      }
    }
  }
}

const contextMenuSelect = (key: string) => {
  if (key === 'changeRole') {
    roleChangeModelVisible.value = true;
  }
  if (key === 'changeModel') {
    modelSelectVisible.value = true;
  }
}

const textModelFormat = computed(() => (chapterInfo: ChapterInfo) => {
  let modelType = '';
  let ext = '';
  if (chapterInfo.modelType === 'edge-tts') {
    modelType = 'et';
    if (chapterInfo.model) {
      ext = voiceNameFormat(chapterInfo.model[0]) as string;
    }
  } else {
    if (chapterInfo.modelType === 'fish-speech') {
      modelType = 'fs'
    }
    if (chapterInfo.modelType === 'gpt-sovits') {
      modelType = 'gs';
    }
    if (chapterInfo.model && chapterInfo.audio) {
      ext = `${chapterInfo.model[1]}-${chapterInfo.audio[1]}-${chapterInfo.audio[2]}`
    }
  }
  if (modelType && ext) {
    return `${modelType}-${ext}`;
  }
  return null;
})

const modelSelect = async (modelSelect: ModelSelect) => {

  chapterInfos.value = chapterInfos.value.map((item) => {
    if (item.p === currentChapterInfo.value.p && item.s === currentChapterInfo.value.s) {
      return {
        ...item,
        ...modelSelect
      };
    }
    return item;
  });

  const {msg} = await textModelChange({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: {
      ...currentChapterInfo.value,
      ...modelSelect,
    },
  });
  Message.success(msg);
  await handleQueryChapterInfo();
}

const refresh = () => {
  handleQueryChapterInfo();
}

const backupText = ref<string>('');
const editStart = (chapterInfo: ChapterInfo) => {
  backupText.value = chapterInfo.text;
}
const editEnd = async (chapterInfo: ChapterInfo) => {
  if (chapterInfo.text === backupText.value) {
    return;
  }
  const {msg} = await updateChapterText({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    chapterInfo: chapterInfo,
  });
  Message.success(msg);
}

const scrollToTop = (id: string) => {
  const targetElement = document.getElementById(id);
  if (targetElement) {
    targetElement.scrollIntoView({behavior: 'smooth'});
  }
};

watch(
    () => route.query.chapter,
    () => {
      handleQueryChapterInfo();
      scrollToTop('text-content')
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <a-card v-if="!computedChapterInfo || computedChapterInfo.length === 0">
      <a-empty/>
    </a-card>
    <a-card v-else
            id="text-content"
            :bordered="false"
            style="border-radius: 8px"
            @click.right="(e) => e.preventDefault()"
            class="text-content"
    >
      <div>
        <p
            v-for="(item, index) in computedChapterInfo"
            :key="index"
            :class="{'text': textContentConfig.textViewType === 'text'}"
        >
              <span
                  v-for="(item1, index1) in item"
                  :id="`sentence-${item1.p}-${item1.s}`"
                  :key="index1"
                  :class="{'text-list': textContentConfig.textViewType === 'text-list'}"
              >
                <span v-if="textContentConfig.showRole && item1.role">
                  <span
                      :id="`role-${index}-${index1}`"
                      style="background-color: #c3f6f6; margin-right: 10px"
                      :style="item1.s !==0 && textContentConfig.textViewType === 'text' && {marginLeft: '10px'}"
                  >
                    {{ item1.role }}
                  </span>
                </span>
                <span v-if="textContentConfig.showModal && textModelFormat(item1)">
                  <span
                      :id="`model-${index}-${index1}`"
                      style="background-color: #f6dcc3; margin-right: 10px"
                  >
                      {{ textModelFormat(item1) }}
                  </span>
                </span>
                <span v-if="textContentConfig.showAudio && item1.modelType">
                  <a-tag color="blue" style="margin-right: 10px">
                    <icon-play-arrow/>
                  </a-tag>
                </span>
                <span>
                  <context-menu
                      :menu="[
                      { label: '改角色', value: 'changeRole' },
                      { label: '改模型', value: 'changeModel' }
                    ]"
                      @select="contextMenuSelect"
                  >
                    <a-typography-text
                        :id="`text-${index}-${index1}`"
                        :type="item1.modelType ? 'normal' : 'danger'"
                        :class="{'lines-color': textContentConfig.showLines && item1.linesFlag}"
                        v-model:edit-text="item1.text"
                        :editable="props.textContentConfig.textEdit"
                        @edit-start="editStart(item1)"
                        @edit-end="editEnd(item1)"
                        @click.right="textSelect"
                    >
                      {{ item1.text }}
                    </a-typography-text>
                  </context-menu>
                </span>
              </span>
        </p>
      </div>
    </a-card>
    <audio-select
        v-model:visible="modelSelectVisible"
        :model-select="currentChapterInfo"
        @change="modelSelect"
    />
    <role-change-model
        v-model:visible="roleChangeModelVisible"
        :chapter-info="currentChapterInfo"
        @success="refresh"
    />
  </div>
</template>

<style scoped>
.text-content {
  font-size: 18px;
  line-height: 1.5;
}

.text-list {
  display: block;
}

.text {
  text-indent: 2em;
}

.lines-color {
  background-color: #3367D1;
  color: #ffffff;
}

.highlight {
  background-color: yellow;
  color: #000000;
}
</style>