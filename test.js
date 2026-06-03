.thread-listbox-row {
  position: relative;
}

.thread-listbox-row .multi-select-checkbox {
  position: absolute;
  inset-inline-start: 4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s;
  z-index: 10;
}

/* Показываем при наведении и если уже выбрано */
.thread-listbox-row:hover .multi-select-checkbox,
.thread-listbox-row[multiselected] .multi-select-checkbox {
  opacity: 1;
  pointer-events: auto;
}

threadTree.addEventListener("click", e => {
  const cb = e.target.closest(".multi-select-checkbox");
  if (!cb) return;

  e.preventDefault();
  e.stopPropagation();

  const row = cb.closest(".thread-listbox-row");
  const index = threadTree.getIndexOfRow(row);

  gDBView.selection.toggleSelect(index);

  // Синхронизация всех видимых строк
  for (const r of threadTree.querySelectorAll(".thread-listbox-row")) {
    const i = threadTree.getIndexOfRow(r);
    const selected = gDBView.selection.isSelected(i);
    r.toggleAttribute("multiselected", selected);
    r.querySelector(".multi-select-checkbox").checked = selected;
  }
});

new MutationObserver(mutations => {
  for (const node of mutations.flatMap(m => [...m.addedNodes])) {
    if (node.classList?.contains("thread-listbox-row")) {
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "multi-select-checkbox";
      cb.tabIndex = -1;
      node.prepend(cb);
    }
  }
}).observe(threadTree, { childList: true, subtree: true });
