<template>
    <header class="app-header">
      <div class="header-content">
        <router-link to="/" class="header-logo">Kosynka Store</router-link> 
        <router-link :to="{ name: 'Cart' }" class="cart-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shopping-bag"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> 
          <span v-if="cartStore.totalItems > 0" class="cart-badge">
            {{ cartStore.totalItems }}
          </span>
        </router-link>
      </div>
    </header>
  </template>
  
  <script setup>
  import { useCartStore } from '@/store/cart';
  const cartStore = useCartStore();
  </script>
  
  <style scoped>
  .app-header {
    background-color: var(--color-background);
    padding: 0.5rem 1rem; /* Немного больше отступы */
    border-bottom: 1px solid var(--color-border);
    position: sticky; /* Делаем липкой */
    top: 0;
    z-index: 100;
    backdrop-filter: blur(5px); /* Легкое размытие фона под шапкой */
    -webkit-backdrop-filter: blur(5px);
    background-color: rgba(255, 255, 255, 0.8); /* Полупрозрачный фон для эффекта размытия */
  }
  body.theme-dark .app-header {
      background-color: rgba(28, 28, 29, 0.8); /* Для темной темы */
      border-bottom-color: var(--color-border);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1100px; /* Немного шире макс. ширина */
    margin: 0 auto;
  }
  
  .header-logo {
    font-size: 1.3em;
    font-weight: 700; /* Жирнее */
    color: var(--color-text); /* Основной цвет текста */
    text-decoration: none;
    letter-spacing: 0.5px; /* Небольшой разрядка */
  }
  
  .cart-button {
    position: relative;
    color: var(--color-text);
    text-decoration: none;
    padding: 8px; /* Увеличиваем область клика */
    display: flex; /* Для позиционирования иконки */
    align-items: center;
    justify-content: center;
  }
  .cart-button svg {
      stroke: currentColor; /* Иконка наследует цвет текста */
  }
  
  .cart-badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: var(--color-accent); /* Акцентный */
    color: var(--color-accent-text);
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.65em;
    font-weight: 600;
    line-height: 1;
    /* border: 2px solid var(--color-background); */ /* Можно убрать или сделать тоньше */
  }
  </style>