<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {Message, Modal} from "@arco-design/web-vue";
import useLoading from "@/hooks/loading.ts";
import {deleteProject, projectList, TextProject} from "@/api/text-project.ts";
import ChapterText from "@/views/text/components/ChapterText.vue";
import FormatText from "@/views/text/components/FormatText.vue";
import {TextProjectType} from "@/types/global.ts";

const router = useRouter();
const {loading, setLoading} = useLoading();

const chapterTextVisible = ref<boolean>(false);
const formatTextVisible = ref<boolean>(false);
const projectType = ref<string>(TextProjectType.long_text);

const textProjects = ref<TextProject[]>([])

const handleProjectList = async () => {
  const {data} = await projectList()
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
                @click="() => (chapterTextVisible = true)"
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
                v-for="(item, index) in textProjects.filter((item1) => item1.projectType === TextProjectType.long_text)"
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
                @click="() => (chapterTextVisible = true)"
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
                v-for="(item, index) in textProjects.filter((item1) => item1.projectType === TextProjectType.short_text)"
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
      <a-tab-pane key="format_text">
        <template #title>
          <icon-list/>
          格式化文本
        </template>
        <div>
          <a-space wrap size="large" align="start">
            <a-card
                style="width: 340px; height: 180px; display: flex; align-items: center"
                :body-style="{width:'100%'}"
                @click="() => (formatTextVisible = true)"
            >
              <div style=" text-align: center">
                <div>
                  <icon-plus/>
                </div>
                <div>
                  <div>
                    <span>新建格式化文本项目</span>
                  </div>
                  <div>
                    <span>（格式化文本）</span>
                  </div>
                </div>
              </div>
            </a-card>
            <a-card
                v-for="(item, index) in textProjects.filter((item1) => item1.projectType === TextProjectType.format_text)"
                :key="index"
                style="width: 350px"
            >
              <a-descriptions :title="item.projectName" :column="1" bordered>
                <a-descriptions-item label="类型">
                  {{ '格式化文本' }}
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
    <chapter-text
        v-model:visible="chapterTextVisible"
        :project-type="projectType"
        @close="() => handleProjectList()"
    />
    <format-text
        v-model:visible="formatTextVisible"
        :project-type="projectType"
        @close="() => handleProjectList()"
    />
    <a-modal>

    </a-modal>
  </div>
</template>

<style scoped>
</style>