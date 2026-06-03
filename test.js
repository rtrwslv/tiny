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
