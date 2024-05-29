<script setup lang="ts">
import {voiceNameFormat} from "@/utils/model-util.ts";
import {computed, onMounted, ref} from "vue";
import {SelectOptionData} from "@arco-design/web-vue/es/select/interface";
import {queryRefAudios, RefAudio} from "@/api/ref-audio.ts";

const emits = defineEmits(['change']);

const groupOptions = ref<string[]>([])
const selectGroup = ref<string>('')
const genderOptions = ref<SelectOptionData[]>([])
const selectGender = ref<string>('')
const ageGroupOptions = ref<string[]>([])
const selectAgeGroup = ref<string>('')
const languageOptions = ref<string[]>([])
const selectLanguage = ref<string>('')
const tagOptions = ref<string[]>([])
const selectTag = ref<string>('')

const refAudios = ref<RefAudio[]>([])

const computedRefAudios = computed(() => {
  let tmp = refAudios.value;
  if (selectGroup.value) {
    tmp = tmp.filter(item => item.group === selectGroup.value);
  }
  if (selectGender.value) {
    tmp = tmp.filter(item => item.gender === selectGender.value)
  }
  if (selectAgeGroup.value) {
    tmp = tmp.filter(item => item.ageGroup === selectAgeGroup.value)
  }
  if (selectLanguage.value) {
    tmp = tmp.filter(item => item.language === selectLanguage.value
        || item.moods.flatMap(value =>
            value.moodAudios.flatMap(value1 =>
                value1.tags)).includes(selectLanguage.value))
  }
  if (selectTag.value) {
    tmp = tmp.filter(item => item.tags?.includes(selectTag.value)
        || item.moods.flatMap(value =>
            value.moodAudios.flatMap(value1 =>
                value1.tags)).includes(selectTag.value))
  }

  return tmp;
});

const refAudioSelect = (refAudio: RefAudio) => {
  emits('change', refAudio)
}

const handleQueryRefAudio = async () => {
  const {data} = await queryRefAudios();
  refAudios.value = data;
}

onMounted(() => {
  handleQueryRefAudio();
})
</script>

<template>
  <div>
    <a-space>
      <a-select v-model="selectGroup"
                :options="groupOptions"
                allow-clear
                placeholder="群组"
                style="width: 100px"
      />
      <a-select v-model="selectGender"
                :options="genderOptions"
                allow-clear
                placeholder="性别"
                style="width: 100px"
      />
      <a-select v-model="selectAgeGroup"
                :options="ageGroupOptions"
                allow-clear
                placeholder="年龄"
                style="width: 100px"
      />
      <a-select v-model="selectLanguage"
                :options="languageOptions"
                allow-clear
                placeholder="语言"
                style="width: 100px"
      />
      <a-select v-model="selectTag"
                :options="tagOptions"
                allow-clear
                placeholder="标签"
                style="width: 100px"
      />
    </a-space>
    <div style="margin-top: 10px">
      <n-scrollbar style="height: 500px">
        <a-grid :cols="3" :col-gap="10" :row-gap="10" style="margin-right: 10px">
          <a-grid-item
              v-for="(item, index) in computedRefAudios"
              :key="index"
          >
            <a-card
                hoverable
                :body-style="{padding: '10px'}"
                style="border: 1px #ccc solid; border-radius: 8px"
                @click="refAudioSelect(item)"
            >
              <div style="display: flex; justify-content: center; align-items: center">
                <div style="width: 50%; text-align: center">
                  <div v-if="item.avatar">
                    <a-avatar :image-url="item.avatar"
                    />
                  </div>
                  <div v-else>
                    <a-avatar>
                      <span>{{ voiceNameFormat(item.name) }}</span>
                    </a-avatar>
                  </div>
                  <div style="text-align: center; margin-top: 5px">
                    <a-typography-text ellipsis>
                      {{ item.group === 'edge-tts' ? voiceNameFormat(item.name) : item.name }}
                    </a-typography-text>
                  </div>
                </div>
                <div style="width: 50%; margin-left: 10px">
                  <a-space direction="vertical" style="width: 100%">
                    <a-tag color="blue" style="display: block; width: 100%">
                      {{ item.gender ?? '未知' }}
                    </a-tag>
                    <a-tag color="green" style="display: block; width: 100%">
                      {{ item.ageGroup ?? '未知' }}
                    </a-tag>
                    <a-tag color="cyan" style="display: block; width: 100%">
                      <a-typography-text ellipsis>
                        {{ item.language ?? '未知' }}
                      </a-typography-text>
                    </a-tag>
                  </a-space>
                </div>
              </div>
            </a-card>
          </a-grid-item>
        </a-grid>
      </n-scrollbar>
    </div>
  </div>
</template>

<style scoped>

</style>