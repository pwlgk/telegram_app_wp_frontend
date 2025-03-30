// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//console.log('API Base URL:', API_BASE_URL);

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined. Please check your .env files.");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// --- ОСТАВЛЯЕМ ТОЛЬКО ОДИН ПЕРЕХВАТЧИК ОТВЕТА ---
apiClient.interceptors.response.use(
    (response) => {
      const url = response.config?.url;
      const fullResponseFlag = response.config?.fullResponse; // Проверяем флаг в конфиге ЗАПРОСА
  
      //console.log(`Interceptor received response for: ${url}`, { config: response.config, data: response.data });
      //console.log(`Interceptor: fullResponse flag for ${url} is:`, fullResponseFlag);
  
      // Если флаг ЯВНО === true, возвращаем весь response
      if (fullResponseFlag === true) {
        //console.log(`Interceptor returning FULL response for: ${url}`);
        return response;
      }
      // ВО ВСЕХ ОСТАЛЬНЫХ СЛУЧАЯХ возвращаем ТОЛЬКО response.data
      //console.log(`Interceptor returning response.DATA for: ${url}`);
      return response.data;
    },
  (error) => {
    // Обработка ошибок
    console.error('Axios response error in interceptor:', error.response || error.message);

    let errorMessage = 'Произошла ошибка сети или сервера.';
    let errorData = null; // Сохраним данные ошибки, если есть

    if (error.response) {
      // Запрос был сделан, и сервер ответил кодом состояния вне 2xx
      errorData = error.response.data;
      console.error('Error data:', errorData);
      console.error('Error status:', error.response.status);
      errorMessage = errorData?.detail || errorData?.message || `Ошибка сервера (статус ${error.response.status})`;
      if (error.response.status === 401) {
        errorMessage = 'Ошибка авторизации. Попробуйте перезапустить приложение.';
      } else if (error.response.status === 404) {
        errorMessage = 'Запрошенный ресурс не найден.';
      }
    } else if (error.request) {
      console.error('Error request:', error.request);
      errorMessage = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
    } else {
      console.error('Error message:', error.message);
      errorMessage = `Ошибка настройки запроса: ${error.message}`;
    }

    // Отклоняем промис. Передаем объект, похожий на структуру успешного ответа Axios,
    // но с данными ошибки, чтобы в `catch` можно было легко получить `err.detail` или `err.message`
    const customError = {
        isAxiosError: true, // Флаг, что это наша кастомная обертка ошибки Axios
        message: errorMessage,
        detail: errorData?.detail || errorMessage, // Берем detail, если есть
        status: error.response?.status || null,
        data: errorData, // Полные данные из ответа сервера об ошибке
        config: error.config,
        request: error.request,
    };
    return Promise.reject(customError); // Пробрасываем кастомный объект ошибки
  }
);



export default apiClient;