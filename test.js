function getAttachmentsByIndex(gDbView, index, callback) {
  let msgHdr = gDbView.getMsgHdrAt(index);
  if (!msgHdr) { callback([]); return; }

  let msgWindow = Cc["@mozilla.org/messenger/msgwindow;1"].createInstance(Ci.nsIMsgWindow);

  let cb = {
    receiveMessage: function(mimeMsg) {
      let attachments = [];
      if (mimeMsg && mimeMsg.allAttachments && mimeMsg.allAttachments.length) {
        for (let att of mimeMsg.allAttachments) {
          attachments.push({
            name: att.name,
            size: att.size,
            url: att.url,
            contentType: att.contentType
          });
        }
      }
      callback(attachments);
    }
  };

  MsgHdrToMimeMessage(msgHdr, msgWindow, false, cb);
}

// Использование
getAttachmentsByIndex(gDbView, 0, attachments => {
  console.log("Вложения:", attachments);
  attachments.forEach(a => console.log(a.name, a.size, a.url, a.contentType));
});
