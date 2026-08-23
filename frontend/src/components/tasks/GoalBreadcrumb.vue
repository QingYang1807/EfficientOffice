<template>
  <nav v-if="path.length" class="goal-breadcrumb" aria-label="所属目标">
    <template v-for="(goal, index) in path" :key="goal.id">
      <span v-if="index" class="separator" aria-hidden="true">{{ ' / ' }}</span>
      <button
        type="button"
        class="goal-segment"
        :data-testid="`goal-segment-${goal.id}`"
        @click="$emit('navigate', String(goal.id))"
      >{{ goal.title }}</button>
    </template>
  </nav>
  <span v-else class="unassigned">未归属目标</span>
</template>

<script setup>
defineProps({ path: { type: Array, default: () => [] } })
defineEmits(['navigate'])
</script>

<style scoped>
.goal-breadcrumb { display: flex; min-width: 0; align-items: center; gap: 5px; white-space: nowrap; }
.goal-segment { min-width: 0; overflow: hidden; border: 0; padding: 0; background: transparent; color: #2564cf; cursor: pointer; font: inherit; text-overflow: ellipsis; }
.goal-segment:hover { text-decoration: underline; }
.separator, .unassigned { color: #94a3b8; }
</style>
