<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {queryCommonRoles, queryRoles, Role, roleRename} from "@/api/text.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {useRoute} from "vue-router";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object as PropType<Role>
  },
  roleType: {
    type: String as PropType<'role' | 'commonRole'>
  }
})

const emits = defineEmits(['update:visible', 'success']);
const showModal = ref<boolean>(false);

const roles = ref<Role[]>([]);
const commonRoles = ref<Role[]>([]);

const formRef = ref<FormInstance>()
const form = ref<Role>({} as Role);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    if (form.value.role === props.role?.role) {
      done(true);
    }
    const find = roles.value.find(item => item.role === form.value.role && item.role !== props.role?.role);
    if (find && props.roleType === 'role') {
      formRef.value?.setFields({
        role: {
          status: 'error',
          message: `已存在[${find.role}]角色名`
        },
      });
      done(false);
    } else {
      const {msg} = await roleRename({
        chapter: {
          project: route.query.project as string,
          chapter: route.query.chapter as string,
        },
        role: props.role?.role as string,
        newRole: form.value.role,
        roleType: props.roleType as string,
      })
      Message.success(msg);
      emits('success')
      done(true);
    }
  }
  done(false)
};

const close = () => {
  emits('update:visible', false);
}

const handleQueryRoles = async () => {
  const {data} = await queryRoles({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
  })
  roles.value = data;
}

const handleQueryCommonRoles = async () => {
  const {data} = await queryCommonRoles({
    project: route.query.project as string,
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
        <a-form-item label="role" field="role" required>
          <a-input v-model="form.role"/>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>