<template>
  <div class="product-view">
    <BackButtonHandler @back="goBack" />

    <transition name="fade">
      <div v-if="isLoading" class="loading-indicator">
        <p>Загрузка информации о товаре...</p>
      </div>
    </transition>

    <!-- Сообщение об ошибке -->
    <transition name="fade">
      <div v-if="error" class="error-message">
        <p>Не удалось загрузить товар: {{ error }}</p>
        <button @click="loadProduct">Попробовать снова</button>

        <button @click="goBack" style="margin-left: 10px">Назад</button>
      </div>
    </transition>
    <transition name="fade-up" mode="out-in">
      <div v-if="product && !isLoading && !error" class="product-details">
        <div class="product-layout">
          <div class="product-gallery animated-item" style="--delay: 0.1s">
            <div class="product-image-wrapper">
              <transition name="fade" mode="out-in">
                <img
                  :key="selectedImageSrc"
                  :src="selectedImageSrc"
                  :alt="product.name"
                  class="product-image"
                  @error="onMainImageError"
                  loading="lazy"
                />
              </transition>
              <span v-if="product.on_sale" class="product-sale-badge"
                >Sale</span
              >
            </div>
            <transition-group
              v-if="product.images && product.images.length > 1"
              tag="div"
              name="thumbnail-list"
              class="product-thumbnails"
              appear
            >
              <button
                v-for="(image, index) in product.images"
                :key="image.id || index"
                class="thumbnail-button"
                :class="{ active: index === selectedImageIndex }"
                @click="selectImage(index)"
                type="button"
                :style="{ '--i': index }"
              >
                <img
                  :src="image.src"
                  :alt="`Миниатюра ${index + 1}`"
                  class="thumbnail-image"
                  @error="onThumbnailError"
                  loading="lazy"
                />
              </button>
            </transition-group>
          </div>
          <div class="product-info">
            <h1 class="product-name animated-item" style="--delay: 0.2s">
              {{ product.name }}
            </h1>
            <div class="product-price animated-item" style="--delay: 0.25s">
              <span v-if="product.on_sale && product.sale_price" class="sale-price">
          {{ formatPrice(product.sale_price) }} ₽
        </span>
        <span
          :class="{
            'regular-price--crossed': product.on_sale && product.sale_price,
          }"
          class="regular-price"
        >
          {{ formatPrice(product.regular_price) }} ₽
        </span>
            </div>
            <div
              class="product-stock-status animated-item"
              :class="stockStatusClass"
              style="--delay: 0.3s"
            >
              {{ stockStatusText }}
              <span
                v-if="managesStock && stockQuantity !== null"
                class="stock-quantity"
              >
                
              </span>
            </div>
            <div
              v-if="product.short_description"
              class="product-short-description animated-item"
              style="--delay: 0.35s"
              v-html="product.short_description"
            ></div>

            <div class="add-to-cart-section">
              <div class="quantity-selector">
                <button @click="decreaseQuantity" :disabled="quantity <= 1">
                  -
                </button>
                <input
                  type="number"
                  v-model.number="quantity"
                  :max="maxAvailableQuantity"
                  min="1"
                  @input="validateQuantity"
                  @blur="validateQuantityOnBlur"
                  :disabled="!isAvailable"
                />
                <button
                  @click="increaseQuantity"
                  :disabled="quantity >= maxAvailableQuantity || !isAvailable"
                >
                  +
                </button>
              </div>
              <button
                @click="handleAddToCart"
                class="add-to-cart-button"
                :disabled="!canAddToCart"
              >
                <span v-if="isAddingToCart">Добавляем...</span>
                <span v-else-if="!isAvailable">Нет в наличии</span>
                <span v-else-if="!hasEnoughStock">Недостаточно на складе</span>
                <span v-else>В корзину</span>
              </button>
            </div>
            <div v-if="showStockWarning" class="stock-warning">
              Вы не можете добавить больше, чем есть в наличии ({{
                maxAvailableQuantity
              }}
              шт.)
            </div>

            <div
              v-if="
                product.sku ||
                (product.categories && product.categories.length > 0)
              "
              class="product-meta animated-item"
              style="--delay: 0.5s"
            >
              <span v-if="product.sku">Артикул: {{ product.sku }}</span>
              <span v-if="product.categories?.length > 0"
                >Категории:
                {{ product.categories.map((c) => c.name).join(", ") }}</span
              >
            </div>
          </div>
        </div>

        <transition name="fade-up">
          <div v-if="product.description" class="product-description">
            <h2>Описание</h2>
            <div v-html="product.description"></div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchProductById } from "@/services";
