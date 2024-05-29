<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {queryCommonRoles, queryRoles, Role, roleCombine} from "@/api/text.ts";
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
    const {msg} = await roleCombine({
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
        :title="`${props.roleType === 'commonRole' ? '公共角色删除' : '角色删除'}-${props.role?.role}`"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-form
          ref="formRef"
          :model="form"
          size="small"
      >
        <a-form-item label="台词合并至" field="role" required>
          <a-select v-model="form.role">
            <a-option
                v-for="(item, index) in roles.filter(r => r.role !== props.role?.role)"
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