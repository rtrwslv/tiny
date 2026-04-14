function installMessageIdFilter(win, allowedSet) {
  let vw = win.gViewWrapper;
  if (!vw) return;

  vw._customFilterFunction = function(msgHdr) {
    if (!msgHdr) return false;

    let id =
      msgHdr.messageId ||
      msgHdr.getStringProperty?.("message-id");

    if (!id) return false;

    id = id.replace(/^<|>$/g, "").trim();

    return allowedSet.has(id);
  };

  // 🔥 триггер пересборки view
  vw.refresh();
}
