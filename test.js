// ================================================================
// SEARCH MAIL FROM SENDER
// Добавить в объект mailContextModule в файле:
//   comm/mail/base/content/mailContext.js
//
// В существующий метод onShowEmailAddressPopup() добавить вызов:
//   this._captureContextEmail(event);
//   this._updateSearchItemLabel();
//
// В существующий метод onHideEmailAddressPopup() добавить:
//   this._senderCtx = null;
// ================================================================

// ----------------------------------------------------------------
// Хранилище: данные адресата из текущего клика
// ----------------------------------------------------------------

/** @type {{ email: string, displayName: string, fullAddress: string } | null} */
_senderCtx: null,

// ----------------------------------------------------------------
// Захват адреса из кликнутого mail-address-pill
// ----------------------------------------------------------------

/**
 * Захватывает данные адресата из события onpopupshowing.
 * Пробивается сквозь shadow DOM через composedPath().
 * Вызывать в начале onShowEmailAddressPopup(event).
 *
 * @param {Event} event — popupshowing event от emailAddressPopup
 */
_captureContextEmail(event) {
  this._senderCtx = null;

  // composedPath()[0] — единственный надёжный способ получить
  // реальный источник клика сквозь shadow DOM (mail-address-pill TB 128+/145)
  const path = event.composedPath?.();
  const triggerNode = (path?.length > 0 ? path[0] : null)
    ?? event.explicitOriginalTarget
    ?? event.target
    ?? document.popupNode;

  if (!triggerNode) return;

  const pill = this._findAddressPill(triggerNode);
  if (!pill) return;

  const ctx = this._extractEmailFromPill(pill);
  if (ctx.email) {
    this._senderCtx = ctx;
  }
},

/**
 * Ищет ближайший элемент mail-address-pill относительно node.
 * Обрабатывает случай клика внутри shadow root самой пилюли.
 *
 * @param {Node} node
 * @returns {Element|null}
 */
_findAddressPill(node) {
  // Если пришёл текстовый узел — берём его родителя
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentElement;
  }
  if (!node) return null;

  // Прямое совпадение
  if (node.tagName?.toLowerCase() === "mail-address-pill") {
    return node;
  }

  // Клик был внутри shadow root — поднимаемся к host-элементу
  const root = node.getRootNode?.();
  if (root instanceof ShadowRoot) {
    const host = root.host;
    if (host?.tagName?.toLowerCase() === "mail-address-pill") {
      return host;
    }
  }

  // Стандартный поиск вверх по DOM
  return node.closest?.("mail-address-pill") ?? null;
},

/**
 * Извлекает { email, displayName, fullAddress } из pill-элемента.
 * Три уровня fallback: JS-свойства → data-атрибуты → парсинг textContent.
 *
 * @param {Element} pill
 * @returns {{ email: string, displayName: string, fullAddress: string }}
 */
_extractEmailFromPill(pill) {
  // Уровень 1: JS-свойства custom element (основной путь TB 128+/145)
  if (pill.emailAddress !== undefined) {
    const email       = (pill.emailAddress  ?? "").trim().toLowerCase();
    const displayName = (pill.displayName   ?? "").trim();
    const fullAddress = (pill.fullAddress   ?? (displayName
      ? `${displayName} <${email}>`
      : email)).trim();
    return { email, displayName, fullAddress };
  }

  // Уровень 2: data-атрибуты
  const attrEmail = pill.getAttribute("data-email-address")
                 ?? pill.getAttribute("data-email");
  if (attrEmail) {
    const attrName    = (pill.getAttribute("data-display-name") ?? "").trim();
    const email       = attrEmail.trim().toLowerCase();
    const fullAddress = attrName ? `${attrName} <${email}>` : email;
    return { email, displayName: attrName, fullAddress };
  }

  // Уровень 3: парсим текстовый контент
  return this._parseEmailString(pill.textContent?.trim() ?? "");
},

