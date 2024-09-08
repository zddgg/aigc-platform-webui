<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {roleCombine, roles as queryRoles, TextRole} from "@/api/text-chapter.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {useRoute} from "vue-router";
import {ROLE_CHANGE} from "@/types/event-types.ts";
import emitter from "@/mitt";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object as PropType<TextRole>
  },
})

const emits = defineEmits(['update:visible']);

const showModal = ref<boolean>(false);

const roles = ref<TextRole[]>([]);

const formRef = ref<FormInstance>()
const form = ref<TextRole>({} as TextRole);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await roleCombine({
      projectId: route.query.projectId as string,
      chapterId: route.query.chapterId as string,
      fromRoleName: props.role?.role as string,
      toRoleName: form.value.role,
    })
    Message.success(msg);
    emitter?.emit(ROLE_CHANGE);
    done(true);
  }
  done(false)
};

const close = () => {
  emits('update:visible', false);
}

const handleQueryRoles = async () => {
  const {data} = await queryRoles({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  roles.value = data;
}

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryRoles();
        showModal.value = props.visible
        formRef.value?.resetFields();
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        :title="`角色删除-${props.role?.role}`"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-form
          ref="formRef"
          :model="form"
          size="small"
      >
        <a-form-item label="对话合并至" field="role" required>
          <a-select v-model="form.role">
            <a-option
                v-for="(item, index) in roles.filter((r: any) => r.role !== props.role?.role)"
                :key="index"
                :label="item.role"
                :value="item.role"
            />
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>