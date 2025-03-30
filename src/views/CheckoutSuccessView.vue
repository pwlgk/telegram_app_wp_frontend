<template>
  <div class="checkout-success-view">
    <div class="success-animation">
      <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
        <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>

    <h1 class="success-title">Заказ успешно оформлен!</h1>
    <p class="success-message">Спасибо за ваш заказ. Наш менеджер скоро свяжется с вами в Telegram для уточнения деталей.</p>

    <div class="button-container">
      <button @click="goHome" class="home-button">Вернуться в каталог</button>
      <!-- <button @click="closeApp" class="close-button">Закрыть</button> -->
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue'; // Импортируем onMounted
// import { closeApp } from '@/utils/telegram';

const router = useRouter();

const goHome = () => {
  router.push('/');
};

// Добавляем класс для запуска анимации после монтирования
onMounted(() => {
  const viewElement = document.querySelector('.checkout-success-view');
  if (viewElement) {
    // Небольшая задержка перед добавлением класса для видимости анимации
    setTimeout(() => {
      viewElement.classList.add('loaded');
    }, 100); // 100ms задержка
  }
});

</script>

<style scoped>
.checkout-success-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px); /* Вычитаем примерную высоту шапки, чтобы центрировать */
  padding: 2rem;
  text-align: center;
  opacity: 0; /* Начальная прозрачность для анимации появления */
  transform: translateY(20px); /* Начальный сдвиг для анимации */
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  overflow: hidden; /* Предотвратить выход анимации за пределы */
}

/* Класс для запуска анимации */
.checkout-success-view.loaded {
  opacity: 1;
  transform: translateY(0);
}

/* Анимация галочки SVG */
.success-animation {
  margin-bottom: 1.5rem;
}

.checkmark {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  stroke-width: 3; /* Толщина линий */
  stroke: var(--color-success, #5CB85C); /* Цвет галочки */
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px var(--color-success, #5CB85C);
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
  /* Заливка фона круга после анимации */
}

.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3; /* Или ваша толщина */
  stroke-miterlimit: 10;
  stroke: var(--color-success, #5CB85C);
  fill: none;
  /* Анимация рисования круга */
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark__check {
  transform-origin: 50% 50%; /* Центр трансформации */
  stroke-dasharray: 48;   /* Примерная длина пути галочки (можно подобрать точнее) */
  stroke-dashoffset: 48;   /* Начинаем с невидимой линии */
  stroke-width: 3; /* Та же толщина, что и у круга */
  stroke: var(--color-background); /* Цвет галочки на фоне круга (обычно белый или цвет фона) */
  fill: none;
  /* Анимация рисования галочки - ЗАПУСКАЕТСЯ ПОЗЖЕ КРУГА */
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; /* 0.8s задержка */
}

/* Ключевые кадры анимации */
@keyframes stroke {
  100% { stroke-dashoffset: 0; } /* Линия полностью нарисована */
}
@keyframes scale {
  0%, 100% { transform: none; }
  50% { transform: scale3d(1.1, 1.1, 1); } /* Легкое увеличение */
}
@keyframes fill {
  100% {
      /* Заливаем круг цветом УСПЕХА */
      box-shadow: inset 0px 0px 0px 40px var(--color-success, #5CB85C);
      /* Цвет линии круга можно сделать прозрачным после заливки, если нужно */
      /* stroke: transparent; */
  }
}

.success-title {
  /* Используем акцентный цвет или цвет успеха */
  color: var(--color-accent, #916A52);
  margin-bottom: 0.8rem;
  font-size: 1.8em;
  font-weight: 700;
  /* Анимация появления заголовка (с задержкой) */
  opacity: 0;
  transform: translateY(10px);
  animation: fade-in-up 0.6s ease-out 0.8s forwards;
}

.success-message {
  color: var(--color-text-muted);
  font-size: 1.05em;
  line-height: 1.6;
  max-width: 450px; /* Ограничиваем ширину текста */
  margin-bottom: 2rem;
   /* Анимация появления текста (с большей задержкой) */
  opacity: 0;
  transform: translateY(10px);
  animation: fade-in-up 0.6s ease-out 1.0s forwards;
}

.button-container {
  display: flex;
  gap: 1rem;
  /* Анимация появления кнопок */
  opacity: 0;
  transform: translateY(10px);
  animation: fade-in-up 0.6s ease-out 1.2s forwards;
}

/* Анимация появления снизу */
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}



.close-button {
  /* Опциональные стили для кнопки "Закрыть" */
  background-color: var(--color-background-secondary);
  color: var(--color-text-muted);
}
.close-button:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}
</style>