<template>
  <div class="catalog-view">
    <!-- Header с плавной загрузкой -->
    <transition name="fade-down">
      <div class="catalog-header" v-if="!initialLoading">
        <h1>Каталог</h1>
        <button @click="openSidebar" class="filter-toggle-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <!-- Используем имя из стора -->
          {{ truncatedCategoryName }}
          <!-- Используем ID из стора -->
          <span
            v-if="filterStore.selectedCategoryId !== null"
            class="filter-applied-dot"
          ></span>
        </button>
      </div>
    </transition>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-indicator">
      <p>Загрузка товаров...</p>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-if="error" class="error-message">
      <p>Не удалось загрузить товары: {{ error }}</p>
      <button @click="loadData">Попробовать снова</button>
    </div>

    <!-- Сетка с товарами -->
    <transition name="fade" mode="out-in">
      <div :key="`${filterStore.selectedCategoryId}-${currentPage}`" class="content-wrapper">
        <transition-group
          v-if="!isLoading && !error && products.length > 0" 
          tag="div"
          name="product-list"
          class="products-grid"
          @before-enter="beforeProductEnter"
          @enter="productEnter"
          appear
        >
          <ProductCard
            v-for="(product, index) in products" 
            :key="product.id"
            :product="product"
            :data-index="index"
          />
        </transition-group>

       
        <div
          v-else-if="!isLoading && !error && products.length === 0" 
          class="no-products"
        >
          <p>Товары не найдены.</p>
          <button
            v-if="filterStore.selectedCategoryId !== null"
            @click="resetFiltersAndLoad"
            class="reset-filters-main-btn"
          >
            Сбросить фильтр
          </button>
        </div>
      </div>
    </transition>

    <!-- Пагинация (с анимацией) -->
    <transition name="fade-up">
      <div
        v-if="!isLoading && !error && products.length > 0 && totalPages > 1"
        class="pagination"
      >
        <button @click="prevPage" :disabled="currentPage <= 1" aria-label="Предыдущая страница"> 
          <!-- Иконка "Назад" (шеврон влево) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span>Страница {{ currentPage }} / {{ totalPages }}</span>
        <button
          @click="nextPage"
          :disabled="isLastPage || currentPage >= totalPages"
          aria-label="Следующая страница" 
        >
          <!-- Иконка "Вперед" (шеврон вправо) -->
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </transition>
    <!-- Сайдбар -->
    <FilterSidebar :is-open="isSidebarOpen" @close="closeSidebar" />
  </div>
</template>

<script setup>

import { ref, onMounted, watch, computed } from "vue";

import FilterSidebar from "@/components/FilterSidebar.vue";
import { fetchProducts } from "@/services";
import ProductCard from "@/components/ProductCard.vue";
import { useFilterStore } from "@/store/filters";
import { gsap } from "gsap";
const initialLoading = ref(true);

const products = ref([]);
const isLoading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const productsPerPage = ref(10);
const isLastPage = ref(false);
const totalPages = ref(1);
const isSidebarOpen = ref(false);

const filterStore = useFilterStore();


const openSidebar = () => {
  isSidebarOpen.value = true;
};
const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const truncatedCategoryName = computed(() => {
  // Получаем текущее имя из стора (убедитесь, что filterStore доступен здесь)
  const name = filterStore.selectedCategoryName;
  const maxLength = 10; // Максимальная длина

  // Если имени нет или оно пустое, возвращаем текст по умолчанию
  if (!name) {
    // Используйте текст, который должен быть, когда категория не выбрана
    // Например, 'Фильтр', 'Все категории' или значение по умолчанию из стора
    return "Фильтр";
  }

  // Если имя длиннее максимальной длины
  if (name.length > maxLength) {
    // Обрезаем до maxLength символов и добавляем многоточие
    return name.slice(0, maxLength) + "...";
  }

  // Если имя короткое или равно maxLength, возвращаем его как есть
  return name;
});

