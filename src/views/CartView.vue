<template>
  <div class="cart-view">
    <!-- Кнопка Назад -->
    <BackButtonHandler @back="goBack" />

    <transition name="fade-down" appear>
        <h1>Корзина</h1>
    </transition>

    <transition name="fade" mode="out-in">
        <div v-if="cartStore.isEmpty" class="empty-cart">
          <p>Ваша корзина пуста.</p>
          <router-link to="/" class="go-to-catalog-btn">Перейти в каталог</router-link>
        </div>

        <div v-else class="cart-content">
  
          <transition-group
            tag="div"
            name="cart-item-list"
            class="cart-items-list"
            appear
          >
            <CartItem
              v-for="(item, index) in cartStore.items"
              :key="item.product_id + '-' + (item.variation_id || 'no-var')" 
              :item="item"
              :style="{ '--i': index }" 
            />
          </transition-group>

       <!-- >>>>> БЛОК ПРОМОКОДА <<<<< -->
       <transition name="fade-up" mode="in-out" appear>
              <div class="promo-and-summary-wrapper"> 
                  <div class="promo-code-section">
                    <input
                      type="text"
                      v-model.trim="promoCodeInput"
                      placeholder="Введите промокод"
                      :disabled="!!cartStore.appliedCoupon || cartStore.isApplyingCoupon"
                      class="promo-input"
                    />
                    <button
                      @click="handleApplyCoupon"
                      :disabled="!promoCodeInput || !!cartStore.appliedCoupon || cartStore.isApplyingCoupon"
                      class="promo-apply-btn"
                    >
                      <span v-if="cartStore.isApplyingCoupon">Проверка...</span>
                      <span v-else>Применить</span>
                    </button>
                  </div>
                  <transition name="fade">
                      <div v-if="cartStore.couponValidationError" class="promo-error">
                        {{ cartStore.couponValidationError }}
                      </div>
                  </transition>

                
                  <div class="cart-summary">
                    <div class="summary-row animated-item" style="--delay: 0.1s;">
                      <span>Товаров:</span>
                      <span>{{ cartStore.totalItems }} шт.</span>
                    </div>
                    <div v-if="cartStore.appliedCoupon" class="summary-row animated-item" style="--delay: 0.15s;">
                      <span>Подытог:</span>
                      <span>{{ cartStore.subtotal.toFixed(2) }} ₽</span>
                    </div>

                    <transition name="fade">
                        <div v-if="cartStore.appliedCoupon" class="summary-row discount animated-item" style="--delay: 0.2s;">
                          <span>Скидка ({{ cartStore.appliedCoupon.code }}):</span>
                          <span>- {{ cartStore.discountAmount.toFixed(2) }} ₽</span>
                          <button @click="handleRemoveCoupon" class="remove-coupon-btn" aria-label="Удалить промокод">×</button>
                        </div>
                    </transition>

                    <div class="summary-row total animated-item" style="--delay: 0.25s;">
                      <span>Итого:</span>
                      <span>{{ cartStore.totalPrice }} ₽</span>
                    </div>

                    <transition name="fade">
                        <div v-if="!isMinOrderAmountReached && !cartStore.isEmpty" class="min-order-warning animated-item" style="--delay: 0.3s;">
                           Минимальная сумма заказа: {{ MIN_ORDER_AMOUNT }} ₽
                        </div>
                    </transition>

                    <transition name="fade">
                        <div v-if="checkoutError" class="checkout-error animated-item" style="--delay: 0.35s;">
                           Ошибка оформления: {{ checkoutError }}
                        </div>
                    </transition>
                  </div>
              </div>
          </transition>
        </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/store/cart";
import CartItem from "@/components/CartItem.vue";
import BackButtonHandler from "@/components/BackButtonHandler.vue";
import {
  showMainButton,
  hideMainButton,
  showConfirm,
  getInitData,
} from "@/utils/telegram";
import { createOrder } from "@/services"; // API функция
import { useToast } from "vue-toastification";


const router = useRouter();
const cartStore = useCartStore();
const toast = useToast();
const promoCodeInput = ref(''); 
const isProcessing = ref(false); // Флаг процесса оформления
const checkoutError = ref(null); // Ошибка оформления
// --- МИНИМАЛЬНАЯ СУММА ЗАКАЗА ---
const MIN_ORDER_AMOUNT = 500; // Установите вашу минимальную сумму

const isMinOrderAmountReached = computed(() => {
    // Преобразуем totalPrice к числу для сравнения
    return parseFloat(cartStore.totalPrice) >= MIN_ORDER_AMOUNT;
});

const handleApplyCoupon = () => {
    cartStore.applyCoupon(promoCodeInput.value);
    // Можно добавить обработку результата (успех/ошибка) через watch или прямо здесь
};

