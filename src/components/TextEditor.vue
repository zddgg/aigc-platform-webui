<template>
  <div>
    <context-menu :menu="contextMenuItems" @select="handleContextMenuSelect">
      <span
          v-for="(item, index) in data"
          :key="index"
          class="ruby-item"
          @contextmenu="handleContextMenu"
      >
        <span>
          <ruby :data-index="index">
            {{ item.text }}
            <rt class="ruby-rt">
              <a-popover
                  v-model:popup-visible="item.showPinyins"
                  trigger="click"
                  :content-style="{ padding: '10px' }"
              >
                <div>
                  <a-tag
                      v-if="item.pinyin"
                      color="blue"
                      bordered
                      size="small"
                      style="padding: 0 5px; cursor: pointer"
                  >
                  {{ item.pinyin }}
                </a-tag>
                </div>
                <template #content>
                  <div style="display: flex; place-items: center">
                    <a-space>
                      <a-button
                          v-for="(item1, index1) in item.pinyins"
                          :key="index1"
                          size="small"
                          @click="selectPinyin(index, item1)"
                      >
                        {{ item1 }}
                      </a-button>
                    </a-space>
                    <div v-if="item.pinyin">
                      <a-divider direction="vertical"/>
                      <a-button size="small" @click="removePinyin(index)">
                        移除
                      </a-button>
                    </div>
                  </div>
                </template>
              </a-popover>
            </rt>
          </ruby>
        </span>
      </span>
    </context-menu>
  </div>
</template>

<script setup lang="ts">
import {PropType, ref, watch} from 'vue';
import ContextMenu from "@/components/ContextMenu.vue";
import {usePinyinStore} from "@/store"
import {addPhoneticAnno, ChapterInfo, PhoneticAnno, removePhoneticAnno} from "@/api/text-chapter.ts";

const pinyinStore = usePinyinStore();

const props = defineProps({
  chapterInfo: {
    type: Object as PropType<ChapterInfo>
  },
})

const data = ref<{
  text: string;
  pinyin: string,
  pinyins: string[],
  showPinyins: boolean,
}[]>([]);
const contextMenuItems = ref<{ label: string; value: string; disabled: boolean }[]>([
  {label: '多音字', value: 'duoyinzi', disabled: false},
]);
const currentIndex = ref(-1);

const removePinyin = async (i: number) => {
  data.value = data.value?.map((item, index) => {
    if (index === i) {
      return {
        text: item.text,
        showPinyins: false,
      } as any;
    }
    return item;
  });
  if (props?.chapterInfo?.id) {
    await removePhoneticAnno({
      chapterInfoId: props.chapterInfo.id,
      type: 'duoyinzi',
      index: i,
    } as any)
  }
};

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString() : '';
  const numSelectedChars = selectedText.length;

  if (numSelectedChars === 1 && pinyinStore.getPinyinList(selectedText)) {
    contextMenuItems.value = [
      {label: '多音字', value: 'duoyinzi', disabled: false},
    ];
    const target = event.target as HTMLElement;
    currentIndex.value = Number(target.getAttribute('data-index'));
  } else {
    contextMenuItems.value = [];
  }
};

const handleContextMenuSelect = (menu: string) => {
  if (menu === 'duoyinzi') {
    data.value = data.value?.map((item, index) => {
      if (index === currentIndex.value) {
        return {
          text: item.text,
          pinyin: item.pinyin,
          pinyins: pinyinStore.getPinyinList(item.text),
          showPinyins: true,
        } as any
      }
      return item
    })
  }
}

const selectPinyin = async (i: number, pinyin: string) => {
  data.value = data.value?.map((item, index) => {
    if (index === i) {
      return {
        ...item,
        pinyin: pinyin,
        showPinyins: false,
      } as any
    }
    return item
  })
  if (props.chapterInfo?.id) {
    await addPhoneticAnno({
      chapterInfoId: props.chapterInfo.id,
      type: 'duoyinzi',
      index: i,
      pinyin: pinyin
    })
  }
}

watch(
    () => props.chapterInfo?.text,
    () => {
      if (props.chapterInfo?.text) {
        data.value = props.chapterInfo?.text.split('')
            .map((item, index) => {
              const find = (JSON.parse(props.chapterInfo?.phoneticInfo ?? '[]') as PhoneticAnno[])
                  ?.find((item1) => item1.type === 'duoyinzi' && item1.index === index)
              return {
                text: item,
                pinyin: find ? find.pinyin : undefined,
                pinyins: pinyinStore.getPinyinList(item)
              } as any;
            });
      }
    },
    {immediate: true}
)

</script>

<style scoped>
.ruby-item {
  display: inline-block;
  font-size: 16px;
}

.ruby-rt {
  user-select: none;
  font-size: 12px;
}

:deep(.arco-icon-hover.arco-tag-icon-hover::before) {
  width: 12px;
  height: 12px;
}
</style>
