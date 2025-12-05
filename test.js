function getAttachmentsFromDBViewIndex(index) {
  const hdr = gDBView.getMsgHdrAt(index);
  if (!hdr) return [];

  const messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
  const msgUri = hdr.folder.getUriForMsg(hdr);

  const atts = [];
  let done = false;

  messenger.getAttachments(msgUri, {
    onAttachment(contentType, url, displayName, uri, isExternal) {
      atts.push({ contentType, url, name: displayName, uri, isExternal });
    },
    onEndAllAttachments() {
      done = true;
    }
  });

  const thr = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
  while (!done) thr.processNextEvent(true);

  return atts;
}
