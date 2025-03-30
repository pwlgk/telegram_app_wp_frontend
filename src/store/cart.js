import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { validateCoupon } from "@/services"; // Убедитесь, что импорт есть

const CART_STORAGE_KEY = "kosynka_store_cart"; // Используем уникальный ключ

const loadCartFromStorage = () => {
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (storedCart) {
    try {
      // Исправляем map: используем имя переменной (например, 'parsedItem')
      return JSON.parse(storedCart).map((parsedItem) => ({
        ...parsedItem, // Копируем все свойства из загруженного объекта
        // Добавляем поля по умолчанию, если их нет в parsedItem
        stock_quantity:
          parsedItem.stock_quantity === undefined
            ? null
            : parsedItem.stock_quantity,
        manage_stock:
          parsedItem.manage_stock === undefined
            ? false
            : parsedItem.manage_stock,
      }));
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
      localStorage.removeItem(CART_STORAGE_KEY); // Очистить некорректные данные
      return [];
    }
  }
  return [];
};

export const useCartStore = defineStore("cart", () => {
  const items = ref(loadCartFromStorage());
  const appliedCoupon = ref(null);
  const couponValidationError = ref(null);
  const isApplyingCoupon = ref(false);

  // --- Getters ---
  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0);
  });
  const subtotal = computed(() => {
    // Цена ДО скидки
    return items.value.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);
  });

  const discountAmount = computed(() => {
    if (!appliedCoupon.value) return 0;
    const amount = parseFloat(appliedCoupon.value.amount) || 0;
    // Расчет скидки (упрощенно - только для fixed_cart и percent)
    if (appliedCoupon.value.discount_type === "percent") {
      // Важно: WC может считать процент по-разному (от цены до скидок и т.д.)
      // Это ПРОСТОЕ вычисление для отображения, финальный расчет делает WC
      return (subtotal.value * amount) / 100;
    } else if (appliedCoupon.value.discount_type === "fixed_cart") {
      // Убедимся, что скидка не больше подытога
      return Math.min(amount, subtotal.value);
    }
    // fixed_product сложнее, требует перебора товаров
    return 0; // По умолчанию или для других типов
  });

  const totalPrice = computed(() => {
    // Итоговая цена ПОСЛЕ скидки
    const total = subtotal.value - discountAmount.value;
    return Math.max(0, total).toFixed(2); // Не может быть меньше нуля
  });

  const isEmpty = computed(() => items.value.length === 0);

  // --- Actions ---
  const findItemIndex = (productId, variationId = null) => {
    return items.value.findIndex(
      (item) =>
        item.product_id === productId && item.variation_id === variationId
    );
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id || quantity <= 0) return;

    const productData = {
      product_id: product.id,
      name: product.name || "Unknown Product",
      price: product.sale_price || product.price || "0", // Приоритет sale_price
      image: product.images?.[0]?.src || null, // Берем первое изображение
      variation_id: product.variation_id || null, // Если это вариация
      stock_quantity: product.manage_stock ? product.stock_quantity : null, // null если не управляется
      manage_stock: product.manage_stock === true,
    };

    const itemIndex = findItemIndex(
      productData.product_id,
      productData.variation_id
    );

    if (itemIndex > -1) {
      // --- ИЗМЕНЕНИЕ: Проверка остатка перед увеличением ---
      const existingItem = items.value[itemIndex];
      const currentQuantity = existingItem.quantity;
      const maxAvailable = existingItem.manage_stock
        ? existingItem.stock_quantity
        : Infinity;

      if (maxAvailable === null || currentQuantity + quantity <= maxAvailable) {
        existingItem.quantity += quantity;
      } else {
        // Если при добавлении превышается остаток, добавляем только до максимума
        const canAdd = maxAvailable - currentQuantity;
        if (canAdd > 0) {
          existingItem.quantity = maxAvailable;
          console.warn(
            `Added only ${canAdd} item(s) of ${productData.name} due to stock limit.`
          );
          // Здесь можно показать уведомление пользователю
        } else {
          console.warn(
            `Cannot add more ${productData.name}. Stock limit reached.`
          );
          // Здесь можно показать уведомление пользователю
        }
        // Не добавляем больше, чем есть
      }
      // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    } else {
      // --- ИЗМЕНЕНИЕ: Проверка остатка перед добавлением нового ---
      const maxAvailable = productData.manage_stock
        ? productData.stock_quantity
        : Infinity;
      if (maxAvailable === null || quantity <= maxAvailable) {
        // Добавляем новый товар, если количество не превышает остаток
        items.value.push({ ...productData, quantity });
      } else {
        // Если сразу пытаются добавить больше, чем есть
        if (maxAvailable > 0) {
          // Добавляем максимально возможное количество
          items.value.push({ ...productData, quantity: maxAvailable });
          console.warn(
            `Added only ${maxAvailable} item(s) of ${productData.name} due to stock limit.`
          );
          // Здесь можно показать уведомление пользователю
        } else {
          console.warn(`Cannot add ${productData.name}. Out of stock.`);
          // Здесь можно показать уведомление пользователю
        }
      }
      // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    }
    console.log("Cart updated:", items.value);
  };

  const updateQuantity = (productId, quantity, variationId = null) => {
    const itemIndex = findItemIndex(productId, variationId);
    if (itemIndex > -1) {
      const item = items.value[itemIndex];
      const maxAvailable = item.manage_stock ? item.stock_quantity : Infinity;

      let newQuantity = quantity;
      if (newQuantity < 1) {
        newQuantity = 0; // Позволим установить 0 для удаления через этот метод
      } else if (maxAvailable !== null && newQuantity > maxAvailable) {
        newQuantity = maxAvailable; // Ограничиваем максимумом
        console.warn(
          `Quantity for ${item.name} limited to stock: ${maxAvailable}`
        );
        // Здесь можно показать уведомление
      }

      if (newQuantity === 0) {
        removeFromCart(productId, variationId);
      } else if (item.quantity !== newQuantity) {
        item.quantity = newQuantity;
      }
    }
  };

  const removeFromCart = (productId, variationId = null) => {
    const itemIndex = findItemIndex(productId, variationId);
    if (itemIndex > -1) {
      items.value.splice(itemIndex, 1);
    }
  };

  const clearCart = () => {
    items.value = [];
    appliedCoupon.value = null; // Сбрасываем купон при очистке корзины
    couponValidationError.value = null;
    // localStorage очистится через watch ниже
  };
  const applyCoupon = async (code) => {
    if (!code || isApplyingCoupon.value) return;
    isApplyingCoupon.value = true;
    couponValidationError.value = null;
    appliedCoupon.value = null; // Сбрасываем предыдущий

    try {
      const validationResult = await validateCoupon({ code }); // Вызываем API валидации
      if (validationResult?.valid) {
        appliedCoupon.value = {
          code: validationResult.code,
          amount: validationResult.amount,
          discount_type: validationResult.discount_type,
        };
        // Можно показать сообщение об успехе из validationResult.message
      } else {
        couponValidationError.value =
          validationResult?.message || "Неверный промокод.";
        // Можно показать ошибку
      }
    } catch (error) {
      couponValidationError.value =
        error.detail || error.message || "Ошибка при проверке промокода.";
      // Можно показать ошибку
    } finally {
      isApplyingCoupon.value = false;
    }
  };

  const removeCoupon = () => {
    appliedCoupon.value = null;
    couponValidationError.value = null;
  };

  // --- Persistence ---
  // Сохраняем корзину в localStorage при любом изменении
  watch(
    items,
    (newCartItems) => {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCartItems));
        // console.log("Cart items saved to localStorage");
      } catch (e) {
        console.error("Failed to save cart items to localStorage:", e);
      }
    },
    { deep: true }
  );

  // --- Опционально: Сохранение купона ---
  const COUPON_STORAGE_KEY = "kosynka_store_coupon";
  watch(appliedCoupon, (newCoupon) => {
    try {
      if (newCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(newCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save coupon:", e);
    }
  });
  // // Загрузка купона при инициализации
  try {
    const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
    if (storedCoupon) appliedCoupon.value = JSON.parse(storedCoupon);
  } catch (e) {
    console.error("Failed to load coupon:", e);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  }
  // --- Конец опционального сохранения купона ---
  return {
    items,
    totalItems,
    totalPrice,
    isEmpty,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    couponValidationError,
    isApplyingCoupon,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
  };
});
