<template>
    <el-container>
        <el-header>
            <h1>番茄钟</h1>
        </el-header>
        <el-main>
            <el-row>
                <el-col :span="12">
                    <h2>计时器</h2>
                    <el-progress :percentage="percentage"></el-progress>
                    <el-button type="primary" @click="startTimer">开始</el-button>
                    <el-button @click="resetTimer">重置</el-button>
                </el-col>
                <el-col :span="12">
                    <h2>任务列表</h2>
                    <el-input v-model="newTask" placeholder="添加新任务"></el-input>
                    <el-button type="primary" @click="addTask">添加</el-button>
                    <el-menu :data="tasks">
                        <el-menu-item v-for="task in tasks" :key="task.id">{{ task.name }}</el-menu-item>
                    </el-menu>
                </el-col>
            </el-row>
        </el-main>
    </el-container>
</template>
  
<script>
import { ref } from 'vue';
export default {
    setup() {
        const newTask = ref('');
        const tasks = ref([]);
        let timer = null;
        const time = ref(0);
        const percentage = ref(0);
        const addTask = () => {
            tasks.value.push({ id: tasks.value.length, name: newTask.value });
            newTask.value = '';
        };
        const startTimer = () => {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                time.value++;
                percentage.value = (time.value / 25) * 100;
                if (time.value >= 25) {
                    clearInterval(timer);
                    timer = null;
                }
            }, 600);
        };
        const resetTimer = () => {
            if (timer) clearInterval(timer);
            time.value = 0;
            percentage.value = 0;
        };
        return { newTask, tasks, addTask, startTimer, resetTimer, percentage };
    },
};
</script>
  
<style>
h1 {
    text-align: center;
    margin-top: 20px;
}

h2 {
    margin-top: 20px;
}
</style>
  