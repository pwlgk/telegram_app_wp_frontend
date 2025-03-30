<template>
    <router-link :to="{ name: 'Product', params: { id: product.id } }" class="product-card">
      <div class="product-card__image-wrapper">
        <img :src="imageUrl" :alt="product.name" class="product-card__image" @error="onImageError" loading="lazy"/>
        <span v-if="product.on_sale" class="product-card__sale-badge">Sale</span>
      </div>
      <div class="product-card__info">
        <h3 class="product-card__name">{{ product.name }}</h3>
        <div class="product-card__price">
          <span v-if="product.on_sale && product.sale_price" class="product-card__sale-price">
            {{ formatPrice(product.sale_price) }} ₽
          </span>
          <span :class="{ 'product-card__regular-price--crossed': product.on_sale && product.sale_price }" class="product-card__regular-price">
             {{ formatPrice(product.regular_price) }} ₽
          </span>
        </div>
      </div>
    </router-link>
  </template>
  
  
  <script setup>
  import { computed } from 'vue';
  // import { useCartStore } from '@/store/cart'; // Если кнопка "В корзину" будет здесь
  
  const props = defineProps({ product: { type: Object, required: true } });
  //console.log('ProductCard props:', props.product); 
  
  // Placeholder изображение, если у товара нет картинки или она не загрузилась
  const placeholderImage = '/placeholder.png'; // Положите placeholder.png в папку public/
  
  // Вычисляемое свойство для URL изображения с обработкой отсутствия
  const imageUrl = computed(() => {
    return props.product.images && props.product.images.length > 0
      ? props.product.images[0].src
      : placeholderImage;
  });
  
  // Обработчик ошибки загрузки изображения
  const onImageError = (event) => {
    event.target.src = placeholderImage;
  };
  
  // Функция для форматирования цены (простая)
  const formatPrice = (price) => {
    const number = parseFloat(price);
    return isNaN(number) ? '?' : number.toLocaleString('ru-RU'); // Формат для России
  };
  
  // Логика добавления в корзину (если кнопка здесь)
  // const cartStore = useCartStore();
  // const addToCartHandler = () => {
  //   cartStore.addToCart(props.product, 1);
  //   // Можно показать уведомление
  //   console.log(`${props.product.name} добавлен в корзину`);
  // };

  </script>
  
  <style scoped>
.product-card {
  display: block;
  background-color: var(--color-background); /* Чистый фон */
  border-radius: var(--border-radius-large); /* Более скругленные углы */
  overflow: hidden;
  text-decoration: none;
  color: var(--color-text);
  box-shadow: var(--shadow-soft); /* Начальная мягкая тень */
  transition: box-shadow var(--transition-speed) ease-out, transform var(--transition-speed) ease-out; /* Плавный переход */
  border: 1px solid var(--color-border); /* Тонкая граница */
}

.product-card:hover {
  box-shadow: var(--shadow-medium); /* Увеличенная тень при наведении */
  transform: translateY(-3px); /* Легкий подъем */
}

.product-card__image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* Соотношение сторон 1:1 */
  background-color: var(--color-background-secondary);
}

.product-card__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-card__sale-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--color-sale);
  color: white;
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  font-size: 0.75em;
  font-weight: 500;
  text-transform: uppercase; /* Заглавные буквы */
  letter-spacing: 0.5px;
}

.product-card__info {
  padding: 0.8rem 1rem 1rem 1rem; /* Отступы внутри карточки */
}

.product-card__name {
  font-size: 1em;
  font-weight: 500; /* Не слишком жирный */
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.4em; /* Подбираем высоту под 2 строки */
  line-height: 1.2em;
}

.product-card__price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.product-card__sale-price {
  font-size: 1em;
  font-weight: 600; /* Акцентная цена жирнее */
  color: var(--color-text);
}

.product-card__regular-price {
  font-size: 0.85em;
  color: var(--color-text-muted);
}

.product-card__regular-price--crossed {
  text-decoration: line-through;
}
</style>