import { useCartStore } from "@/store/cart";
import { useToast } from "vue-toastification";
import BackButtonHandler from "@/components/BackButtonHandler.vue";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const toast = useToast();

// Получаем ID товара из параметров маршрута
const productId = computed(() => route.params.id);

// Состояние компонента
const isAddingToCart = ref(false);
const product = ref(null);
const isLoading = ref(true);
const error = ref(null);
const managesStock = computed(() => product.value?.manage_stock === true);
// Максимально доступное количество для добавления
const maxAvailableQuantity = computed(() => {
  // Если управление запасами не ведется или остаток null, считаем бесконечным
  if (!managesStock.value || stockQuantity.value === null) {
    return Infinity; // Или большое число, например, 999
  }
  // Иначе возвращаем остаток на складе
  return stockQuantity.value;
});

// Проверка, достаточно ли товара на складе для выбранного количества
const hasEnoughStock = computed(() => {
  return quantity.value <= maxAvailableQuantity.value;
});

// Условие для деактивации кнопки "В корзину"
const canAddToCart = computed(() => {
  return isAvailable.value && hasEnoughStock.value && !isAddingToCart.value;
});

// Флаг для показа предупреждения о нехватке
const showStockWarning = computed(() => {
  return isAvailable.value && !hasEnoughStock.value;
});
// Количество на складе (может быть null, если управление выключено)
const stockQuantity = computed(() => product.value?.stock_quantity);
const quantity = ref(1); // Количество для добавления в корзину

const selectedImageIndex = ref(0); // Индекс выбранного изображения
const placeholderImage = "/placeholder.png";

// Вычисляемое свойство для URL текущего выбранного большого изображения
const selectedImageSrc = computed(() => {
  /*console.log(
    "Selecting image:",
    product.value?.images,
    selectedImageIndex.value
  );*/
  if (
    product.value?.images &&
    product.value.images.length > selectedImageIndex.value
  ) {
    return product.value.images[selectedImageIndex.value].src;
  }
  return placeholderImage;
});
// Функция загрузки данных о товаре
const loadProduct = async () => {
  if (!productId.value) return;
  isLoading.value = true;
  error.value = null;
  product.value = null; // Сброс перед загрузкой
  const fetchedProduct = await fetchProductById(productId.value);
  //console.log("Fetched product data RAW:", fetchedProduct);
  product.value = fetchedProduct;
  selectedImageIndex.value = 0;

  try {
    //console.log(`Fetching product with ID: ${productId.value}`); // Лог ID
    // Убедимся, что fetchProductById не запрашивает fullResponse
    const fetchedProduct = await fetchProductById(productId.value);
    //console.log("Fetched product data:", fetchedProduct); // <<< ЛОГ ДАННЫХ
    product.value = fetchedProduct;
    // Устанавливаем заголовок страницы
    if (fetchedProduct?.name) {
      document.title = `${fetchedProduct.name} | Магазин`;
    }
  } catch (err) {
    //console.error(`Error loading product ${productId.value}:`, err);
    error.value = err.detail || err.message || "Неизвестная ошибка";
    product.value = null;
  } finally {
    isLoading.value = false;
  }
};
const selectImage = (index) => {
  selectedImageIndex.value = index;
};
// Обработчик ошибки для основного изображения
const onMainImageError = (event) => {
  console.warn("Failed to load main product image:", event.target.src);
  // Пытаемся показать следующее изображение, если оно есть, иначе плейсхолдер
  if (
    product.value &&
    selectedImageIndex.value < product.value.images.length - 1
  ) {
    selectImage(selectedImageIndex.value + 1);
  } else {
    // Если это было последнее или единственное, ставим плейсхолдер
    if (event.target.src !== placeholderImage) {
      // Предотвращаем бесконечный цикл, если плейсхолдер тоже не грузится
      event.target.src = placeholderImage;
    }
  }
};

// Обработчик ошибки для миниатюр (можно просто скрыть или показать плейсхолдер)
const onThumbnailError = (event) => {
  console.warn("Failed to load thumbnail image:", event.target.src);
  // Можно заменить на маленький плейсхолдер или скрыть кнопку
  event.target.style.display = "none"; // Скрываем битую миниатюру
  // Или: event.target.src = '/placeholder_small.png';
};

