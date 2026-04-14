function applyMessageIdFilter(win, allowedSet) {
  let doc = win.document;

  function filter() {
    let rows = doc.querySelectorAll("li, tr");

    for (let row of rows) {
      let hdr = row._message || row.messageHeader || row.msgHdr;

      let id =
        hdr?.messageId ||
        hdr?.messageId?.replace(/^<|>$/g, "").trim();

      if (!id) continue;

      row.hidden = !allowedSet.has(id);
    }
  }

  // первый проход
  filter();

  // поддержка lazy load / gloda render
  let obs = new MutationObserver(filter);
  obs.observe(doc.body, { childList: true, subtree: true });

  return obs;
}
