// frontend/src/store/filters.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchCategories } from '@/services';

export const useFilterStore = defineStore('filters', () => {
  // --- Состояние ---
  const allCategories = ref([]);
  const isLoadingCategories = ref(false);
  const error = ref(null);
  const selectedCategoryId = ref(null);

  // --- Геттеры ---
  const topLevelCategories = computed(() => {
    return allCategories.value.filter(cat => typeof cat === 'object' && cat !== null && (!cat.parent || cat.parent === 0));
  });

  const getSubcategories = (parentId) => {
    if (!parentId) return [];
    return allCategories.value.filter(cat => typeof cat === 'object' && cat !== null && cat.parent === parentId);
  };

  // >>>>> ВОТ ЭТО СВОЙСТВО ДОЛЖНО БЫТЬ ОПРЕДЕЛЕНО <<<<<
  const selectedCategoryPath = computed(() => {
    const path = [];
    let currentId = selectedCategoryId.value;
    // Используем цикл while и find для поиска по allCategories
    while (currentId) {
      // Ищем категорию по ID в плоском списке
      const category = allCategories.value.find(cat => cat && cat.id === currentId);
      if (category) {
        path.unshift(category); // Добавляем в начало массива
        currentId = category.parent; // Переходим к родителю
      } else {
        // Если категория не найдена (например, еще не загружена), останавливаемся
        console.warn(`Category with ID ${currentId} not found in allCategories for path.`);
        currentId = null;
      }
    }
    return path; // Возвращаем массив объектов категорий [родитель, ..., потомок]
  });
  // >>>>> КОНЕЦ ОПРЕДЕЛЕНИЯ <<<<<

  const selectedCategoryName = computed(() => {
      if (!selectedCategoryId.value) return "Все товары";
      const category = allCategories.value.find(cat => cat && cat.id === selectedCategoryId.value);
      return category ? category.name : "Выбранная категория";
  });

  // --- Экшены ---
  const loadAllCategories = async () => {
    isLoadingCategories.value = true;
    error.value = null;
    try {
      const fetched = await fetchCategories({ per_page: 100, orderby: 'menu_order' });
      //console.log("Fetched categories RAW in store:", fetched);

      if (Array.isArray(fetched)) {
           // Проверяем на вложенность (хотя interceptor должен был вернуть data)
          if (fetched.length > 0 && Array.isArray(fetched[0])) {
               console.warn("Received nested array for categories, taking first element.");
               allCategories.value = fetched[0].filter(item => typeof item === 'object' && item !== null); // Фильтруем, чтобы убедиться, что там объекты
          } else {
               allCategories.value = fetched.filter(item => typeof item === 'object' && item !== null); // Фильтруем на всякий случай
          }
      } else {
          console.error("Fetched categories is not an array:", fetched);
          allCategories.value = [];
      }

       if (allCategories.value.length > 0 && typeof allCategories.value[0] !== 'object') {
           console.error("allCategories does not contain objects after processing!", allCategories.value);
           allCategories.value = [];
      }

      //console.log("allCategories state after processing:", allCategories.value);

    } catch (err) { /* ... обработка ошибок ... */ }
      finally { isLoadingCategories.value = false; }
  };

  const setCategory = (categoryId) => { selectedCategoryId.value = categoryId; };
  const resetFilters = () => { selectedCategoryId.value = null; };

  // >>>>> УБЕДИТЕСЬ, ЧТО selectedCategoryPath ЕСТЬ В RETURN <<<<<
  return {
    allCategories,
    isLoadingCategories,
    error,
    selectedCategoryId,
    topLevelCategories,
    getSubcategories,
    selectedCategoryPath, // <<< ВОТ ЗДЕСЬ
    selectedCategoryName,
    loadAllCategories,
    setCategory,
    resetFilters,
  };
  // >>>>> КОНЕЦ ПРОВЕРКИ RETURN <<<<<
});