const loadData = async () => {
  isLoading.value = true;
  error.value = null;
  /*console.log("loadData called with filters:", {
    category: filterStore.selectedCategoryId,
    page: currentPage.value,
  });*/
  try {
    const params = {
      page: currentPage.value,
      per_page: productsPerPage.value,
      status: "publish",
      category: filterStore.selectedCategoryId,
    };
    const response = await fetchProducts(params, { fullResponse: true });
    //console.log("Full response from fetchProducts:", response);

    if (response && response.data) {
      const fetchedProducts = response.data;
      //console.log("Extracted fetchedProducts:", fetchedProducts);
      products.value = Array.isArray(fetchedProducts) ? fetchedProducts : [];

      // Используем ?. для безопасного доступа и || 1 для дефолта
      const totalPagesHeader = response.headers?.["x-wp-totalpages"];
      //console.log("x-wp-totalpages header:", totalPagesHeader); // Добавляем лог заголовка
      totalPages.value = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;
      // Добавим проверку на NaN после parseInt
      if (isNaN(totalPages.value) || totalPages.value < 1) {
        totalPages.value = 1;
      }

      isLastPage.value = currentPage.value >= totalPages.value;
      /*console.log("Pagination info:", {
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        isLastPage: isLastPage.value,
      });*/
    } else {
      console.error(
        "Invalid response structure received from fetchProducts:",
        response
      );
      products.value = [];
      totalPages.value = 1;
      isLastPage.value = true;
    }
  } catch (err) {
    console.error("Error in loadData catch block:", err);
    error.value = err.detail || err.message || "Неизвестная ошибка";
    products.value = [];
    totalPages.value = 1;
  } finally {
    isLoading.value = false;
    initialLoading.value = false;
  }
};

// --- Функции для анимации списка продуктов (GSAP) ---
const beforeProductEnter = (el) => {
  // Начальное состояние перед анимацией
  el.style.opacity = 0;
  el.style.transform = "translateY(30px)";
};

const productEnter = (el, done) => {
  // Анимация появления
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.4, // Длительность анимации
    delay: el.dataset.index * 0.07, // Задержка зависит от индекса элемента
    ease: "power2.out", // Эффект замедления
    onComplete: done, // Вызываем done по завершении анимации
  });
};

const nextPage = () => {
  // Добавим проверку totalPages, чтобы не уйти за последнюю страницу
  if (!isLastPage.value && currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const resetFiltersAndLoad = () => {
  filterStore.resetFilters();
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    loadData();
  }
};

onMounted(() => {
  filterStore.loadAllCategories(); // Загружаем категории для сайдбара
  loadData(); // Загружаем товары
});

watch(
  [() => filterStore.selectedCategoryId, currentPage],
  (newValues, oldValues) => {
    if (newValues[0] !== oldValues[0]) {
      if (currentPage.value !== 1) {
        currentPage.value = 1;
        // Не вызываем loadData здесь, watcher сработает на смену currentPage
        return;
      }
    }
    // Этот watch сработает И при смене фильтра (если страница уже 1), И при смене страницы
    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
);
</script>

<style scoped>
.catalog-view {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-speed) ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Анимация появления снизу */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.catalog-header {
  /* Новая обертка */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.catalog-header h1 {
  margin-bottom: 0; /* Убираем нижний отступ у заголовка */
  text-align: left; /* Выравниваем по левому краю */
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text);
  padding: 8px 15px;
  border-radius: var(--border-radius-medium);
  font-weight: 500;
}
.filter-toggle-btn svg {
  stroke: currentColor;
}
.filter-toggle-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-background-secondary);
}
.filter-applied-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-accent); /* Или другой цвет индикации */
  border-radius: 50%;
  display: inline-block;
  margin-left: 4px; /* Небольшой отступ слева от точки */
}

.products-grid {
  display: grid;
  /* Оставляем 2 колонки для мобильных, до 4-5 для десктопа */
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
}
@media (min-width: 600px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}
@media (min-width: 900px) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (min-width: 1100px) {
  .products-grid {
    grid-template-columns: repeat(
      5,
      1fr
    ); /* До 5 колонок на очень широких экранах */
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem; /* Можно немного уменьшить gap */
  margin-top: 2rem;
  padding-bottom: 1rem;
}

.pagination button {
  background-color: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-muted);
  border-radius: 50%;
  width: 38px; /* Немного меньше */
  height: 38px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, border-color 0.2s; /* Плавный переход для hover */
}
.pagination button svg {
  stroke: currentColor;
  width: 18px; /* Явно задать размер SVG */
  height: 18px;
}

.pagination button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: transparent;
}

.pagination button:disabled {
    opacity: 0.4; /* Более заметно для неактивных */
    cursor: not-allowed;
}

.pagination span {
  font-size: 0.95em;
  color: var(--color-text); /* Сделаем текст страницы чуть заметнее */
  font-weight: 500;
  min-width: 110px;
  text-align: center;
}
</style>
