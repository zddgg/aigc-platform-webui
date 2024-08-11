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
  updateRole
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
      const {msg} = await updateRole({
        ...props.role,
        role: form.value.role,
        gender: form.value.gender,
        age: form.value.age,
      } as TextRole)
      Message.success(msg);
      done(true);
      eventBus?.emit(ROLE_CHANGE);
    }
    if (props.roleType === 'commonRole') {
      const {msg} = await updateCommonRole({
        ...props.role,
        role: form.value.role,
        gender: form.value.gender,
        age: form.value.age,
        ids: [props.role?.id]
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
        form.value = {
          role: props.role?.role,
          gender: props.role?.gender,
          age: props.role?.age,
        } as TextRole
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
        <a-form-item label="性别" field="gender">
          <a-select v-model="form.gender">
            <a-option>男</a-option>
            <a-option>女</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="年龄" field="age">
          <a-select v-model="form.age">
            <a-option>少年</a-option>
            <a-option>青年</a-option>
            <a-option>中年</a-option>
            <a-option>老年</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>