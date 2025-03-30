<template>
  <transition name="slide-fade">
    <div
      v-if="isOpen"
      class="filter-sidebar-overlay"
      @click.self="closeSidebar"
    >
      <div class="filter-sidebar">
        <div class="sidebar-header">
          <h2>Фильтры</h2>
          <button @click="closeSidebar" class="close-btn">×</button>
        </div>

        <div class="sidebar-content">
          <div class="filter-group">
            <h3>Категории</h3>
            <div v-if="filterStore.isLoadingCategories" class="loading-small">
              Загрузка...
            </div>
            <div v-else>
              <button
                class="category-button top-level"
                :class="{ active: filterStore.selectedCategoryId === null }"
                @click="selectCategory(null)"
              >
                Все товары
              </button>
              <CategoryTreeNode
                v-for="category in filterStore.topLevelCategories"
                :key="category.id"
                :category="category"
                :selected-category-id="filterStore.selectedCategoryId"
                @select-category="selectCategory"
              />
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <button @click="reset" class="reset-btn">Сбросить</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { onMounted } from "vue";
import { useFilterStore } from "@/store/filters";
// Импортируем компонент для узла дерева (создадим ниже)
import CategoryTreeNode from "./CategoryTreeNode.vue";

const props = defineProps({
  isOpen: { type: Boolean, required: true },
});
const emit = defineEmits(["close"]);

const filterStore = useFilterStore();

const closeSidebar = () => {
  emit("close");
};

// Загружаем категории при монтировании сайдбара
onMounted(() => {
  filterStore.loadAllCategories();
});

// Выбор категории (вызывается из дочерних компонентов)
const selectCategory = (categoryId) => {
  filterStore.setCategory(categoryId);
  closeSidebar();
};

// Сброс
const reset = () => {
  filterStore.resetFilters();
  closeSidebar();
};
</script>

<style scoped>
.filter-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4); /* Полупрозрачный фон */
  z-index: 1000;
  display: flex; /* Для позиционирования сайдбара */
  justify-content: flex-end; /* Сайдбар справа */
}

.filter-sidebar {
  width: 85%; /* Ширина сайдбара */
  max-width: 350px; /* Максимальная ширина */
  height: 100%;
  background-color: var(--color-background);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0; /* Не сжимать шапку */
}
.sidebar-header h2 {
  font-size: 1.3em;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2em;
  color: var(--color-text-muted);
  padding: 0 5px;
  line-height: 1;
  cursor: pointer;
}
.close-btn:hover {
  color: var(--color-text);
}

.sidebar-content {
  padding: 1rem 0 1rem 1.5rem; /* Уменьшаем горизонтальный padding справа */
  overflow-y: auto;
  flex-grow: 1;
}
.filter-group {
  margin-bottom: 1.5rem;
}
.filter-group h3 {
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 0.8rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  margin-right: 1.5rem; /* Отступ справа для заголовка */
}
.loading-small {
  margin-right: 1.5rem; /* Отступ справа для загрузки */
}

/* Общая кнопка категории (для "Все товары") */
.category-button {
  display: block;
  background: none;
  border: none;
  padding: 10px 1.5rem 10px 0; /* Отступ справа */
  text-align: left;
  width: 100%;
  color: var(--color-text);
  font-size: 1em;
  font-weight: 400;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
  border-radius: 0; /* Убираем скругление по умолчанию */
}
.category-button.top-level {
  padding-left: 0; /* Убираем левый отступ для верхнего уровня */
}
.category-button:hover {
  background-color: var(--color-background-secondary);
}
.category-button.active {
  color: var(--color-accent);
  font-weight: 600;
}
.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end; /* Кнопку сброса вправо */
}

.reset-btn {
  background-color: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-medium);
  padding: 8px 15px;
}
.reset-btn:hover {
  background-color: var(--color-background-secondary);
  color: var(--color-text);
}

/* Анимация появления/исчезания */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity var(--transition-speed) ease;
}
.slide-fade-enter-active .filter-sidebar,
.slide-fade-leave-active .filter-sidebar {
  transition: transform var(--transition-speed) ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-from .filter-sidebar,
.slide-fade-leave-to .filter-sidebar {
  transform: translateX(100%); /* Выезжает справа */
}
</style>
