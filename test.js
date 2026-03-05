/**
 * Выполняет поиск всех писем от указанного адреса отправителя
 * используя встроенный механизм поиска Thunderbird (SearchDialog / gloda).
 *
 * @param {string} emailAddress - адрес отправителя из поля From
 */
function SearchMailFromSender(emailAddress) {
  if (!emailAddress) {
    console.warn("SearchMailFromSender: email address is empty");
    return;
  }

  // Нормализуем адрес (убираем "Display Name <email>" если есть)
  const cleanAddress = extractEmailAddress(emailAddress);

  // Вариант А: через стандартный Search Dialog Thunderbird
  // Открывает диалог поиска с предзаполненным фильтром From
  SearchMailFromSenderViaDialog(cleanAddress);

  // Вариант Б (альтернатива): через Quick Filter Bar в текущей папке
  // SearchMailFromSenderViaQuickFilter(cleanAddress);
}

/**
 * Извлекает чистый email из строки вида "Name <email@example.com>"
 */
function extractEmailAddress(rawAddress) {
  const match = rawAddress.match(/<([^>]+)>/);
  return match ? match[1].trim() : rawAddress.trim();
}

/**
 * Вариант А: открывает стандартный диалог поиска Thunderbird
 * с предзаполненным условием From = address
 */
function SearchMailFromSenderViaDialog(emailAddress) {
  // Получаем текущий аккаунт/папку для контекста поиска
  const folder = gFolder; // текущая папка из 3pane
  
  // Создаём объект searchSession через XPCOM
  // Используем стандартный механизм открытия поиска
  const searchArgs = {
    searchFolders: null,      // null = искать во всех папках
    searchTerms: null,
  };

  // Открываем окно поиска через стандартный API TB
  window.openDialog(
    "chrome://messenger/content/SearchDialog.xhtml",
    "_blank",
    "chrome,resizable,status,centerscreen",
    { 
      folder: folder,
      // Предзаполняем условие поиска
      prefilledSearchTerms: buildFromSearchTerm(emailAddress)
    }
  );
}

/**
 * Строит объект searchTerm для условия: From содержит emailAddress
 * Использует nsIMsgSearchTerm через XPCOM
 */
function buildFromSearchTerm(emailAddress) {
  // Создаём search session
  const searchSession = Cc["@mozilla.org/messenger/searchSession;1"]
    .createInstance(Ci.nsIMsgSearchSession);
  
  // Создаём условие поиска: From == emailAddress
  const searchTerm = searchSession.createTerm();
  searchTerm.attrib = Ci.nsMsgSearchAttrib.Sender; // поле From/Sender
  searchTerm.op = Ci.nsMsgSearchOp.Contains;       // операция "содержит"
  
  const searchValue = searchTerm.value;
  searchValue.attrib = Ci.nsMsgSearchAttrib.Sender;
  searchValue.str = emailAddress;
  searchTerm.value = searchValue;
  searchTerm.booleanAnd = true;
  
  return [searchTerm];
}
