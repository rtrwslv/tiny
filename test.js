const viewWrapper = win.gViewWrapper;

// Сохраняем оригинальный search
const originalSearch = viewWrapper.search;

// Подменяем с полным интерфейсом nsIMsgSearchSession
viewWrapper.search = {
  // ── методы которые вызывает DBViewWrapper ──
  dissociateView(dbView) {},
  associateView(dbView) {},
  
  // ── остальные методы интерфейса ──
  addSearchTerm() {},
  clearSearchTerms() {},
  searchTerms: [],
  
  // ── наш кастомный фильтр ──
  matches(msgHdr) {
    const id = msgHdr?.messageId?.replace(/^<|>$/g, "").trim();
    return allowedSet.has(id);
  },

  // ── проксируем всё остальное на оригинал ──
  ...( originalSearch ? {
    get wrappedJSObject() { return originalSearch; }
  } : {})
};

// Теперь refresh() не падает
viewWrapper.refresh();
