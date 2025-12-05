const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

function getAttachmentsByIndex(gDbView, index, callback) {
  let msgHdr = gDbView.getMsgHdrAt(index);
  if (!msgHdr) { callback([]); return; }

  let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
  let msgService = MailServices.messageServiceFromURI(msgUri);

  let sink = {
    attachments: [],
    onStartRequest() {},
    onStopRequest() {},
    onDataAvailable() {},
    onMsgParsed(mimeMsg) {
      let attachments = [];
      if (mimeMsg.allAttachments && mimeMsg.allAttachments.length) {
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

  msgService.streamMessage(msgUri, sink, null, null, false, null);
}

// Пример использования
getAttachmentsByIndex(gDbView, 0, attachments => {
  console.log("Вложения:", attachments);
  attachments.forEach(a => console.log(a.name, a.size, a.url, a.contentType));
});
