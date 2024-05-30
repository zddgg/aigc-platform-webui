<script setup lang="ts">
import {ref, watch} from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  }
});
const emits = defineEmits(['update:visible']);

const showModal = ref(false)

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  // const res = await formRef.value?.validate();
  // if (!res) {
  //   done(false);
  // } else {
  //   done(false);
  // }
  done(true);
}

const close = () => {
  emits('update:visible', false);
}

watch(() => props.visible,
    () => {
      showModal.value = props.visible
    },
    {immediate: true}
)
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="批量处理"
        :unmount-on-close="true"
        :width="700"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <div style="display: flex;">
        <div style="width: 40%">
          条件
        </div>
        <a-divider direction="vertical"/>
        <div style="width: 60%">
          值
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>