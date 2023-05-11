<template>
    <el-container>
      <el-header>
        <el-radio-group v-model="reportType">
          <el-radio-button label="daily">日报</el-radio-button>
          <el-radio-button label="weekly">周报</el-radio-button>
        </el-radio-group>
      </el-header>
  
      <el-main>
        <el-form ref="form" :model="form" label-width="120px">
          <el-form-item label="日期">
            <el-date-picker v-model="form.date" type="date" placeholder="选择日期"></el-date-picker>
          </el-form-item>
          <el-form-item label="任务描述">
            <el-input type="textarea" v-model="form.description"></el-input>
          </el-form-item>
          <el-form-item label="完成状态">
            <el-input v-model="form.status"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">提交</el-button>
          </el-form-item>
        </el-form>
  
        <el-table :data="reports" style="width: 100%">
          <el-table-column prop="date" label="日期"></el-table-column>
          <el-table-column prop="description" label="任务描述"></el-table-column>
          <el-table-column prop="status" label="完成状态"></el-table-column>
        </el-table>
      </el-main>
    </el-container>
  </template>
  
  <script>
  import { ref } from 'vue'
  
  export default {
    setup() {
      const reportType = ref('daily')
      const form = ref({
        date: '',
        description: '',
        status: ''
      })
      const reports = ref([])
  
      const onSubmit = () => {
        reports.value.push({ ...form.value })
        form.value = { date: new Date(), description: '', status: '' }
      }
  
      return {
        reportType,
        form,
        reports,
        onSubmit
      }
    }
  }
  </script>
  