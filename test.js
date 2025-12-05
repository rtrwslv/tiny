function getAttachmentsByIndex(gDbView, index, callback) {
  if (!gDbView || typeof index !== "number") { callback([]); return; }
  try {
    let msgHdr = gDbView.getMsgHdrAt(index);
    if (!msgHdr) { callback([]); return; }
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
    MsgHdrToMimeMessage(msgHdr, null, false, cb);
  } catch (e) {
    console.error(e);
    callback([]);
  }
}

getAttachmentsByIndex(gDbView, 0, attachments => {
  console.log(attachments);
  attachments.forEach(a => {
    console.log(a.name, a.size, a.url, a.contentType);
  });
});