// Вычисляемые свойства для статуса наличия
const isAvailable = computed(() => {
  //console.log("Checking availability:", product.value?.stock_status);
  // 'instock' - в наличии
  // 'onbackorder' - предзаказ (считаем доступным для добавления)
  // 'outofstock' - нет в наличии
  return (
    product.value?.status === "publish" &&
    (product.value?.stock_status === "instock" ||
      product.value?.stock_status === "onbackorder")
  );
});

const stockStatusText = computed(() => {
  if (!product.value) return "";
  switch (product.value.stock_status) {
    case "instock":
      return "В наличии";
    case "onbackorder":
      return "Доступен для предзаказа";
    case "outofstock":
      return "Нет в наличии";
    default:
      return "";
  }
});

const stockStatusClass = computed(() => {
  if (!product.value) return "";
  return `stock-${product.value.stock_status || "unknown"}`;
});

// Функция форматирования цены
const formatPrice = (price) => {
  const number = parseFloat(price);
  return isNaN(number) ? "?" : number.toLocaleString("ru-RU");
};

// --- Управление количеством ---
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const increaseQuantity = () => {
  // Не даем увеличить больше, чем есть на складе
  if (quantity.value < maxAvailableQuantity.value) {
    quantity.value++;
  } else {
    // Можно показать уведомление или просто не давать увеличивать
    console.warn("Maximum stock quantity reached");
  }
};
// Валидация ввода количества с учетом остатка
const validateQuantity = () => {
  if (!Number.isInteger(quantity.value)) {
    quantity.value = 1;
  }
  if (quantity.value < 1) {
    quantity.value = 1;
  }
  // Если ввели больше, чем есть на складе, ограничиваем максимумом
  if (quantity.value > maxAvailableQuantity.value) {
    quantity.value = maxAvailableQuantity.value;
    // Можно добавить toast.warning(...)
  }
};
const validateQuantityOnBlur = () => {
  validateQuantity();
};

// --- Добавление в корзину ---
const handleAddToCart = async () => {
  // Используем canAddToCart для проверки
  if (!product.value || !canAddToCart.value) return;

  isAddingToCart.value = true;
  validateQuantity(); // На всякий случай

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    cartStore.addToCart(product.value, quantity.value);
    toast.success(
      `"${product.value.name}" (${quantity.value} шт.) добавлен(о) в корзину!`
    );
  } catch (e) {
    toast.error("Ошибка при добавлении в корзину");
    console.error(e);
  } finally {
    isAddingToCart.value = false;
  }
};
const goBack = () => {
  if (router.options.history.state.back) {
    router.go(-1);
  } else {
    router.push({ name: "Catalog" });
  }
};
// --- Жизненный цикл ---
onMounted(() => {
  loadProduct(); // Загружаем товар при монтировании
  // Показываем кнопку Назад Telegram при входе на страницу
  // showBackButton(goBack); // Используем компонент BackButtonHandler
});

// Следим за изменением ID в маршруте (если пользователь переходит с одного товара на другой)
watch(productId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadProduct();
    // Прокрутка вверх при смене товара
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// // Скрываем кнопку Назад Telegram при уходе со страницы
// // Это лучше делать в компоненте BackButtonHandler
// onUnmounted(() => {
//   hideBackButton();
// });
</script>

<style scoped>
.product-view {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 3rem; /* Больше отступ снизу */
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2.5rem;
}
@media (min-width: 768px) {
  .product-layout {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); /* Левая колонка чуть шире */
    gap: 3rem;
    align-items: flex-start;
  }
}
/* Анимация для миниатюр */
.product-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.thumbnail-button {
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--border-radius-medium);
  background: none;
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition-speed), opacity 0.5s ease-out,
    transform 0.5s ease-out; /* Добавляем анимацию появления */
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  /* Начальное состояние для CSS анимации */
  opacity: 0;
  transform: translateY(10px);
  /* Применяем анимацию с задержкой по индексу */
  animation: fadeInUp 0.5s ease-out forwards;
  animation-delay: calc(
    var(--i, 0) * 0.08s + 0.2s
  ); /* 0.2s базовая задержка + инкремент */
}
.thumbnail-button.active {
  border-color: var(--color-accent);
}
.thumbnail-button:hover:not(.active) {
  border-color: var(--color-border-medium);
}
.thumbnail-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--border-radius-large);
  overflow: hidden;
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
}
.product-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}
.product-image.placeholder {
  padding: 15%;
  opacity: 0.6;
}

