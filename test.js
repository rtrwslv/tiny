const msgList = document.getElementById("threadTree");
if (!msgList) {
  console.warn("QuickFilter: threadTree not found");
} else {
  function applyAttachmentFilterFromTerm() {
    const view = gFolderDisplay.view;
    if (!view) return;

    const filterValue = window.quickFilterBar?.getFilterValue
      ? window.quickFilterBar.getFilterValue("attachmentFilter")?.text
      : "";

    if (!filterValue) {
      view.showOnlyMessages(null);
      return;
    }

    const matchedKeys = [];
    const enumerator = view.dbView.enumerateMessages();
    while (enumerator.hasMoreElements()) {
      const hdr = enumerator.getNext().QueryInterface(Ci.nsIMsgDBHdr);
      const attachments = hdr.getAttachments ? hdr.getAttachments() : [];
      if (attachments.some(att => att.name?.toLowerCase().includes(filterValue.toLowerCase()))) {
        matchedKeys.push(hdr.messageKey);
      }
    }

    view.showOnlyMessages(matchedKeys);
  }

  const observer = new MutationObserver(() => {
    if (window.quickFilterBar?.updateSearch) window.quickFilterBar.updateSearch();
    applyAttachmentFilterFromTerm();
  });

  observer.observe(msgList, { childList: true, subtree: true });

  setTimeout(() => {
    if (window.quickFilterBar?.updateSearch) window.quickFilterBar.updateSearch();
    applyAttachmentFilterFromTerm();
  }, 100);
}