/**
 * Парсит строку адреса:
 *   "John Doe <john@example.com>" → { email, displayName, fullAddress }
 *   "john@example.com"            → { email: "john@...", displayName: "" }
 *
 * @param {string} raw
 * @returns {{ email: string, displayName: string, fullAddress: string }}
 */
_parseEmailString(raw) {
  // Формат: "Display Name <email@host.tld>"
  const angleMatch = raw.match(/^(.+?)\s*<([^\s<>@]+@[^\s<>@]+\.[a-zA-Z]{2,})>\s*$/);
  if (angleMatch) {
    const displayName = angleMatch[1].trim().replace(/^["']|["']$/g, "");
    const email       = angleMatch[2].trim().toLowerCase();
    return { email, displayName, fullAddress: raw.trim() };
  }

  // Просто email без имени
  const emailMatch = raw.match(/[^\s<>@,;]+@[^\s<>@,;]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    const email = emailMatch[0].toLowerCase();
    return { email, displayName: "", fullAddress: email };
  }

  return { email: "", displayName: "", fullAddress: "" };
},

// ----------------------------------------------------------------
// Управление видимостью и label пункта меню
// ----------------------------------------------------------------

/**
 * Показывает/скрывает пункт меню и обновляет его label.
 * Вызывать после _captureContextEmail() в onShowEmailAddressPopup().
 */
_updateSearchItemLabel() {
  const menuItem  = document.getElementById("searchMailFromSender");
  const separator = document.getElementById("searchFromSenderSeparator");

  if (!menuItem) return;

  const ctx = this._senderCtx;
  const visible = !!(ctx?.email);

  menuItem.hidden  = !visible;
  if (separator) separator.hidden = !visible;

  if (visible) {
    const label = ctx.displayName
      ? `Найти письма от: ${ctx.displayName}`
      : `Найти письма от: ${ctx.email}`;
    menuItem.setAttribute("label", label);
  }
},

// ----------------------------------------------------------------
// Поиск — главный метод и три стратегии
// ----------------------------------------------------------------

/**
 * Запускает поиск всех писем от захваченного адресата.
 * Стратегии применяются каскадно: SearchDialog → QuickFilter → Gloda.
 * Вызывается из oncommand пункта меню searchMailFromSender.
 */
searchMailFromSender() {
  const ctx = this._senderCtx;
  if (!ctx?.email) {
    console.error("[searchMailFromSender] No sender context — popup was closed?");
    return;
  }

  for (const [name, fn] of [
    ["SearchDialog",  () => this._searchViaDialog(ctx)],
    ["QuickFilter",   () => this._searchViaQuickFilter(ctx)],
    ["GlodaFacet",    () => this._searchViaGloda(ctx)],
  ]) {
    try {
      fn();
      console.debug(`[searchMailFromSender] Success via ${name}`);
      return;
    } catch (e) {
      console.warn(`[searchMailFromSender] ${name} failed:`, e.message);
    }
  }

  window.alert(`Не удалось открыть поиск для: ${ctx.email}`);
},

/**
 * Стратегия 1: стандартный SearchDialog Thunderbird.
 * Открывает окно поиска с предзаполненным условием Sender Contains email.
 *
 * @param {{ email: string, displayName: string }} ctx
 */
_searchViaDialog(ctx) {
  const searchSession = Cc["@mozilla.org/messenger/searchSession;1"]
    .createInstance(Ci.nsIMsgSearchSession);

  // Условие: Sender Contains <email>
  const term     = searchSession.createTerm();
  term.attrib    = Ci.nsMsgSearchAttrib.Sender;
  term.op        = Ci.nsMsgSearchOp.Contains;
  term.booleanAnd = false;

  const val    = term.value;
  val.attrib   = Ci.nsMsgSearchAttrib.Sender;
  val.str      = ctx.email;
  term.value   = val;

  window.openDialog(
    "chrome://messenger/content/SearchDialog.xhtml",
    "SearchFromSender",
    "chrome,resizable,status,centerscreen,minimizable",
    {
      folder:      this._getActiveFolder(),
      searchTerms: [term],
    }
  );
},

/**
 * Стратегия 2: Quick Filter Bar в текущей папке.
 * Активирует фильтр по отправителю без открытия нового окна.
 *
 * @param {{ email: string }} ctx
 */
_searchViaQuickFilter(ctx) {
  const filterBar = document.getElementById("quick-filter-bar");
  if (!filterBar) throw new Error("quick-filter-bar not found");

  // Убеждаемся что бар виден
  filterBar.hidden    = false;
  filterBar.collapsed = false;

  // Ищем поле ввода по возможным id в разных версиях TB
  const textbox = document.getElementById("qfb-qs-textbox")
    ?? filterBar.querySelector("input[type='search']")
    ?? filterBar.querySelector(".quick-filter-bar-textbox");

  if (!textbox) throw new Error("Quick filter textbox not found");

  // Сначала сбрасываем фильтр
  textbox.value = "";
  textbox.dispatchEvent(new Event("input", { bubbles: true }));

  // Небольшая пауза чтобы сброс применился, затем устанавливаем значение
  window.setTimeout(() => {
    textbox.value = ctx.email;

    textbox.dispatchEvent(new Event("input",  { bubbles: true }));
    textbox.dispatchEvent(new Event("change", { bubbles: true }));

    // Активируем фильтрацию по полю Sender/From если кнопка есть
    const senderBtn = document.getElementById("qfb-qs-sender")
      ?? document.querySelector("[data-filter-type='sender']");
    if (senderBtn && !senderBtn.hasAttribute("pressed")) {
      senderBtn.setAttribute("pressed", "true");
      senderBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }

    textbox.focus();
    textbox.select();
  }, 50);
},

/**
 * Стратегия 3: Gloda full-text поиск (открывает вкладку с результатами).
 * Используется как последний fallback.
 *
 * @param {{ email: string, displayName: string }} ctx
 */
_searchViaGloda(ctx) {
  const { GlodaMsgSearcher } = ChromeUtils.importESModule(
    "resource:///modules/GlodaMsgSearcher.sys.mjs"
  );

  const tabmail = document.getElementById("tabmail");
  if (!tabmail) throw new Error("tabmail not found");

  // Используем displayName + email для более точного Gloda-поиска
  const query = ctx.displayName
    ? `${ctx.displayName} ${ctx.email}`
    : ctx.email;

  tabmail.openTab("glodaFacet", {
    searcher: new GlodaMsgSearcher(null, query),
  });
},

// ----------------------------------------------------------------
// Вспомогательный метод: текущая активная папка
// ----------------------------------------------------------------

/**
 * Возвращает текущую активную папку для контекста поиска.
 * Приоритет: tabmail → gFolder → первый Inbox.
 *
 * @returns {nsIMsgFolder|null}
 */
_getActiveFolder() {
  // Способ 1: через tabmail (основной путь в TB 115+/145)
  const tabmail = document.getElementById("tabmail");
  if (tabmail?.currentTabInfo?.folder) {
    return tabmail.currentTabInfo.folder;
  }

  // Способ 2: gFolder из about:3pane контекста
  try {
    if (typeof gFolder !== "undefined" && gFolder) {
      return gFolder;
    }
  } catch (_) {}

  // Способ 3: первый Inbox через MailServices
  try {
    const { MailServices } = ChromeUtils.importESModule(
      "resource:///modules/MailServices.sys.mjs"
    );
    for (const account of MailServices.accounts.accounts) {
      const inbox = account.incomingServer?.rootFolder
        ?.getFolderWithFlags(Ci.nsMsgFolderFlags.Inbox);
      if (inbox) return inbox;
    }
  } catch (e) {
    console.warn("[searchMailFromSender] _getActiveFolder fallback failed:", e);
  }

  return null;
},
