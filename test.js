<!-- Вставляем в левую панель рядом с иконкой настроек -->
<div id="connectionIndicator" class="status-icon"></div>

/* Базовый стиль иконки */
.status-icon {
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  transition: background-image 0.3s ease-in-out; /* плавное переключение */
}

/* Состояния сети через переменные */
:root {
  --icon-sb-has-connection: url("chrome://myextension/skin/online.svg");
  --icon-sb-lost-connection: url("chrome://myextension/skin/offline.svg");
}

/* Классы для JS */
.status-online {
  background-image: var(--icon-sb-has-connection);
}

.status-offline {
  background-image: var(--icon-sb-lost-connection);
}

// chrome/content/connectionIndicator.js

function updateConnectionIndicator() {
  const indicator = document.getElementById("connectionIndicator");
  if (!indicator) return;

  if (navigator.onLine) {
    // Интернет есть
    indicator.classList.add("status-online");
    indicator.classList.remove("status-offline");
    console.log("✅ Интернет есть");
  } else {
    // Интернета нет
    indicator.classList.add("status-offline");
    indicator.classList.remove("status-online");
    console.log("❌ Интернета нет");
  }
}

// Проверяем каждые 2 секунды
setInterval(updateConnectionIndicator, 2000);

// Немедленная проверка сразу при запуске
updateConnectionIndicator();
