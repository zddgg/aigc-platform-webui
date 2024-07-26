import {defineStore} from 'pinia';
import {ref} from 'vue';
import {getPinyinData} from '@/api/pinyin';
import {PinyinState} from "@/store/pinyin/types.ts";

const usePinyinStore = defineStore('pinyin', () => {
  const pinyinData = ref<PinyinState>({});

  const fetchPinyinData = async () => {
    try {
      const result = await getPinyinData();
      pinyinData.value = result.data;
    } catch (error) {
      console.error('Error fetching pinyin data:', error);
    }
  };

  const getPinyinList = (text: string): string[] => {
    const unicodeKey = convertCharToUnicode(text);
    return pinyinData.value[unicodeKey];
  };

  return {
    pinyinData,
    fetchPinyinData,
    getPinyinList,
  };
});

const convertCharToUnicode = (char: string): string => {
  const unicode = char.charCodeAt(0).toString(16).toUpperCase();
  return `U+${'0000'.substring(0, 4 - unicode.length) + unicode}`;
};

export default usePinyinStore;
