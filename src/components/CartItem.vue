<template>
  <div class="cart-item">
    <!-- Изображение товара -->
    <router-link
      :to="{ name: 'Product', params: { id: item.product_id } }"
      class="cart-item__image-link"
    >
      <img
        :src="imageUrl"
        :alt="item.name"
        class="cart-item__image"
        @error="onImageError"
      />
    </router-link>

    <!-- Информация о товаре -->
    <div class="cart-item__details">
      <router-link
        :to="{ name: 'Product', params: { id: item.product_id } }"
        class="cart-item__name-link"
      >
        <span class="cart-item__name">{{ item.name }}</span>
        <!-- Можно добавить ID вариации, если нужно -->
        <!-- <span v-if="item.variation_id" class="cart-item__variation"> (Var: {{ item.variation_id }})</span> -->
      </router-link>
      <span class="cart-item__price-per-unit"
        >{{ formatPrice(item.price) }} ₽ / шт.</span
      >

      <!-- Управление количеством -->
      <div class="cart-item__quantity-controls">
        <button
          @click="decreaseQuantity"
          :disabled="localQuantity <= 1"
          class="quantity-btn"
        >
          -
        </button>
        <input
          type="number"
          v-model.number="localQuantity"
          @change="updateQuantityHandler"
          @blur="validateQuantityOnBlur"
          :max="maxAvailableQuantity"
          min="1"
          class="quantity-input"
        />
        <button
          @click="increaseQuantity"
          :disabled="localQuantity >= maxAvailableQuantity"
          class="quantity-btn"
        >
          +
        </button>
      </div>
      <!-- Предупреждение о нехватке -->
      <div v-if="showStockWarning" class="stock-warning">
        В наличии: {{ maxAvailableQuantity }} шт.
      </div>
    </div>

    <!-- Общая стоимость и кнопка удаления -->
    <div class="cart-item__actions">
      <span class="cart-item__total-price"
        >{{ formatPrice(itemTotalPrice) }} ₽</span
      >
      <button @click="removeItem" class="remove-btn" title="Удалить товар">
        ×
        <!-- Крестик -->
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useCartStore } from "@/store/cart";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const cartStore = useCartStore();

// Локальное состояние для количества, чтобы избежать прямого изменения стора из input
const localQuantity = ref(props.item.quantity);

// Наблюдаем за изменением количества в сторе (если оно изменится извне)
watch(
  () => props.item.quantity,
  (newQuantity) => {
    if (newQuantity !== localQuantity.value) {
      localQuantity.value = newQuantity;
    }
  }
);
const maxAvailableQuantity = computed(() => {
  // Используем данные из пропса item
  if (!props.item.manage_stock || props.item.stock_quantity === null) {
    return Infinity;
  }
  return props.item.stock_quantity;
});

const showStockWarning = computed(() => {
  // Показываем, если текущее количество равно максимуму (и он не бесконечен)
  return (
    maxAvailableQuantity.value !== Infinity &&
    localQuantity.value >= maxAvailableQuantity.value
  );
});

// Placeholder изображение
const placeholderImage = "/placeholder.png";

const imageUrl = computed(() => {
  return props.item.image || placeholderImage;
});

const onImageError = (event) => {
  event.target.src = placeholderImage;
};

// Форматирование цены
const formatPrice = (price) => {
  const number = parseFloat(price);
  return isNaN(number) ? "?" : number.toLocaleString("ru-RU");
};

// Общая стоимость для этой позиции
const itemTotalPrice = computed(() => {
  const price = parseFloat(props.item.price) || 0;
  return (price * localQuantity.value).toFixed(2);
});

// --- Управление количеством ---
const decreaseQuantity = () => {
  if (localQuantity.value > 1) {
    localQuantity.value--;
    updateQuantityHandler();
  }
};

const increaseQuantity = () => {
    if (localQuantity.value < maxAvailableQuantity.value) {
        localQuantity.value++;
        updateQuantityHandler();
    } else {
        console.warn("Maximum stock quantity reached in cart");
        // toast.warning(`Больше добавить нельзя. На складе ${maxAvailableQuantity.value} шт.`);
    }
};

const updateQuantityHandler = () => {
   validateQuantity();
   if (localQuantity.value !== props.item.quantity) {
        cartStore.updateQuantity(props.item.product_id, localQuantity.value, props.item.variation_id);
   }
};

const validateQuantityOnBlur = () => {
    validateQuantity();
    updateQuantityHandler();
};

const validateQuantity = () => {
    if (!Number.isInteger(localQuantity.value)) localQuantity.value = 1;
    if (localQuantity.value < 1) localQuantity.value = 1;
    // Ограничиваем сверху
    if (localQuantity.value > maxAvailableQuantity.value) {
        localQuantity.value = maxAvailableQuantity.value;
        // toast.warning(`Максимальное количество: ${maxAvailableQuantity.value} шт.`);
    }
};

// Удаление товара
const removeItem = () => {
  cartStore.removeFromCart(props.item.product_id, props.item.variation_id);
  // Можно добавить уведомление об удалении
};
</script>

<style scoped>
.cart-item {
  display: flex;
  align-items: flex-start;
  padding: 1.25rem 0; /* Больше вертикальный отступ */
  border-bottom: 1px solid var(--color-border); /* Тоньше граница */
  gap: 1rem;
}
.cart-item:last-child {
  border-bottom: none;
}

.cart-item__image-link {
  flex-shrink: 0;
}
.cart-item__image {
  display: block;
  width: 80px; /* Чуть больше */
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius-medium);
  background-color: var(--color-background-secondary);
  border: 1px solid var(--color-border);
}

.cart-item__details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.cart-item__name-link {
  text-decoration: none;
  color: var(--color-text);
}
.cart-item__name-link:hover .cart-item__name {
  color: var(--color-accent);
} /* Акцентный при наведении */
.cart-item__name {
  font-weight: 600;
  font-size: 1.05em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-speed);
}
.cart-item__price-per-unit {
  font-size: 0.9em;
  color: var(--color-text-muted);
}

.cart-item__quantity-controls {
  display: flex;
  align-items: center;
  margin-top: 0.6rem;
}
.quantity-btn {
  /* Стили как на странице товара */
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 1.3em;
  line-height: 1;
  border-radius: var(--border-radius-medium);
  background-color: var(--color-background-secondary);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
.quantity-btn:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-border-medium);
}
.quantity-input {
  /* Стили как на странице товара */
  width: 45px;
  height: 32px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-left: none;
  border-right: none;
  font-size: 1em;
  font-weight: 500;
  background-color: var(--color-background);
  color: var(--color-text);
}
.quantity-btn:first-of-type {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}
.quantity-btn:last-of-type {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}
.quantity-input {
  border-radius: 0;
}

.cart-item__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  margin-left: auto;
  padding-left: 1rem;
  flex-shrink: 0;
}
.cart-item__total-price {
  font-weight: 600; /* Жирнее */
  font-size: 1.1em;
  white-space: nowrap;
}
.remove-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.5em;
  line-height: 1;
  padding: 5px;
  cursor: pointer;
  transition: color var(--transition-speed);
}
.remove-btn:hover {
  color: var(--color-error);
}
.stock-warning {
    font-size: 0.8em;
    color: var(--color-error);
    margin-top: 0.3rem;
}
.quantity-btn:disabled,
.quantity-input:disabled {
     opacity: 0.6;
     cursor: not-allowed;
}
</style>
