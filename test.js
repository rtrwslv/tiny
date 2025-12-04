(function() {
  // Ищем DOM списка писем
  const msgList = document.getElementById("threadTree");
  if (!msgList) {
    console.warn("QuickFilter: threadTree not found");
    return;
  }

  // Функция применения фильтра
  function applyQuickFilter() {
    if (!window.quickFilterBar) return;
    try {
      window.quickFilterBar.applyFilter(true);
      // console.log("QuickFilter applied automatically");
    } catch (e) {
      console.error("QuickFilter auto-apply failed", e);
    }
  }

  // Настраиваем MutationObserver для списка писем
  const observer = new MutationObserver(mutations => {
    // Любое изменение childList → запускаем фильтр
    applyQuickFilter();
  });

  observer.observe(msgList, {
    childList: true, // отслеживаем добавление/удаление сообщений
    subtree: true    // отслеживаем любые изменения внутри
  });

  console.log("QuickFilter: MutationObserver attached to threadTree");

  // Первый запуск при инициализации
  setTimeout(applyQuickFilter, 100);
})();
