// В массиве COLUMNS, после колонки "flagged"
{
  id: "replied",
  l10n: {
    header: "threadpane-column-header-replied",
    menuitem: "threadpane-column-menuitem-replied",
  },
  icon: true,
  resizable: false,
  sortable: false,
  hidden: false,
  ordinal: 5,
  picker: true,
},

// В методе getCellProperties или аналоге в TB145 — TreeView
getCellProperties(row, col) {
  const msgHdr = this._getMessageAtRow(row);
  if (!msgHdr) return "";

  const props = [];

  if (col.id === "replied") {
    const flags = msgHdr.flags;
    // nsMsgMessageFlags.Answered = 0x200
    if (flags & 0x200) {
      props.push("replied");
    }
    // Forwarded = 0x1000
    if (flags & 0x1000) {
      props.push("forwarded");
    }
  }

  return props.join(" ");
},

/* Иконка ответа в колонке */
#replied treecell[properties~="replied"] .tree-cell-icon,
.thread-card[data-replied="true"] .replied-indicator {
  content: url("chrome://messenger/skin/icons/replied.svg");
  display: inline-block;
  width: 16px;
  height: 16px;
}

.replied-indicator {
  display: none;
}

[data-replied="true"] .replied-indicator {
  display: inline-block;
}
