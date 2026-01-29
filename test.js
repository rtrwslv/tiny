// Файл можно подключить, например, в chrome/content/mypanel.js
// или прямо через bootstrap.js расширения.

function checkInternet() {
  if (navigator.onLine) {
    console.log("✅ Интернет есть");
  } else {
    console.log("❌ Интернета нет");
  }
}

// Проверяем каждые 2 секунды
setInterval(checkInternet, 2000);

// Для немедленной проверки сразу при запуске
checkInternet();
