// frontend/src/services/index.js
import apiClient from './api';

/**
 * Получает список товаров.
 * @param {object} params Параметры запроса (page, per_page, category, search, etc.)
 * @param {object} config Дополнительные настройки Axios (например, { fullResponse: true })
 * @returns {Promise<any>} Массив товаров или полный ответ Axios
 */
export const fetchProducts = (params = {}, config = {}) => {
  // Правильно для GET: Объединяем params и другие опции config в один объект,
  // который передается ВТОРЫМ аргументом в apiClient.get
  return apiClient.get('/products/', { params, ...config });
};

/**
 * Получает детальную информацию о товаре по ID.
 * @param {number|string} productId ID товара
 * @param {object} config Дополнительные настройки Axios
 * @returns {Promise<object>} Объект товара или полный ответ Axios
 */
export const fetchProductById = (productId, config = {}) => {
  if (!productId) return Promise.reject(new Error("Product ID is required"));
  // Передаем config вторым аргументом
  return apiClient.get(`/products/${productId}`, config);
};

/**
 * Получает список категорий.
 * @param {object} params Параметры запроса (parent, hide_empty, etc.)
 * @param {object} config Дополнительные настройки Axios
 * @returns {Promise<Array>} Массив категорий или полный ответ Axios
 */
export const fetchCategories = (params = {}, config = {}) => {
  return apiClient.get('/categories/', { params, ...config }); // Передаем config вторым аргументом
};

/**
 * Валидирует промокод на бэкенде.
 * @param {object} payload Объект { code: string }
 * @returns {Promise<object>} Результат валидации { valid, code, message?, discount_type?, amount? }
 */
export const validateCoupon = (payload) => {
  return apiClient.post('/coupons/validate', payload);
};

/**
 * Создает новый заказ.
 * @param {object} payload Данные заказа { line_items: [...], customer_note?: '...' }
 * @param {string} initData Строка Telegram initData
 * @returns {Promise<object>} Объект созданного заказа (или полный ответ Axios, если interceptor вернет)
 */
export const createOrder = (payload, initData) => {
  if (!payload || !payload.line_items || payload.line_items.length === 0) {
      return Promise.reject(new Error("Order payload with line_items is required"));
  }
  if (!initData) {
      return Promise.reject(new Error("Telegram initData is required for creating order"));
  }
  //console.log("Sending initData (first 10, last 10):", initData.substring(0, 10) + "..." + initData.substring(initData.length - 10));

  const config = {
    headers: {
      'X-Telegram-Init-Data': initData,
    },
    // Если для createOrder нужен полный ответ (маловероятно), добавить здесь:
    // fullResponse: true
  };
  // Для POST: payload - второй аргумент, config - третий
  return apiClient.post('/orders/', payload, config );
};