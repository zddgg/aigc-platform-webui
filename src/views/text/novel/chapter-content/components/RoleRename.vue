<script setup lang="ts">
import {inject, PropType, ref, watch} from "vue";
import {FormInstance, Message} from "@arco-design/web-vue";
import {useRoute} from "vue-router";
import {COMMON_ROLE_CHANGE, ROLE_CHANGE} from "@/types/event-types.ts";
import {EventBus} from "@/vite-env";
import {
  commonRoles as queryCommonRoles,
  roles as queryRoles,
  TextRole,
  updateCommonRole,
  updateRoleName
} from "@/api/text-chapter.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object as PropType<TextRole>
  },
  roleType: {
    type: String as PropType<'role' | 'commonRole'>
  }
})

const emits = defineEmits(['update:visible']);
const eventBus = inject<EventBus>('eventBus');

const showModal = ref<boolean>(false);

const roles = ref<TextRole[]>([]);
const commonRoles = ref<TextRole[]>([]);

const formRef = ref<FormInstance>()
const form = ref<TextRole>({} as TextRole);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    if (form.value.role === props.role?.role) {
      done(true);
      return;
    }
    const find = (props.roleType === 'role' ? roles.value : commonRoles.value)
        .find(item => item.role === form.value.role && item.role !== props.role?.role);

    if (find) {
      formRef.value?.setFields({
        role: {
          status: 'error',
          message: `已存在[${find.role}]角色名`
        },
      });
      done(false);
      return;
    }

    if (props.roleType === 'role') {
      const {msg} = await updateRoleName({
        ...props.role,
        role: form.value.role,
      } as TextRole)
      Message.success(msg);
      done(true);
      eventBus?.emit(ROLE_CHANGE);
    }
    if (props.roleType === 'commonRole') {
      const {msg} = await updateCommonRole({
        ...props.role,
        role: form.value.role,
      } as TextRole)
      Message.success(msg);
      done(true);
      eventBus?.emit(COMMON_ROLE_CHANGE);
    }
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

const handleQueryCommonRoles = async () => {
  const {data} = await queryCommonRoles({
    projectId: route.query.projectId as string,
  });
  commonRoles.value = data;
}

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryRoles();
        await handleQueryCommonRoles();
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
        :title="`${props.roleType === 'commonRole' ? '公共角色改名' : '角色改名'}-${props.role?.role}`"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-form
          ref="formRef"
          :model="form"
          size="small"
      >
        <a-form-item label="角色名" field="role" required>
          <a-input v-model="form.role"/>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>