const handleRemoveCoupon = () => {
    cartStore.removeCoupon();
    promoCodeInput.value = ''; // Очищаем поле ввода
};

// Следим за ошибкой валидации, чтобы показать toast
watch(() => cartStore.couponValidationError, (newError) => {
    if (newError) {
        toast.error(newError);
    }
});
// Следим за применением купона, чтобы показать toast успеха
 watch(() => cartStore.appliedCoupon, (newCoupon, oldCoupon) => {
    if (newCoupon && !oldCoupon) { // Если купон только что применился
        toast.success(`Промокод "${newCoupon.code}" успешно применен!`);
    }
     if (!newCoupon && oldCoupon) { // Если купон только что удалился
         toast.info(`Промокод "${oldCoupon.code}" удален.`);
     }
});
// --- Конец Логики Промокода ---

// --- Оформление заказа ---
const proceedToCheckout = async () => {
  if (cartStore.isEmpty || isProcessing.value || !isMinOrderAmountReached.value) return;

  isProcessing.value = true;
  checkoutError.value = null; // Сбрасываем предыдущую ошибку
  showMainButton('Оформление...', () => {}, true, true);

  try {
    const initData = getInitData();
    if (!initData) throw new Error("Нет данных пользователя Telegram.");

    const payload = {
      line_items: cartStore.items.map(item => ({ /* ... */ })),
      coupon_code: cartStore.appliedCoupon?.code || null
    };

    const createdOrder = await createOrder(payload, initData);

    console.log('Order created:', createdOrder);
    toast.success(`Заказ №${createdOrder.id || '?'} успешно создан!`);
    cartStore.clearCart(); // Очищаем корзину и купон
    router.push({ name: 'CheckoutSuccess' });

  } catch (error) { // Ловим ошибку от Axios interceptor или API
    console.error("Checkout error object:", error);
    let userMessage = "Не удалось оформить заказ. Попробуйте позже."; // Сообщение по умолчанию

    // Пытаемся извлечь сообщение от WooCommerce из деталей ошибки
    const detail = error?.detail || error?.message || '';

    // Проверяем на конкретные сообщения от WooCommerce
    if (typeof detail === 'string') {
       if (detail.includes('Лимит применения купона уже достигнут')) {
            userMessage = "Лимит использования этого промокода исчерпан.";
            // Предлагаем удалить купон
            checkoutError.value = userMessage + " Удалите промокод и попробуйте снова.";
            // Удаляем невалидный купон из стора
            if(cartStore.appliedCoupon?.code){
                toast.error(userMessage + ` Промокод "${cartStore.appliedCoupon.code}" удален.`);
                cartStore.removeCoupon(); // Удаляем купон автоматически
            } else {
                 toast.error(userMessage);
            }
       } else if (detail.includes('Для этого купона установлена минимальная сумма заказа')) {
             // Пытаемся извлечь сумму (может быть ненадёжно из-за HTML)
             const amountMatch = detail.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))/); // Ищем число с разделителями
             const minAmount = amountMatch ? amountMatch[1] : 'требуемую';
             userMessage = `Минимальная сумма заказа для этого промокода: ${minAmount} ₽.`;
             checkoutError.value = userMessage + " Добавьте товары или удалите промокод.";
             // Не удаляем купон автоматически, даем пользователю решить
             toast.warning(userMessage);
       } else if (detail.includes('Неверный параметр: coupon_lines') || detail.includes('Код купона не существует')) {
            // Если сам купон стал недействительным (удалили в админке пока он был применен)
             userMessage = "Этот промокод больше недействителен.";
             checkoutError.value = userMessage + " Удалите промокод и попробуйте снова.";
              if(cartStore.appliedCoupon?.code){
                toast.error(userMessage + ` Промокод "${cartStore.appliedCoupon.code}" удален.`);
                cartStore.removeCoupon(); // Удаляем купон автоматически
            } else {
                 toast.error(userMessage);
            }
       } else if (detail.includes('Ошибка WooCommerce')) {
             // Другие ошибки WC
             userMessage = detail; // Показываем как есть
             checkoutError.value = userMessage;
             toast.error(userMessage);
       } else if (detail) {
            // Другие ошибки от нашего API или Axios
            userMessage = detail;
            checkoutError.value = userMessage;
            toast.error(userMessage);
       } else {
            // Если вообще нет деталей
            checkoutError.value = userMessage;
            toast.error(userMessage);
       }
    } else {
        checkoutError.value = userMessage;
        toast.error(userMessage);
    }


  } finally {
    isProcessing.value = false;
    // Обновляем кнопку в любом случае (текст изменится из-за ошибки или снятия флага)
    updateMainButton();
  }
};

