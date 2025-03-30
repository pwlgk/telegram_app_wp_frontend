<template>
    <div class="category-tree-node">
      <button
        class="category-button"
        :class="{ active: selectedCategoryId === category.id }"
        :style="{ paddingLeft: `${level * 15}px` }"
        @click="emitSelectCategory"
      >
        {{ category.name }}
        <span v-if="hasSubcategories" @click.stop="toggleExpand" class="expand-icon">
          {{ isExpanded ? '−' : '+' }}
        </span>
      </button>
  
      <div v-if="hasSubcategories && isExpanded" class="subcategory-list">
        <CategoryTreeNode
          v-for="subCategory in subcategories"
          :key="subCategory.id"
          :category="subCategory"
          :selected-category-id="selectedCategoryId"
          :level="level + 1" 
          @select-category="forwardSelectCategory" 
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, defineAsyncComponent } from 'vue'; // Добавили defineAsyncComponent
  import { useFilterStore } from '@/store/filters';
  
  // Рекурсивная ссылка на самого себя
  const CategoryTreeNode = defineAsyncComponent(() => import('./CategoryTreeNode.vue'));
  
  const props = defineProps({
    category: { type: Object, required: true },
    selectedCategoryId: { type: [Number, String, null], default: null },
    level: { type: Number, default: 0 }, // Уровень вложенности для отступов
  });
  
  const emit = defineEmits(['select-category']);
  
  const filterStore = useFilterStore();
  const isExpanded = ref(false); // Состояние раскрытия узла
  
  // Получаем подкатегории из стора
  const subcategories = computed(() => {
    return filterStore.getSubcategories(props.category.id);
  });
  
  const hasSubcategories = computed(() => subcategories.value.length > 0);
  
  // Переключаем раскрытие
  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
  };
  
  // Генерируем событие выбора этой категории
  const emitSelectCategory = () => {
    emit('select-category', props.category.id);
  };
  
  // Пробрасываем событие выбора от дочернего узла
  const forwardSelectCategory = (categoryId) => {
    emit('select-category', categoryId);
  };
  
  </script>
  
  <style scoped>
  .category-tree-node {
    /* Стили для обертки узла, если нужны */
  }
  
  .category-button {
    display: flex; /* Для позиционирования иконки */
    justify-content: space-between;
    align-items: center;
    background: none; border: none; padding: 10px 1.5rem 10px 0; /* Уменьшаем правый padding */
    text-align: left; width: 100%; color: var(--color-text); font-size: 1em;
    font-weight: 400; cursor: pointer; transition: color 0.2s, background-color 0.2s;
  }
  .category-button:hover { background-color: var(--color-background-secondary); }
  .category-button.active { color: var(--color-accent); font-weight: 600; }
  
  .expand-icon {
    margin-left: 10px;
    color: var(--color-text-muted);
    font-size: 1.1em;
    padding: 0 5px; /* Увеличить область клика */
    cursor: pointer;
    user-select: none; /* Запретить выделение +/- */
  }
  .expand-icon:hover {
      color: var(--color-text);
  }
  
 
  </style>