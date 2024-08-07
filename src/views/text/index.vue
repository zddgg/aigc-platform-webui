<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import ProjectCreate from './components/ProjectCreate.vue'
import {Message, Modal} from "@arco-design/web-vue";
import useLoading from "@/hooks/loading.ts";
import {deleteProject, list as queryTextProjectList, TextProject} from "@/api/text-project.ts";

const router = useRouter();
const {loading, setLoading} = useLoading();

const projectCreateVisible = ref<boolean>(false);
const projectType = ref<string>('long_text');

const textProjects = ref<TextProject[]>([])

const handleProjectList = async () => {
  const {data} = await queryTextProjectList()
  textProjects.value = data;
}

const handleDeleteProject = (project: TextProject) => {
  Modal.error({
    title: '删除项目',
    content:
        '会删除整个项目相关的数据，包括项目的文本解析、角色台词、模型配置、语音配置、生成的音频等',
    async onOk() {
      try {
        setLoading(true);
        const {msg} = await deleteProject(project);
        Message.success(msg);
        await handleProjectList();
      } finally {
        setLoading(false);
      }
    },
  });
};

const textProjectRoute = (project: TextProject) => {
  router.push({
    name: 'Novel',
    query: {
      projectName: project.projectName,
      projectId: project.projectId,
      projectType: project.projectType,
    }
  })
}

onMounted(() => {
  handleProjectList();
})

</script>

<template>
  <div style="padding: 20px">
    <a-tabs type="rounded" size="large" @change="(value) => (projectType = value as string)">
      <a-tab-pane key="long_text">
        <template #title>
          <div>
            <icon-book/>
            章节长文本
          </div>
        </template>
        <div>
          <a-space wrap size="large" align="start">
            <a-card
                style="width: 340px; height: 180px; display: flex; align-items: center"
                :body-style="{width:'100%'}"
                @click="() => (projectCreateVisible = true)"
            >
              <div style=" text-align: center">
                <div>
                  <icon-plus/>
                </div>
                <div>
                  <div>
                    <span>新建章节长文本项目</span>
                  </div>
                  <div>
                    <span>（多章节长文本）</span>
                  </div>
                </div>
              </div>
            </a-card>
            <a-card
                v-for="(item, index) in textProjects.filter((item1) => item1.projectType === 'long_text')"
                :key="index"
                style="width: 350px"
            >
              <a-descriptions :title="item.projectName" :column="1" bordered>
                <a-descriptions-item label="类型">
                  {{ '章节长文本' }}
                </a-descriptions-item>
                <a-descriptions-item label="章节">
                  {{ item.chapterCount ?? 0 }}
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
      <a-tab-pane key="short_text">
        <template #title>
          <icon-file/>
          短文本
        </template>
        <div>
          <a-space wrap size="large" align="start">
            <a-card
                style="width: 340px; height: 180px; display: flex; align-items: center"
                :body-style="{width:'100%'}"
                @click="() => (projectCreateVisible = true)"
            >
              <div style=" text-align: center">
                <div>
                  <icon-plus/>
                </div>
                <div>
                  <div>
                    <span>新建短文本项目</span>
                  </div>
                  <div>
                    <span>（单章节短文本）</span>
                  </div>
                </div>
              </div>
            </a-card>
            <a-card
                v-for="(item, index) in textProjects.filter((item1) => item1.projectType === 'short_text')"
                :key="index"
                style="width: 350px"
            >
              <a-descriptions :title="item.projectName" :column="1" bordered>
                <a-descriptions-item label="类型">
                  {{ '短文本' }}
                </a-descriptions-item>
                <a-descriptions-item label="章节">
                  {{ item.chapterCount }}
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
    </a-tabs>
    <project-create
        v-model:visible="projectCreateVisible"
        :project-type="projectType"
        @close="() => handleProjectList()"
    />
  </div>
</template>

<style scoped>
</style>