// --- Управление MainButton ---
const updateMainButton = () => {
  if (!cartStore.isEmpty) {
    showMainButton(
      `Оформить заказ`,
      proceedToCheckout,
       // Колбэк при нажатии
      isProcessing.value, // Отключить во время обработки
      isProcessing.value // Показать прогресс во время обработки
    );
    console.log('Updating Main Button. Total Price:', cartStore.totalPrice);
  } else {
    hideMainButton(); // Скрываем кнопку, если корзина пуста
  }
};

// --- Навигация ---
const goBack = () => {
  router.push({ name: "Catalog" }); // Всегда возвращаемся в каталог из корзины
};

// --- Жизненный цикл ---
onMounted(() => {
  updateMainButton(); // Показываем/обновляем MainButton при входе
  // Следим за изменениями в корзине, чтобы обновлять кнопку
  watch(() => cartStore.items, updateMainButton, { deep: true });
  // Также следим за общей суммой, т.к. она может измениться без изменения items (редко)
  watch(() => cartStore.totalPrice, updateMainButton);
});

onUnmounted(() => {
  hideMainButton(); // Скрываем MainButton при уходе со страницы
});
</script>
<style scoped>
.cart-view {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 4rem; /* Отступ снизу */
}

h1 {
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
  font-size: 1.8em;
  /* Анимация заголовка будет через fade-down transition */
}
.cart-item-list-move, /* Анимация перемещения при удалении */
.cart-item-list-enter-active,
.cart-item-list-leave-active {
  transition: all 0.4s ease; /* Плавное перемещение и появление/исчезновение */
}
.cart-item-list-enter-from,
.cart-item-list-leave-to {
  opacity: 0;
  transform: translateX(30px); /* Выезд справа */
}
.cart-item-list-leave-active {
  /* Делаем удаляемый элемент абсолютным, чтобы другие плавно сдвинулись */
  position: absolute;
  width: calc(100% - 3rem); /* Ширина минус паддинги родителя */
}
/* Добавляем задержку появления для каждого элемента */
.cart-item-list-enter-active {
    animation-delay: calc(var(--i, 0) * 0.08s);
}


.promo-and-summary-wrapper {
    /* Обертка для блоков ниже списка */
    margin-top: 2rem; /* Отступ от списка */
}

.promo-code-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  /* Анимация этого блока будет через родительский transition */
}
.promo-code-section {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  align-items: stretch; /* Выровнять по высоте */
}
.promo-input {
  flex-grow: 1;
  border-color: var(--color-border);
  background-color: var(--color-background-secondary);
  /* >>>>> ДОБАВИТЬ ЭТУ СТРОКУ <<<<< */
  min-width: 0; /* Позволить инпуту сжиматься */
  /* >>>>> КОНЕЦ <<<<< */
}
.promo-input:disabled {
    background-color: var(--color-border);
    opacity: 0.7;
    min-width: 0;
}
.promo-apply-btn {
  flex-shrink: 0; /* Не сжимать кнопку */
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  font-weight: 600;
}
.promo-apply-btn:disabled {
     background-color: var(--color-border);
     color: var(--color-text-muted);
}

.promo-error {
  color: var(--color-error);
  font-size: 0.85em;
  margin-bottom: 1.5rem; /* Отступ снизу */
}


.empty-cart {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--tg-theme-hint-color);
}

.go-to-catalog-btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 10px 20px;
  background-color: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

.cart-items-list { margin-bottom: 2.5rem; }

.cart-summary {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  margin-top: 1.5rem; /* Отступ от промокода */
  /* Анимация этого блока будет через родительский transition */
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 1.1em;
  /* Анимация для строк */
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
  animation-delay: var(--delay, 0s); /* Задержка из inline style */
}
.summary-row span:first-child { color: var(--color-text-muted); font-weight: 400; }
.summary-row span:last-child { font-weight: 500; }
.min-order-warning {
    text-align: center;
    color: var(--color-error); /* Или другой цвет предупреждения */
    font-size: 0.9em;
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: rgba(217, 83, 79, 0.05); /* Легкий фон */
    border-radius: var(--border-radius-medium);
}
.summary-row.total {
  font-weight: 700; /* Жирнее */
  font-size: 1.35em;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.summary-row.total span:first-child { color: var(--color-text); }

.checkout-error {
  margin-top: 1rem;
  color: #dc3545;
  text-align: center;
  font-size: 0.9em;
}

.summary-row.discount {
  color: var(--color-success); /* Зеленый для скидки */
  font-size: 1em;
  display: flex; /* Для кнопки удаления */
  align-items: center;
}
.summary-row.discount span:first-child { color: var(--color-success); }
.summary-row.discount span:last-child { color: var(--color-success); font-weight: 500; }

.remove-coupon-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.2em;
  line-height: 1;
  padding: 0 0 0 10px;
  margin-left: auto; /* Сдвинуть вправо */
  cursor: pointer;
}
 .remove-coupon-btn:hover {
     color: var(--color-error);
 }
</style>