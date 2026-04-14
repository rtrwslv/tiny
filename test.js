function installMessageIdFilter(win, set) {
  allowedSet = set;

  let dbView = win.gDBView;
  if (!dbView) return;

  // сохраняем оригинальный getter hdr
  let origGetMsgHdr = dbView.getMsgHdrForViewIndex?.bind(dbView);

  if (!origGetMsgHdr) return;

  dbView.getMsgHdrForViewIndex = function(index) {
    let hdr = origGetMsgHdr(index);

    if (!hdr) return null;

    let id = hdr.messageId?.replace(/^<|>$/g, "").trim();

    if (!allowedSet.has(id)) {
      return null; // ❗ полностью скрываем письмо
    }

    return hdr;
  };

  dbView.refreshView();
}
