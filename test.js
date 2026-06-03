/* === Hover multi-select checkbox === */

/* Базовый чекбокс, скрыт по умолчанию */
.thread-listbox-row .multi-select-checkbox {
  display: none;
  position: absolute;
  inset-inline-start: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
  z-index: 10;
  cursor: pointer;
  accent-color: var(--color-blue-50);
  /* Поверх иконок отправителя */
  background: var(--layout-background-1);
  border-radius: 3px;
}

/* Показываем чекбокс при наведении на строку,
   ТОЛЬКО если есть активное открытое письмо */
:root[hasOpenMessage] .thread-listbox-row:hover .multi-select-checkbox,
/* Всегда показываем, если строка уже в multi-selection */
.thread-listbox-row[multiselected] .multi-select-checkbox {
  display: block;
}

/* Если строка выбрана — чекбокс checked-стиль через атрибут */
.thread-listbox-row[multiselected] .multi-select-checkbox {
  display: block;
  /* checked state управляется через JS .checked = true */
}

/* Сдвигаем контент строки чтобы не перекрывался с чекбоксом */
:root[hasOpenMessage] .thread-listbox-row:hover .thread-card,
.thread-listbox-row[multiselected] .thread-card {
  padding-inline-start: 24px;
}

/* Плавность появления */
.thread-listbox-row .multi-select-checkbox {
  opacity: 0;
  transition: opacity 0.1s ease;
}

:root[hasOpenMessage] .thread-listbox-row:hover .multi-select-checkbox,
.thread-listbox-row[multiselected] .multi-select-checkbox {
  opacity: 1;
}


// === Multi-select hover checkbox ===
// Инициализируется после threadTree.ready

const MultiSelectCheckbox = {
  /**
   * Инициализация: патчим rowFactory ThreadListbox,
   * чтобы каждая строка получала чекбокс-элемент.
   */
  init() {
    // Слушаем открытие сообщения — ставим флаг на :root
    window.addEventListener("messageURIChanged", this);
    window.addEventListener("folderURIChanged", this);

    // Патчим создание строк через наблюдение за мутациями в threadTree
    this._observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.classList.contains("thread-listbox-row")
          ) {
            this._injectCheckbox(node);
          }
        }
      }
    });

    this._observer.observe(threadTree, {
      childList: true,
      subtree: true,
    });

    // Инжектируем в уже существующие строки
    for (const row of threadTree.querySelectorAll(".thread-listbox-row")) {
      this._injectCheckbox(row);
    }

    // Глобальный клик-хендлер на threadTree
    threadTree.addEventListener("click", this);
    threadTree.addEventListener("keydown", this);
  },

  /**
   * Добавляет чекбокс в строку, если его ещё нет.
   * @param {HTMLElement} row
   */
  _injectCheckbox(row) {
    if (row.querySelector(".multi-select-checkbox")) {
      return; // уже есть
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "multi-select-checkbox";
    checkbox.setAttribute("aria-label",
      messengerBundle.GetStringFromName("multiSelectCheckboxLabel") ||
      "Select message"
    );
    // tabIndex=-1 — не попадает в tab-order, навигация через основной список
    checkbox.tabIndex = -1;

    row.style.position = "relative"; // нужно для absolute-позиционирования
    row.prepend(checkbox);

    // Синхронизируем состояние чекбокса с selection
    this._syncCheckbox(row);
  },

  /**
   * Синхронизирует visual-состояние чекбокса с gDBView selection.
   * @param {HTMLElement} row
   */
  _syncCheckbox(row) {
    const checkbox = row.querySelector(".multi-select-checkbox");
    if (!checkbox) {
      return;
    }

    const index = threadTree.getIndexOfRow(row);
    if (index === -1) {
      return;
    }

    const isSelected = gDBView?.selection?.isSelected(index) ?? false;
    checkbox.checked = isSelected;

    if (isSelected) {
      row.setAttribute("multiselected", "");
    } else {
      row.removeAttribute("multiselected");
    }
  },

  /**
   * Синхронизируем все видимые строки после изменения selection.
   */
  syncAllCheckboxes() {
    for (const row of threadTree.querySelectorAll(".thread-listbox-row")) {
      this._syncCheckbox(row);
    }
  },

  /**
   * Обработка события клика по чекбоксу.
   * Эмулирует Ctrl+Click — добавляет/убирает из selection
   * без сброса остальных выбранных элементов.
   * @param {HTMLElement} row
   * @param {HTMLInputElement} checkbox
   */
  _toggleSelection(row, checkbox) {
    const index = threadTree.getIndexOfRow(row);
    if (index === -1 || !gDBView?.selection) {
      return;
    }

    const selection = gDBView.selection;

    // toggleSelect — XPCOM nsIMsgDBViewCommandUpdater-совместимый метод,
    // аналог Ctrl+Click без сброса ранее выбранного
    // В Thunderbird 115+ это nsITreeSelection.toggleSelect(index)
    selection.toggleSelect(index);

    // После изменения selection — обновляем командный слой
    // (копируем то, что делает threadTree при Ctrl+Click)
    UpdateMailToolbar("multiSelectCheckbox");
    window.dispatchEvent(new CustomEvent("threadPaneSelectionChanged"));

    // Синхронизируем визуал всех строк
    this.syncAllCheckboxes();
  },

  handleEvent(event) {
    switch (event.type) {
      case "click": {
        const checkbox = event.target.closest(".multi-select-checkbox");
        if (!checkbox) {
          break;
        }

        // Останавливаем всплытие — иначе threadTree обработает клик
        // как обычный select и сбросит multiple-selection
        event.preventDefault();
        event.stopPropagation();

        const row = checkbox.closest(".thread-listbox-row");
        if (row) {
          this._toggleSelection(row, checkbox);
        }
        break;
      }

      case "messageURIChanged": {
        // Письмо открыто — ставим флаг на documentElement
        // CSS :root[hasOpenMessage] активирует показ чекбоксов при hover
        if (event.detail?.uri) {
          document.documentElement.setAttribute("hasOpenMessage", "");
        }
        break;
      }

      case "folderURIChanged": {
        // Смена папки — сбрасываем флаг и синхронизируем
        document.documentElement.removeAttribute("hasOpenMessage");
        this.syncAllCheckboxes();
        break;
      }

      case "keydown": {
        // Escape снимает всё multiple-selection и флаг
        if (event.key === "Escape" && event.target === threadTree) {
          document.documentElement.removeAttribute("hasOpenMessage");
          gDBView?.selection?.clearSelection();
          this.syncAllCheckboxes();
        }
        break;
      }
    }
  },

  destroy() {
    this._observer?.disconnect();
    threadTree.removeEventListener("click", this);
    threadTree.removeEventListener("keydown", this);
    window.removeEventListener("messageURIChanged", this);
    window.removeEventListener("folderURIChanged", this);
  },
};
