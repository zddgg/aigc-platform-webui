<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import ProjectCreate from './components/ProjectCreate.vue'
import {deleteProject, projectList} from "@/api/text.ts";
import {Message, Modal} from "@arco-design/web-vue";
import useLoading from "@/hooks/loading.ts";

const router = useRouter();
const {loading, setLoading} = useLoading();

const projectCreateVisible = ref(false);

const projects = ref<string[]>([])

const handleProjectList = async () => {
  const {data} = await projectList()
  projects.value = data;
}

const handleDeleteProject = (item: string) => {
  Modal.error({
    title: '删除项目',
    content:
        '会删除整个项目文件夹，包括项目的文本解析、角色台词、模型配置、语音配置、生成的音频等',
    async onOk() {
      try {
        setLoading(true);
        const {msg} = await deleteProject({project: item});
        Message.success(msg);
        await handleProjectList();
      } finally {
        setLoading(false);
      }
    },
  });
};

const textProjectRoute = (project: string) => {
  router.push({
    name: 'Novel',
    query: {
      project: project
    }
  })
}

onMounted(() => {
  handleProjectList();
})

</script>

<template>
  <div style="padding: 20px">
    <a-tabs type="rounded" size="large">
      <a-tab-pane key="1">
        <template #title>
          <div>
            <icon-calendar/>
            章节小说
          </div>
        </template>
        <div>
          <a-space wrap size="large" align="start">
            <a-card style="width: 340px; height: 180px; display: flex; align-items: center"
                    :body-style="{width:'100%'}"
                    @click="() => (projectCreateVisible = true)"
            >
              <div style=" text-align: center">
                <div>
                  <icon-plus/>
                </div>
                <div style="margin-top: 10px">
                  <span>新建项目</span>
                </div>
              </div>
            </a-card>
            <a-card v-for="(item, index) in projects" :key="index" style="width: 350px">
              <a-descriptions :title="item" :column="1" bordered>
                <a-descriptions-item label="类型">
                  章节小说
                </a-descriptions-item>
                <a-descriptions-item label="章节">
                  1304
                </a-descriptions-item>
              </a-descriptions>
              <div style="display: flex; justify-content: right; margin-top: 10px">
                <a-space>
                  <a-button
                      type="outline"
                      @click="textProjectRoute(item)"
                  >
                    进入空间
                  </a-button>
                  <a-button
                      type="outline"
                      status="danger"
                      :loading="loading"
                      @click="handleDeleteProject(item)"
                  >
                    删除
                  </a-button>
                </a-space>
              </div>
            </a-card>
          </a-space>
        </div>
      </a-tab-pane>
      <a-tab-pane v-if="false" key="2">
        <template #title>
          <icon-clock-circle/>
          短文本
        </template>
      </a-tab-pane>
    </a-tabs>
    <project-create
        v-model:visible="projectCreateVisible"
        @close="() => handleProjectList()"
    />
  </div>
</template>

<style scoped>
</style>