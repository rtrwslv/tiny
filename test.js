async function getAttachmentsFromDBViewIndex(index) {
  const hdr = gDBView.getMsgHdrAt(index);
  if (!hdr) return [];
  const msgUri = hdr.folder.getUriForMsg(hdr);
  if (typeof MsgHdrToMimeMessage === "function") {
    return new Promise(resolve => {
      MsgHdrToMimeMessage(hdr, mimeMsg => {
        const out = [];
        (function walk(node) {
          if (!node) return;
          if (node.isAttachment || node.filename) {
            out.push({
              name: node.filename || node.displayName || node.name || "",
              contentType: node.contentType || node.type || "",
              part: node.part || "",
              url: node.url || ""
            });
          }
          if (node.parts && node.parts.length) for (const p of node.parts) walk(p);
        })(mimeMsg);
        resolve(out);
      });
    });
  }
  return new Promise(resolve => {
    try {
      const messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
      const list = [];
      messenger.getAttachments(msgUri, {
        onAttachment(contentType, url, displayName, uri, isExternal) {
          list.push({ contentType, url, name: displayName, uri, isExternal });
        },
        onEndAllAttachments() {
          resolve(list);
        }
      });
    } catch (e) {
      resolve([]);
    }
  });
}

(async () => {
  const attachments = await getAttachmentsFromDBViewIndex(3);
  console.log(attachments);
})();

