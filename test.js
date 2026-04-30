/* folderPane.css или userChrome.css */

/* Скрываем стандартный folder-icon и twisty у server-строки */
.folderPane-list > li.server > .container > .icon,
.folderPane-list > li.server > .container > .twisty {
  display: none;
}

/* Превращаем server-строку в plain header */
.folderPane-list > li.server > .container {
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--folder-pane-header-color, light-dark(#666, #aaa));
  padding-block: 12px 4px;
  padding-inline-start: 8px;
  cursor: default;
  pointer-events: none;       /* не кликабельна */
  background: transparent !important;
  border: none !important;
  /* убираем hover-эффект */
}

.folderPane-list > li.server > .container:hover {
  background: transparent !important;
}

/* Дочерние папки поднимаем на нулевой отступ */
.folderPane-list > li.server > ul {
  margin-inline-start: 0 !important;
  padding-inline-start: 0 !important;
}

/* Убираем indent у папок первого уровня */

// Патч: если родитель — server, depth дочерних = 0
set depth(value) {
  // Если это не сам server, и его прямой родитель — server-row,
  // отображаем на нулевом уровне
  const parentLi = this.closest("ul")?.closest("li.server");
  const isDirectChildOfServer = !!parentLi && value === 1;
  
  const visualDepth = isDirectChildOfServer ? 0 : value;
  this.dataset.depth = value;            // логический depth не трогаем
  this.style.setProperty("--depth", visualDepth); // только визуальный
}

// В методе, который строит row для сервера:
// Ищем FolderPane._addServerRow() или аналог

_buildServerRow(server) {
  const row = document.createElement("li", { is: "folder-tree-row" });
  row.classList.add("server");
  row.dataset.serverKey = server.key;
  
  // ← ДОБАВИТЬ: форсируем expanded и убираем twisty
  row.setAttribute("data-server-header", "true");
  row.classList.add("children");  // показываем дочерние сразу
  // НЕ добавляем collapsed класс
  
  return row;
}
.folderPane-list > li.server > ul > li > .container {
  padding-inline-start: 8px !important; /* как у root */
}
