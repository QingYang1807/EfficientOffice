<template>
    <div class="workflow-container">
      <div class="workflow-header">
        <div class="flex items-center">
          <a href="#" class="back-button mr-4">
            <i class="fas fa-arrow-left"></i>
          </a>
          <div class="workflow-title-container flex items-center">
            <h1 v-if="!isEditingTitle" class="text-lg font-medium">{{ workflowTitle }}</h1>
            <input 
              v-else 
              type="text" 
              class="title-input border border-gray-300 px-3 py-1 rounded-md text-lg font-medium" 
              v-model="editedTitle" 
              @blur="saveTitle" 
              @keyup.enter="saveTitle"
              ref="titleInput"
            >
            <button @click="editTitle" class="edit-title-button" title="修改工作流名称">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
          </div>
          <span class="status-badge ml-4">草稿</span>
        </div>
        <div class="flex items-center">
          <span class="text-gray-600 mr-4">更新于: {{ lastUpdated }}</span>
          <el-button type="primary" @click="publishWorkflow">发布</el-button>
        </div>
      </div>
  
      <div class="main-content">
        <!-- 左侧工具面板 -->
        <div class="left-panel">
          <!-- 搜索栏 -->
          <div class="search-container">
            <div class="relative">
              <input type="text" v-model="searchTerm" placeholder="搜索工具名称或描述" class="search-input">
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>
  
          <!-- 搜索结果 -->
          <div v-if="searchTerm" class="search-results active">
            <div class="search-results-header">
              <span class="search-results-count">找到 <span>{{ filteredTools.length }}</span> 个工具</span>
              <button class="clear-search" @click="clearSearch">
                <i class="fas fa-times"></i>
                <span>清除搜索</span>
              </button>
            </div>
            <div class="results-container">
              <div v-for="tool in filteredTools" :key="tool.type" class="tool-card" draggable="true" @dragstart="onDragStart($event, tool)">
                <div class="tool-card-header">
                  <div class="tool-card-icon" :class="tool.iconBg">
                    <i class="fas" :class="tool.icon"></i>
                  </div>
                  <span class="font-medium">{{ tool.name }}</span>
                  <span class="tool-category-label">{{ getCategoryDisplayName(tool.category) }}</span>
                </div>
                <p class="tool-card-description">{{ tool.description }}</p>
              </div>
            </div>
          </div>
  
          <!-- 工具分类标签 -->
          <div v-else class="tabs-container">
            <div class="tabs-wrapper">
              <button v-for="category in categories" :key="category.value" 
                      :class="activeCategory === category.value ? 'tab-active' : 'tab-inactive'"
                      @click="setActiveCategory(category.value)">
                {{ category.label }}
              </button>
            </div>
          </div>
          
          <!-- 工具列表 -->
          <div v-if="!searchTerm" class="tools-container">
            <div v-if="toolsByCategory[activeCategory].length === 0" class="tool-category-empty">
              <i class="fas fa-inbox text-4xl mb-4 text-gray-400"></i>
              <p class="text-center text-gray-600 font-medium">当前分类暂无可用工具</p>
              <p class="text-sm mt-2 text-gray-500">请选择其他分类或稍后再试</p>
            </div>
            
            <template v-else>
              <div v-for="group in groupedTools" :key="group.title" class="tool-group">
                <h3 class="text-sm font-medium text-gray-700 mb-3">{{ group.title }}</h3>
                <div v-for="tool in group.tools" :key="tool.type" class="tool-card" draggable="true" @dragstart="onDragStart($event, tool)">
                  <div class="tool-card-header">
                    <div class="tool-card-icon" :class="tool.iconBg">
                      <i class="fas" :class="tool.icon"></i>
                    </div>
                    <span class="font-medium">{{ tool.name }}</span>
                  </div>
                  <p class="tool-card-description">{{ tool.description }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>
  
        <!-- 右侧画布区域 -->
        <div class="right-panel">
          <div class="canvas-container" ref="reactflowWrapper">
            <!-- 画布控制按钮 -->
            <div class="canvas-controls">
              <button @click="zoomIn" class="control-button">
                <i class="fas fa-search-plus"></i>
              </button>
              <button @click="zoomOut" class="control-button">
                <i class="fas fa-search-minus"></i>
              </button>
              <button @click="fitView" class="control-button">
                <i class="fas fa-expand"></i>
              </button>
              <div class="zoom-display">
                {{ Math.round(zoom * 100) }}%
              </div>
            </div>
            
            <!-- Vue Flow 组件 -->
            <VueFlow
              :nodes="nodes"
              :edges="edges"
              :default-viewport="{ x: 0, y: 0, zoom: 1 }"
              :default-zoom="1"
              :min-zoom="0.2"
              :max-zoom="4"
              :snap-to-grid="true"
              :snap-grid="[15, 15]"
              :elements-selectable="true"
              :delete-key-code="'Delete'"
              :multi-selection-key-code="'Control'"
              :edges-updatable="true"
              :nodes-draggable="true"
              :nodes-connectable="true"
              :select-nodes-on-drag="false"
              :pan-on-drag="[0, 1, 2]"
              :elevate-edges-on-select="true"
              @node-drag-stop="onNodeDragStop"
              @pane-click="onPaneClick"
              @drop="onDrop"
              @dragover="onDragOver"
              @node-click="onNodeClick"
              @connection-start="(event) => console.log('Connection start:', event)"
              @connection-end="(event) => console.log('Connection end:', event)"
              @update:viewport="onViewportChange"
              @connect="handleConnect"
              class="vue-flow-container"
            >
              <template #node-workflow-node="nodeProps">
                <WorkflowNode v-bind="nodeProps" />
              </template>
              <template #edge-default="edgeProps">
                <DefaultEdge v-bind="edgeProps" />
              </template>
              <Controls />
              <MiniMap />
              <Background pattern="dots" :size="1" />
            </VueFlow>
          </div>
        </div>
      </div>
  
      <!-- 属性面板 -->
      <div v-if="showPropertyPanel" class="property-panel">
        <div class="property-panel-header">
          <h3 class="font-medium">节点配置</h3>
          <button @click="closePropertyPanel" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- 配置步骤导航 -->
        <div class="property-panel-steps">
          <div v-for="step in configSteps" :key="step.id"
               :class="['step-item', { active: currentStep === step.id }]"
               @click="switchStep(step.id)">
            <i class="fas" :class="step.icon"></i>
            <div>{{ step.label }}</div>
          </div>
        </div>
  
        <!-- 基础信息配置 -->
        <div v-if="currentStep === 'basic'" class="property-panel-content">
          <div class="param-group">
            <div class="param-group-title">
              <span>节点名称</span>
              <span class="required-badge">必填</span>
            </div>
            <input type="text" v-model="selectedNode.data.label" class="param-input">
            <p class="help-text">为节点起一个描述性的名称，方便识别</p>
          </div>
          
          <div class="param-group">
            <div class="param-group-title">
              <span>节点描述</span>
              <span class="optional-badge">选填</span>
            </div>
            <textarea v-model="selectedNode.data.description" class="param-textarea"></textarea>
            <p class="help-text">添加节点的用途说明，帮助其他人理解</p>
          </div>
        </div>
  
        <!-- 参数配置 -->
        <div v-if="currentStep === 'params'" class="property-panel-content">
          <div class="param-group">
            <div class="param-group-title">
              <span>输入配置</span>
              <span class="required-badge">必填</span>
            </div>
            <div class="input-params">
              <input type="text" v-model="selectedNode.data.input" class="param-input">
            </div>
          </div>
          
          <div class="param-group">
            <div class="param-group-title">
              <span>输出配置</span>
              <span class="required-badge">必填</span>
            </div>
            <div class="output-params">
              <input type="text" v-model="selectedNode.data.output" class="param-input">
            </div>
          </div>
        </div>
  
        <!-- 高级选项 -->
        <div v-if="currentStep === 'advanced'" class="property-panel-content">
          <div class="param-group">
            <div class="param-group-title">
              <span>执行配置</span>
              <span class="optional-badge">选填</span>
            </div>
            <div class="mb-3">
              <label class="checkbox-label">
                <input type="checkbox" v-model="selectedNode.data.cache">
                <span>启用结果缓存</span>
              </label>
              <p class="help-text">缓存节点执行结果，避免重复计算</p>
            </div>
            <div class="mb-3">
              <label class="checkbox-label">
                <input type="checkbox" v-model="selectedNode.data.retry">
                <span>失败自动重试</span>
              </label>
              <p class="help-text">节点执行失败时自动重试</p>
            </div>
          </div>
        </div>
  
        <!-- 操作按钮 -->
        <div class="property-panel-footer">
          <button v-if="currentStepIndex > 0" @click="prevStep" class="prev-button">
            上一步
          </button>
          <button @click="nextStep" class="next-button">
            {{ isLastStep ? '完成' : '下一步' }}
          </button>
        </div>
      </div>
  
      <!-- 节点操作菜单 -->
      <div v-if="showNodeMenu" class="node-context-menu" :style="nodeMenuPosition">
        <div class="menu-item" @click="duplicateNode">
          <i class="fas fa-copy"></i>
          <span>复制节点</span>
        </div>
        <div class="menu-item" @click="deleteNode">
          <i class="fas fa-trash-alt"></i>
          <span>删除节点</span>
        </div>
        <div class="menu-item" @click="configureNode">
          <i class="fas fa-cog"></i>
          <span>配置节点</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
  import { 
    VueFlow, 
    Background, 
    Controls, 
    MiniMap, 
    useVueFlow,
    DefaultEdge,
    ConnectionMode,
    Position,
    Handle,
    NodeTypes,
    EdgeTypes
  } from '@vue-flow/core';
  import '@vue-flow/core/dist/style.css';
  import '@vue-flow/core/dist/theme-default.css';
  import WorkflowNode from '../components/workflow/WorkflowNode.vue';
  
  export default {
    name: 'WorkflowView',
    components: {
      VueFlow,
      Background,
      Controls,
      MiniMap,
      DefaultEdge,
      WorkflowNode
    },
    setup() {
      const reactflowWrapper = ref(null);
      const { 
        nodes,
        edges,
        addNodes,
        addEdges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        zoomIn: zoomInFlow,
        zoomOut: zoomOutFlow,
        fitView: fitViewFlow,
        getNode,
        setEdges,
        setNodes,
        zoom,
        findNode
      } = useVueFlow();
      
      // 工作流标题
      const workflowTitle = ref('工作流');
      const isEditingTitle = ref(false);
      const editedTitle = ref('');
      const lastUpdated = ref('2025年4月1日13:24:51');
      
      // 节点和边
      const elements = ref([]);
      const nodeId = ref(1);
      
      // 工具分类
      const categories = [
        { value: 'input', label: '输入' },
        { value: 'collect', label: '采集' },
        { value: 'process', label: '处理' },
        { value: 'transform', label: '转换' },
        { value: 'analyze', label: '分析' },
        { value: 'output', label: '输出' }
      ];
      const activeCategory = ref('input');
      
      // 搜索
      const searchTerm = ref('');
      
      // 属性面板
      const showPropertyPanel = ref(false);
      const selectedNode = reactive({
        id: '',
        data: {
          label: '',
          description: '',
          input: '',
          output: '',
          cache: false,
          retry: false
        }
      });
      const configSteps = [
        { id: 'basic', label: '基础信息', icon: 'fa-info-circle' },
        { id: 'params', label: '参数配置', icon: 'fa-cog' },
        { id: 'advanced', label: '高级选项', icon: 'fa-sliders-h' }
      ];
      const currentStep = ref('basic');
      const currentStepIndex = computed(() => {
        return configSteps.findIndex(step => step.id === currentStep.value);
      });
      const isLastStep = computed(() => {
        return currentStepIndex.value === configSteps.length - 1;
      });
      
      // 工具数据
      const tools = [
        // 输入类工具
        { 
          type: 'mysql-input', 
          name: 'MySQL数据库', 
          category: 'input',
          group: '结构化数据源',
          icon: 'fa-database',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-500',
          description: '连接MySQL数据库，支持表格数据读取和SQL查询，可配置连接参数和查询条件。'
        },
        { 
          type: 'postgres-input', 
          name: 'PostgreSQL数据库', 
          category: 'input',
          group: '结构化数据源',
          icon: 'fa-database',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-500',
          description: '连接PostgreSQL数据库，支持高级查询和地理信息数据处理，可配置schema和表过滤。'
        },
        { 
          type: 'file-input', 
          name: '文本文件', 
          category: 'input',
          group: '非结构化数据源',
          icon: 'fa-file-alt',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-500',
          description: '读取TXT、CSV、JSON等格式文本文件，支持多种编码格式和分隔符配置。'
        },
        { 
          type: 'image-input', 
          name: '图像文件', 
          category: 'input',
          group: '非结构化数据源',
          icon: 'fa-image',
          iconBg: 'bg-pink-100',
          iconColor: 'text-pink-500',
          description: '批量导入JPG、PNG等格式图片，支持图片预处理和元数据提取。'
        },
        { 
          type: 'excel-input', 
          name: 'Excel文件', 
          category: 'input',
          group: '本地导入',
          icon: 'fa-file-excel',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-500',
          description: '导入Excel文件数据，支持多sheet读取，可配置数据范围和格式转换。'
        },
        { 
          type: 'folder-input', 
          name: '本地文件夹', 
          category: 'input',
          group: '本地导入',
          icon: 'fa-folder-open',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-500',
          description: '批量导入本地文件夹中的文件，支持文件过滤和递归遍历。'
        },
        
        // 采集类工具
        { 
          type: 'rest-api', 
          name: 'REST API', 
          category: 'collect',
          group: 'API采集',
          icon: 'fa-cloud',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-500',
          description: '支持GET、POST等请求方式，可配置请求头、参数和认证信息。'
        },
        { 
          type: 'graphql-api', 
          name: 'GraphQL API', 
          category: 'collect',
          group: 'API采集',
          icon: 'fa-project-diagram',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-500',
          description: '灵活查询GraphQL接口，支持查询语句构建和结果过滤。'
        },
        
        // 更多工具可以继续添加...
      ];
      
      // 按分类和分组整理工具
      const toolsByCategory = computed(() => {
        const result = {};
        categories.forEach(category => {
          result[category.value] = tools.filter(tool => tool.category === category.value);
        });
        return result;
      });
      
      // 当前分类下按分组整理的工具
      const groupedTools = computed(() => {
        const categoryTools = toolsByCategory.value[activeCategory.value];
        const groups = {};
        
        categoryTools.forEach(tool => {
          if (!groups[tool.group]) {
            groups[tool.group] = [];
          }
          groups[tool.group].push(tool);
        });
        
        return Object.keys(groups).map(groupName => ({
          title: groupName,
          tools: groups[groupName]
        }));
      });
      
      // 搜索过滤后的工具
      const filteredTools = computed(() => {
        if (!searchTerm.value) return [];
        
        const term = searchTerm.value.toLowerCase();
        return tools.filter(tool => 
          tool.name.toLowerCase().includes(term) || 
          tool.description.toLowerCase().includes(term)
        );
      });
      
      // 方法
      const setActiveCategory = (category) => {
        activeCategory.value = category;
      };
      
      const clearSearch = () => {
        searchTerm.value = '';
      };
      
      const getCategoryDisplayName = (category) => {
        const found = categories.find(c => c.value === category);
        return found ? found.label : category;
      };
      
      const onDragStart = (event, tool) => {
        event.dataTransfer.setData('application/vueflow', JSON.stringify(tool));
        event.dataTransfer.effectAllowed = 'move';
      };
      
      const onDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      };
      
      const onDrop = (event) => {
        const data = event.dataTransfer.getData('application/vueflow');
        if (!data) return;
        
        try {
          const tool = JSON.parse(data);
          const { left, top } = reactflowWrapper.value.getBoundingClientRect();
          const position = {
            x: event.clientX - left,
            y: event.clientY - top
          };
          
          addNewNode(tool, position);
        } catch (error) {
          console.error('Error adding new node:', error);
        }
      };
      
      const addNewNode = (tool, position) => {
        const id = `node-${nodeId.value}`;
        nodeId.value++;
        
        const newNode = {
          id,
          type: 'workflow-node',
          position,
          data: {
            label: tool.name,
            toolType: tool.type,
            icon: tool.icon,
            iconBg: tool.iconBg,
            iconColor: tool.iconColor,
            description: '',
            input: '',
            output: '',
            cache: false,
            retry: false,
            isConfigured: false,
            createdAt: new Date().toISOString()
          }
        };
        
        addNodes([newNode]);
        
        // 更新最后修改时间
        lastUpdated.value = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      };
      
      const handleConnect = (params) => {
        console.log('Connection created:', params);
        
        const newEdge = {
          id: `e${Date.now()}`,
          source: params.source,
          target: params.target,
          type: 'default',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        };
        
        addEdges([newEdge]);
        
        // 更新最后修改时间
        lastUpdated.value = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      };
      
      const onNodeDragStop = (event, node) => {
        console.log('Node position changed:', node);
      };
      
      const onPaneClick = () => {
        // 关闭属性面板
        showPropertyPanel.value = false;
      };
      
      const onNodeClick = (node, event) => {
        // VueFlow 通常将节点作为第一个参数，事件对象作为第二个参数
        // 如果event存在才调用stopPropagation
        if (event && typeof event.stopPropagation === 'function') {
          event.stopPropagation();
        }
        
        // 打开属性面板并加载节点数据
        selectedNode.id = node.id;
        selectedNode.data = { ...node.data };
        showPropertyPanel.value = true;
        currentStep.value = 'basic';
      };
      
      const closePropertyPanel = () => {
        showPropertyPanel.value = false;
      };
      
      const switchStep = (step) => {
        currentStep.value = step;
      };
      
      const prevStep = () => {
        if (currentStepIndex.value > 0) {
          currentStep.value = configSteps[currentStepIndex.value - 1].id;
        }
      };
      
      const nextStep = () => {
        if (isLastStep.value) {
          saveNodeConfig();
        } else {
          currentStep.value = configSteps[currentStepIndex.value + 1].id;
        }
      };
      
      const saveNodeConfig = () => {
        if (!selectedNode.id) return;
        
        // 更新节点数据
        const node = getNode(selectedNode.id);
        if (node) {
          node.data = {
            ...selectedNode.data,
            isConfigured: !!(selectedNode.data.label && selectedNode.data.input && selectedNode.data.output)
          };
        }
        
        // 关闭属性面板
        showPropertyPanel.value = false;
      };
      
      const onViewportChange = ({ zoom: newZoom }) => {
        zoom.value = newZoom;
      };
      
      const zoomIn = () => {
        zoomInFlow();
      };
      
      const zoomOut = () => {
        zoomOutFlow();
      };
      
      const fitView = () => {
        fitViewFlow();
      };
      
      const titleInput = ref(null);

      const EditTitle = () => {
        editedTitle.value = workflowTitle.value;
        isEditingTitle.value = true;
        // 使用 nextTick 确保 DOM 更新后再聚焦
        nextTick(() => {
          titleInput.value.focus();
        });
      };
      
      const SaveTitle = () => {
        if (editedTitle.value.trim()) {
          workflowTitle.value = editedTitle.value.trim();
          lastUpdated.value = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
        isEditingTitle.value = false;
      };
      
      const PublishWorkflow = () => {
        // 添加基本验证
        const nodes = elements.value.filter(el => el.type === 'node');
        const edges = elements.value.filter(el => el.type === 'edge');
        
        if (nodes.length === 0) {
          alert('工作流至少需要一个节点');
          return;
        }
        
        console.log('发布工作流:', elements.value);
        // 这里可以添加发布工作流的逻辑
      };
      
      // 节点右键菜单
      const showNodeMenu = ref(false);
      const nodeMenuPosition = ref({ top: '0px', left: '0px' });
      const selectedNodeId = ref(null);
      
      const onNodeContextMenu = (event, node) => {
        event.preventDefault();
        selectedNodeId.value = node.id;
        showNodeMenu.value = true;
        nodeMenuPosition.value = {
          top: `${event.clientY}px`,
          left: `${event.clientX}px`
        };
      };
      
      const hideNodeMenu = () => {
        showNodeMenu.value = false;
      };
      
      const duplicateNode = () => {
        const node = getNode(selectedNodeId.value);
        if (node) {
          const newNode = {
            ...node,
            id: `node-${nodeId.value}`,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50
            }
          };
          nodeId.value++;
          addNodes([newNode]);
        }
        hideNodeMenu();
      };
      
      const deleteNode = () => {
        // 这里添加删除节点的逻辑
        hideNodeMenu();
      };
      
      const configureNode = () => {
        const node = getNode(selectedNodeId.value);
        if (node) {
          selectedNode.id = node.id;
          selectedNode.data = { ...node.data };
          showPropertyPanel.value = true;
          currentStep.value = 'basic';
        }
        hideNodeMenu();
      };
      
      onMounted(() => {
        // 点击页面任何地方关闭菜单
        document.addEventListener('click', hideNodeMenu);
      });
      
      // 创建处理节点和边变化的函数
      const handleNodesChange = (changes) => {
        console.log('Nodes changed:', changes);
        // 节点变化的处理逻辑
      };

      const handleEdgesChange = (changes) => {
        console.log('Edges changed:', changes);
        // 边变化的处理逻辑
      };

      // 注册变化处理器
      onNodesChange(handleNodesChange);
      onEdgesChange(handleEdgesChange);
      
      return {
        reactflowWrapper,
        elements,
        workflowTitle,
        isEditingTitle,
        editedTitle,
        lastUpdated,
        categories,
        activeCategory,
        searchTerm,
        tools,
        toolsByCategory,
        groupedTools,
        filteredTools,
        showPropertyPanel,
        selectedNode,
        configSteps,
        currentStep,
        currentStepIndex,
        isLastStep,
        zoom,
        titleInput,
        nodes,
        edges,
        addNodes,
        addEdges,
        handleConnect,
        setActiveCategory,
        clearSearch,
        getCategoryDisplayName,
        onDragStart,
        onDragOver,
        onDrop,
        onNodeDragStop,
        onPaneClick,
        onNodeClick,
        closePropertyPanel,
        switchStep,
        prevStep,
        nextStep,
        saveNodeConfig,
        onViewportChange,
        zoomIn,
        zoomOut,
        fitView,
        editTitle: EditTitle,
        saveTitle: SaveTitle,
        publishWorkflow: PublishWorkflow,
        showNodeMenu,
        nodeMenuPosition,
        onNodeContextMenu,
        duplicateNode,
        deleteNode,
        configureNode,
        onNodesChange,
        onEdgesChange
      };
    }
  };
  </script>
  
  <style scoped>
  .workflow-container {
    width: 100%;
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    background-color: #f8fafc;
  }
  
  .workflow-header {
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eaeef2;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .back-button {
    color: #64748b;
    font-size: 18px;
    transition: color 0.2s;
  }
  
  .back-button:hover {
    color: #0f172a;
  }
  
  .workflow-title-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .workflow-title-container h1 {
    font-size: 18px;
    font-weight: 600;
    color: #1a202c;
    transition: all 0.2s ease;
    line-height: 1;
    margin: 0;
    padding: 0;
  }
  
  .workflow-title-container button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    color: #94a3b8;
    margin-left: 4px;
  }
  
  .workflow-title-container button:hover {
    background-color: #f1f5f9;
    color: #475569;
  }
  
  .title-input {
    min-width: 240px;
    background-color: #fff;
    font-size: 18px;
    font-weight: 600;
    color: #1a202c;
    border: 1px solid #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  .status-badge {
    background-color: #ecfdf5;
    color: #059669;
    border-radius: 9999px;
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  
  .status-badge::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  
  .left-panel {
    width: 320px;
    background-color: white;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid #eaeef2;
  }
  
  .search-container {
    padding: 16px;
    border-bottom: 1px solid #eaeef2;
  }
  
  .search-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px 8px 36px;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    outline: none;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    pointer-events: none;
  }
  
  .search-results {
    padding: 16px;
    display: none;
    overflow-y: auto;
    flex: 1;
  }
  
  .search-results.active {
    display: block;
  }
  
  .search-results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .search-results-count {
    font-size: 14px;
    color: #6b7280;
  }
  
  .clear-search {
    font-size: 14px;
    color: #3b82f6;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .tabs-container {
    border-bottom: 1px solid #eaeef2;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none; /* Firefox */
  }
  
  .tabs-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }
  
  .tabs-wrapper {
    display: flex;
    padding: 0 8px;
  }
  
  .tab-active {
    background-color: #3b82f6;
    color: white;
    font-weight: 500;
    padding: 10px 16px;
    font-size: 14px;
    min-width: 64px;
    position: relative;
    border-radius: 4px 4px 0 0;
    box-shadow: 0 -2px 5px rgba(59, 130, 246, 0.1);
  }
  
  .tab-inactive {
    background-color: transparent;
    color: #4b5563;
    padding: 10px 16px;
    font-size: 14px;
    min-width: 64px;
    transition: all 0.2s;
    border-radius: 4px 4px 0 0;
  }
  
  .tab-inactive:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  
  .tools-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  
  .tool-group {
    margin-bottom: 24px;
  }
  
  .tool-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    background: white;
    transition: all 0.25s ease;
    cursor: move;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 105px;
  }
  
  .tool-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
  }
  
  .tool-card:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .tool-card::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    background-color: #3b82f6;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .tool-card:hover::after {
    opacity: 1;
  }
  
  .tool-card-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .tool-card-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    margin-right: 12px;
    font-size: 16px;
    flex-shrink: 0;
  }
  
  .tool-card-description {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
    margin: 0;
  }
  
  .tool-category-label {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-left: 0.5rem;
    background-color: #f3f4f6;
    color: #4b5563;
  }
  
  .tool-category-empty {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    padding: 2rem;
  }
  
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f1f5f9;
    position: relative;
  }
  
  .canvas-container {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .canvas-controls {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    gap: 8px;
    z-index: 10;
    background-color: white;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .control-button {
    background-color: white;
    border-radius: 6px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.2s ease;
  }
  
  .control-button:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
  
  .zoom-display {
    background-color: #f8fafc;
    border-radius: 6px;
    padding: 0 12px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    font-size: 14px;
    font-weight: 500;
  }
  
  .property-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100%;
    width: 360px;
    background-color: white;
    box-shadow: -3px 0 15px rgba(0, 0, 0, 0.1);
    z-index: 50;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease forwards;
    border-left: 1px solid #eaeef2;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  .property-panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eaeef2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8fafc;
  }
  
  .property-panel-header h3 {
    font-size: 16px;
    color: #1e293b;
  }
  
  .close-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background-color: #f1f5f9;
    color: #1e293b;
  }
  
  .property-panel-steps {
    display: flex;
    border-bottom: 1px solid #eaeef2;
    padding: 8px 16px;
    background-color: #f8fafc;
  }
  
  .step-item {
    flex: 1;
    text-align: center;
    padding: 12px 8px;
    cursor: pointer;
    position: relative;
    color: #64748b;
    transition: all 0.2s ease;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  
  .step-item i {
    font-size: 16px;
  }
  
  .step-item div {
    font-size: 13px;
  }
  
  .step-item:hover {
    color: #334155;
    background-color: #f1f5f9;
  }
  
  .step-item.active {
    color: #3b82f6;
    font-weight: 500;
    background-color: rgba(59, 130, 246, 0.08);
  }
  
  .property-panel-content {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
  }
  
  .param-group {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eaeef2;
  }
  
  .param-group:last-child {
    border-bottom: none;
  }
  
  .param-group-title {
    font-weight: 500;
    color: #334155;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .required-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: #fee2e2;
    color: #dc2626;
  }
  
  .optional-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: #f1f5f9;
    color: #64748b;
  }
  
  .param-input {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .param-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    outline: none;
  }
  
  .property-panel-footer {
    padding: 16px 20px;
    border-top: 1px solid #eaeef2;
    display: flex;
    gap: 12px;
    background-color: #f8fafc;
  }
  
  .prev-button {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: white;
    color: #475569;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .prev-button:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
  }
  
  .next-button {
    flex: 1;
    padding: 10px 16px;
    border-radius: 6px;
    background-color: #3b82f6;
    color: white;
    transition: all 0.2s ease;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }
  
  .next-button:hover {
    background-color: #2563eb;
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.4);
  }
  
  .help-text {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .param-textarea {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    min-height: 80px;
    resize: vertical;
  }
  
  .input-params {
    margin-bottom: 24px;
  }
  
  .output-params {
    margin-bottom: 24px;
  }
  
  .title-edit-button:hover {
    background-color: #e5e7eb;
    color: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 2px 3px rgba(0,0,0,0.1);
  }
  
  .workflow-title-container:hover .title-edit-button {
    opacity: 1;
  }
  
  .workflow-title-container h1:after {
    content: '';
    position: absolute;
    width: 0;
    height: 1px;
    bottom: -2px;
    left: 0;
    background-color: #d1d5db;
    transition: width 0.2s ease;
  }
  
  .workflow-title-container:hover h1:after {
    width: 100%;
  }
  
  .node-context-menu {
    position: fixed;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    z-index: 100;
    min-width: 180px;
    animation: fadeIn 0.15s ease;
    border: 1px solid #eaeef2;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .menu-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .menu-item:hover {
    background-color: #f8fafc;
    color: #1e293b;
  }
  
  .menu-item i {
    width: 16px;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .left-panel {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      z-index: 20;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .left-panel.open {
      transform: translateX(0);
    }
    
    .toggle-panel-button {
      position: absolute;
      top: 50%;
      right: -16px;
      width: 32px;
      height: 48px;
      background-color: white;
      border-radius: 0 8px 8px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      box-shadow: 3px 0 8px rgba(0, 0, 0, 0.1);
      z-index: 5;
      transform: translateY(-50%);
    }
  }
  
  /* 添加这段来移除按钮的黑色边框 */
  button {
    outline: none;
    border: none;
  }
  
  button:focus {
    outline: none;
  }
  
  /* 针对 Element UI 按钮的特殊处理 */
  .el-button {
    border: 1px solid transparent;
  }
  
  .el-button:focus, .el-button:active {
    outline: none !important;
    box-shadow: none !important;
  }
  
  /* 编辑按钮样式 */
  .edit-title-button {
    background: transparent;
    color: #64748b; /* 灰色铅笔图标 */
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    margin-left: 4px;
    padding: 0;
  }
  
  .edit-title-button:hover {
    background-color: #f1f5f9;
    color: #475569;
  }
  </style>