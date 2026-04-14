/**
 * Фильтрует threadTree так, чтобы показывались только сообщения
 * из allowedIds. Остальные получают display:none через view-фильтр.
 *
 * @param {string[]} allowedIds - массив messageId для отображения
 */
function filterThreadTreeByMessageIds(allowedIds) {
  const tabmail = document.getElementById("tabmail");
  const tabInfo = tabmail?.currentTabInfo;
  const win = tabInfo?.chromeBrowser?.contentWindow;

  if (!win) {
    console.error("Не удалось получить окно вкладки");
    return;
  }

  const view = win.gDBView;
  const threadTree = win.threadTree;

  if (!view || !threadTree) {
    console.error("gDBView или threadTree недоступны");
    return;
  }

  // Нормализуем allowedIds в Set для быстрого lookup O(1)
  const allowedSet = new Set(
    allowedIds.map(id => id.replace(/^<|>$/g, "").trim())
  );

  // ── Способ 1: через nsIMsgSearchSession (нативный фильтр view) ──
  applyViewSearchFilter(win, view, threadTree, allowedSet);
}

function applyViewSearchFilter(win, view, threadTree, allowedSet) {
  const { MailServices } = ChromeUtils.importESModule(
    "resource:///modules/MailServices.sys.mjs"
  );

  // Создаём сессию поиска
  const searchSession = Cc["@mozilla.org/messenger/searchSession;1"]
    .createInstance(Ci.nsIMsgSearchSession);

  // Добавляем кастомный term через JS-реализацию nsIMsgSearchTerm
  // В TB145 можно использовать view.setJSCustomFilter (если доступен)
  // Либо патчим viewWrapper напрямую

  const viewWrapper = win.gViewWrapper;

  if (!viewWrapper) {
    console.warn("gViewWrapper недоступен, используем DOM-подход");
    applyDOMFilter(threadTree, view, allowedSet);
    return;
  }

  // Сохраняем оригинальный фильтр если есть
  viewWrapper._customFilter_original = viewWrapper._customFilter ?? null;

  // Устанавливаем кастомный фильтр
  viewWrapper.search = {
    ...viewWrapper.search,

    // Этот callback вызывается для каждой строки view
    matches(msgHdr) {
      const id = msgHdr?.messageId?.replace(/^<|>$/g, "").trim();
      return allowedSet.has(id);
    }
  };

  // Принудительно перестраиваем view
  viewWrapper.refresh();
  threadTree.invalidate();
}
