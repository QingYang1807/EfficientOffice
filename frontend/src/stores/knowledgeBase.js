import { reactive } from 'vue';

const state = reactive({
  stats: {
    totalFiles: 0,
    totalCorpus: 0,
    totalRag: 0,
  },
});

export const useKnowledgeBaseStore = () => {
  return {
    state,
    updateStats(newStats) {
      state.stats = { ...state.stats, ...newStats };
    },
  };
};
