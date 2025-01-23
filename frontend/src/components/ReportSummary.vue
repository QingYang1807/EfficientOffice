<template>
  <el-container class="report-container">
    <el-header class="report-header">
      <div class="report-header-left">
        <el-radio-group v-model="reportType" @change="handleReportTypeChange">
          <el-radio-button label="daily">日报</el-radio-button>
          <el-radio-button label="weekly">周报</el-radio-button>
          <el-radio-button label="monthly">月报</el-radio-button>
          <el-radio-button label="quarterly">季报</el-radio-button>
          <el-radio-button label="annual">年报</el-radio-button>
        </el-radio-group>
      </div>
      <div class="report-header-right">
        <el-date-picker
          v-model="reportDate"
          type="date"
          :placeholder="datePlaceholder"
          :picker-options="datePickerOptions"
          @change="handleDateChange"
          class="report-date-picker"
        />
        <div class="report-date-info">
          {{ formattedDateInfo }}
        </div>
      </div>
    </el-header>

    <el-main class="report-main">
      <el-card class="report-card">
        <el-form ref="form" :model="form" label-width="120px">
          <el-form-item label="任务描述">
            <el-input type="textarea" v-model="form.description" placeholder="请输入任务描述"></el-input>
          </el-form-item>
          <el-form-item label="完成状态">
            <el-select v-model="form.status" placeholder="请选择完成状态">
              <el-option label="完成" value="completed"></el-option>
              <el-option label="进行中" value="inprogress"></el-option>
              <el-option label="未开始" value="pending"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">提交</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="report-input-card">
        <el-form :inline="true" :model="reportInput" class="report-input-form">
          <el-form-item label="完成">
            <el-input v-model="reportInput.done" placeholder="完成"></el-input>
          </el-form-item>
          <el-form-item label="进行中">
            <el-input v-model="reportInput.doing" placeholder="进行中"></el-input>
          </el-form-item>
          <el-form-item label="待办">
            <el-input v-model="reportInput.todo" placeholder="待办"></el-input>
          </el-form-item>
        </el-form>
      </el-card>

      <el-table :data="reports" style="width: 100%" class="report-table">
        <el-table-column prop="date" label="日期" width="180"></el-table-column>
        <el-table-column prop="description" label="任务描述"></el-table-column>
        <el-table-column prop="status" label="完成状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'completed'
                  ? 'success'
                  : row.status === 'inprogress'
                  ? 'warning'
                  : 'info'
              "
              size="small"
            >
              {{
                row.status === 'completed'
                  ? '完成'
                  : row.status === 'inprogress'
                  ? '进行中'
                  : '未开始'
              }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>
</template>

<script>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(weekOfYear);
dayjs.extend(quarterOfYear);
dayjs.locale('zh-cn');

export default {
  setup() {
    const reportType = ref('daily');
    const reportDate = ref(new Date());
    const form = ref({
      description: '',
      status: '',
    });
    const reports = ref([]);
    const reportInput = ref({
      done: '',
      doing: '',
      todo: '',
    });

    const datePlaceholder = computed(() => {
      if (reportType.value === 'daily') return '选择日期';
      if (reportType.value === 'weekly') return '选择周';
      if (reportType.value === 'monthly') return '选择月份';
      if (reportType.value === 'quarterly') return '选择季度';
      return '选择年份';
    });

    const datePickerOptions = computed(() => {
      if (reportType.value === 'weekly') {
        return {
          firstDayOfWeek: 1,
          format: 'yyyy 第W周',
          pickerType: 'week',
        };
      }
      if (reportType.value === 'monthly') {
        return {
          format: 'yyyy-MM',
          pickerType: 'month',
        };
      }
      if (reportType.value === 'quarterly') {
        return {
          format: 'yyyy 第Q季度',
          pickerType: 'quarter',
        };
      }
      if (reportType.value === 'annual') {
        return {
          format: 'yyyy',
          pickerType: 'year',
        };
      }
      return {};
    });

    const formattedDateInfo = computed(() => {
      const date = dayjs(reportDate.value);
      const weekNumber = date.week();
      const month = date.format('MM');
      const quarter = date.quarter();
      const year = date.format('YYYY');
      const day = date.format('YYYY-MM-DD');

      return `${day}，第${month}月，第${weekNumber}周，第${quarter}季度，${year}年`;
    });

    const handleReportTypeChange = () => {
      reportDate.value = new Date();
    };

    const handleDateChange = (date) => {
      if (date) {
        form.value.date = date;
      }
    };

    const onSubmit = () => {
      reports.value.push({ ...form.value, date: reportDate.value });
      form.value = { description: '', status: '' };
    };

    return {
      reportType,
      reportDate,
      form,
      reports,
      reportInput,
      datePlaceholder,
      datePickerOptions,
      formattedDateInfo,
      handleReportTypeChange,
      handleDateChange,
      onSubmit,
    };
  },
};
</script>

<style scoped>
.report-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.report-header-left {
  flex: 1;
}

.report-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-date-picker {
  width: 200px;
}

.report-date-info {
  font-size: 1rem;
  color: #666;
}

.report-main {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.report-card {
  width: 100%;
}

.report-table {
  width: 100%;
}

.report-input-card {
  width: 100%;
}

.report-input-form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.report-input-form .el-form-item {
  margin-bottom: 0;
}
</style>
  