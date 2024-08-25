<template>
  <div>
    <div v-if="!textEdit" style="display: inline">
      <context-menu :menu="contextMenuItems" @select="handleContextMenuSelect">
        <span
            v-for="(item, index) in subTextInfos"
            :key="index"
            class="ruby-item"
            @contextmenu="handleContextMenu"
        >
          <span v-if="!item.hasMarkup" :data-index="index">
            {{ item.text }}
          </span>
          <span v-else>
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
                        v-if="item.markup"
                        color="blue"
                        bordered
                        size="small"
                        style="padding: 0 5px; cursor: pointer; letter-spacing: 0"
                    >
                    {{ item.markup }}
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
                      <div v-if="item.markup">
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
    <div v-else style="display: flex; align-items: center;">
      <a-textarea v-model="backupText" :auto-size="{minRows: 1, maxRows: 5}" style="flex: 1"/>
      <a-button
          size="small" type="outline" style="margin-left: 10px"
          @click="onTextChange"
      >
        <icon-check/>
      </a-button>
      <a-button
          size="small" type="outline" status="danger" style="margin-left: 10px"
          @click="() => {
            textEdit = false;
            backupText = ''
          }"
      >
        <icon-close/>
      </a-button>
    </div>
    <span v-if="textContentConfig.edit && !textEdit" class="text-edit-icon">
        <icon-edit @click="() => {
          textEdit = true;
          backupText = chapterInfo?.text as string
        }"/>
    </span>
  </div>
</template>

<script setup lang="ts">
import {PropType, ref, watch} from 'vue';
import ContextMenu from "@/components/ContextMenu.vue";
import {usePinyinStore} from "@/store"
import {
  addPolyphonicInfo,
  ChapterInfo,
  PolyphonicInfo,
  removePolyphonicInfo,
  TextContentConfig,
  updateChapterText
} from "@/api/text-chapter.ts";

const pinyinStore = usePinyinStore();

const props = defineProps({
  chapterInfo: {
    type: Object as PropType<ChapterInfo>
  },
  textContentConfig: {
    type: Object as PropType<TextContentConfig>,
    default: {} as TextContentConfig
  },
})

const emits = defineEmits(['change'])

const data = ref<{
  text: string;
  pinyin: string,
  pinyins: string[],
  showPinyins: boolean,
}[]>([]);

const contextMenuItems = ref<{ label: string; value: string; disabled: boolean }[]>([
  {label: '多音字', value: 'duoyinzi', disabled: false},
]);

const partIndex = ref(-1);

const textEdit = ref<boolean>(false)
const backupText = ref<string>('')


interface SubTextInfo {
  text: string;
  startIndex: number;
  endIndex: number;
  hasMarkup: boolean;
  markup?: string,
  pinyins?: string[],
  showPinyins?: boolean,
}

function splitTextByIndexes(polyphonicInfos: PolyphonicInfo[], text: string) {
  const result: SubTextInfo[] = [];
  let previousIndex = 0;

  polyphonicInfos.sort((a, b) => a.index - b.index)
      .forEach((item) => {
        // 添加前一段子字符串
        if (previousIndex !== item.index) {
          result.push(
              {
                text: text.slice(previousIndex, item.index),
                startIndex: previousIndex,
                endIndex: item.index - 1,
                hasMarkup: false,
              }
          );
        }
        // 添加当前索引位置的字符
        result.push({
          text: text[item.index],
          startIndex: item.index,
          endIndex: item.index,
          hasMarkup: true,
          markup: item.markup,
          pinyins: pinyinStore.getPinyinList(text[item.index])
        });
        previousIndex = item.index + 1; // 更新 previousIndex
      });

  // 添加剩余的子字符串
  if (previousIndex < text.length) {
    result.push({
      text: text.slice(previousIndex),
      startIndex: previousIndex,
      endIndex: text.length - 1,
      hasMarkup: false
    });
  }

  return result;
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    contextMenuItems.value = [];
    return;
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection ? selection.toString() : '';

  const spanElement = range.startContainer.parentNode;

  if (!spanElement) {
    contextMenuItems.value = [];
    return;
  }

  const startIndex = range.startOffset;

  if (selectedText.length === 1 && pinyinStore.getPinyinList(selectedText)) {
    contextMenuItems.value = [
      {label: '多音字', value: 'duoyinzi', disabled: false},
    ];
    const target = event.target as HTMLElement;

    const tmpPartIndex = Number(target.getAttribute('data-index'));

    let preAllIndex = 0;
    if (tmpPartIndex > 0) {
      preAllIndex = (subTextInfos.value[tmpPartIndex - 1].endIndex || 0) + 1;
    }

    const result = splitTextByIndexes(
        [{index: startIndex, markup: ''}],
        subTextInfos.value[tmpPartIndex].text
    ).map(item => {
      return {
        ...item,
        startIndex: item.startIndex + preAllIndex,
        endIndex: item.endIndex + preAllIndex,
      }
    })


    subTextInfos.value.splice(tmpPartIndex, 1, ...result)
    partIndex.value = tmpPartIndex + (startIndex === 0 ? 0 : 1);

    contextMenuItems.value = [
      {label: '多音字', value: 'duoyinzi', disabled: false},
    ];
  } else {
    contextMenuItems.value = [];
  }
};