.product-name {
  font-size: 1.8em; /* Крупнее */
  font-weight: 700;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

.product-price {
  font-size: 1.5em; /* Крупнее */
  margin-bottom: 1rem;
}
.sale-price {
  font-weight: 700;
}
.regular-price {
  color: var(--color-text-muted);
  font-size: 0.8em;
}
.regular-price--crossed {
  text-decoration: line-through;
}

.product-stock-status {
  font-size: 0.9em;
  margin-bottom: 1.5rem;
  padding: 6px 12px;
  border-radius: var(--border-radius-medium);
  display: inline-block;
  font-weight: 500;
  display: inline-flex; /* Чтобы элементы были в строку */
  align-items: baseline;
  gap: 8px;
}
/* Классы stock-... как раньше */
.stock-instock {
  color: var(--color-success);
  background-color: rgba(92, 184, 92, 0.1);
}
.stock-onbackorder {
  color: #f0ad4e;
  background-color: rgba(240, 173, 78, 0.1);
}
.stock-outofstock {
  color: var(--color-error);
  background-color: rgba(217, 83, 79, 0.1);
}
.stock-quantity {
  font-size: 0.9em;
  color: var(--color-text-muted);
}

.quantity-selector input:disabled {
  background-color: var(--color-background-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.add-to-cart-button:disabled span {
  /* Можно немного приглушить текст на неактивной кнопке */
  opacity: 0.8;
}

.stock-warning {
  color: var(--color-error);
  font-size: 0.85em;
  margin-top: 0.5rem;
  /* padding-left: calc(38px + 55px + 38px + 1rem); */ /* Отступ слева, если нужно выровнять */
}
.product-short-description {
  margin-bottom: 2rem;
  color: var(--color-text);
  line-height: 1.6;
}
.product-short-description :deep(p) {
  margin-bottom: 0.5em;
} /* Стили для HTML */

.add-to-cart-section {
  display: flex;
  flex-wrap: wrap; /* Перенос на мобильных */
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-large);
}

.quantity-selector {
  display: flex;
  align-items: center;
  margin-right: auto; /* Отодвигаем кнопку "в корзину" */
}
.quantity-selector button {
  width: 38px;
  height: 38px;
  padding: 0;
  font-size: 1.4em;
  line-height: 1;
  border-radius: var(--border-radius-medium);
  background-color: var(--color-background);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
.quantity-selector button:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-border-medium);
}
.quantity-selector input {
  width: 55px;
  height: 38px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-left: none;
  border-right: none;
  font-size: 1.1em;
  font-weight: 500;
  background-color: var(--color-background);
  color: var(--color-text);
}
.quantity-selector button:first-of-type {
  /* Левая кнопка */
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}
.quantity-selector button:last-of-type {
  /* Правая кнопка */
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}
.quantity-selector input {
  border-radius: 0;
}

.add-to-cart-button {
  flex-grow: 1; /* На мобильных займет всю ширину */
  padding: 12px 20px;
  font-size: 1.05em;
  font-weight: 600;
}
@media (min-width: 450px) {
  /* На экранах пошире кнопка не растягивается */
  .add-to-cart-button {
    flex-grow: 0;
  }
}

.product-meta {
  margin-top: 1.5rem;
  font-size: 0.9em;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.product-meta span {
  display: block;
}

.product-description {
  margin-top: 3rem;
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}
.product-description h2 {
  margin-bottom: 1rem;
  font-size: 1.4em;
}
.product-description :deep(p) {
  margin-bottom: 1em;
  line-height: 1.7;
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--border-radius-large);
  overflow: hidden;
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  margin-bottom: 1rem; /* Отступ до миниатюр */
}
.product-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}
.product-image.placeholder {
  padding: 15%;
  opacity: 0.6;
}
.product-sale-badge {
  /* Стили как раньше */
}

.product-thumbnails {
  display: flex;
  flex-wrap: wrap; /* Перенос миниатюр */
  gap: 0.75rem; /* Отступ между миниатюрами */
  margin-top: 1rem; /* Отступ от основного фото */
}

.thumbnail-button {
  padding: 0; /* Убираем padding кнопки */
  border: 2px solid transparent; /* Граница для выделения активной */
  border-radius: var(--border-radius-medium);
  background: none;
  cursor: pointer;
  overflow: hidden; /* Обрезаем изображение по рамке */
  transition: border-color var(--transition-speed);
  width: 60px; /* Размер миниатюры */
  height: 60px;
  flex-shrink: 0; /* Не сжимать миниатюры */
}

.thumbnail-button.active {
  border-color: var(--color-accent); /* Выделяем активную */
}
.thumbnail-button:hover:not(.active) {
  border-color: var(--color-border-medium); /* Легкая рамка при наведении */
}

.thumbnail-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