const handleContextMenuSelect = (menu: string) => {
  if (menu === 'duoyinzi') {
    subTextInfos.value = subTextInfos.value
        ?.map((item, index) => {
          if (index === partIndex.value) {
            return {
              ...item,
              pinyins: pinyinStore.getPinyinList(item.text[0]),
              showPinyins: true,
            } as any
          }
          return {
            ...item,
            pinyins: [],
            showPinyins: false,
          }
        })
  }
}

const selectPinyin = async (i: number, pinyin: string) => {
  let inTextIndex = 0
  subTextInfos.value = subTextInfos.value
      ?.map((item, index) => {
        if (index === i) {
          inTextIndex = subTextInfos.value[index].startIndex

          return {
            ...item,
            hasMarkup: true,
            markup: pinyin,
            showPinyins: false,
          }
        }
        return item
      })
  if (props.chapterInfo?.id) {
    await addPolyphonicInfo({
      chapterInfoId: props.chapterInfo.id,
      index: inTextIndex,
      markup: pinyin
    })
  }
}

const removePinyin = async (i: number) => {
  let inTextIndex = 0
  subTextInfos.value = subTextInfos.value
      ?.map((item, index) => {
        if (index === i) {
          inTextIndex = subTextInfos.value[index].startIndex
          return {
            ...item,
            hasMarkup: false,
            markup: '',
            showPinyins: false,
          }
        }
        return item
      })
  if (props?.chapterInfo?.id) {
    await removePolyphonicInfo({
      chapterInfoId: props.chapterInfo.id,
      index: inTextIndex,
    } as any)
  }
};

const onTextChange = async () => {
  await updateChapterText({
    id: props.chapterInfo?.id as number,
    text: backupText.value
  } as ChapterInfo);
  textEdit.value = false;
  emits('change')
}

watch(
    () => props.textContentConfig?.edit,
    () => {
      if (!props.textContentConfig?.edit) {
        textEdit.value = false;
        backupText.value = '';
      }
    },
    {immediate: true}
)


const subTextInfos = ref<SubTextInfo[]>([]);

watch(
    () => props.chapterInfo?.text,
    () => {
      if (props.chapterInfo?.text) {

        subTextInfos.value = splitTextByIndexes(props.chapterInfo?.textMarkupInfo.polyphonicInfos, props.chapterInfo?.text)

        data.value = props.chapterInfo?.text.split('')
            .map((item, index) => {
              const find = props.chapterInfo?.textMarkupInfo.polyphonicInfos
                  ?.find((item1) => item1.index === index && item1.markup)
              return {
                text: item,
                pinyin: find ? find.markup : undefined,
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
  font-size: 16px;
  letter-spacing: 4px;
}

.ruby-rt {
  user-select: none;
  font-size: 12px;
}

:deep(.arco-icon-hover.arco-tag-icon-hover::before) {
  width: 12px;
  height: 12px;
}

.text-edit-icon {
  margin-left: 5px;
  padding: 0 2px
}

.text-edit-icon:hover {
  background-color: #e0e0e0;
  border-radius: 4px;
}
</style>
