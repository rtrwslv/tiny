const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

function getAttachmentsByIndex(gDbView, index, callback) {
  let msgHdr = gDbView.getMsgHdrAt(index);
  if (!msgHdr) { callback([]); return; }

  let folder = msgHdr.folder;
  let msgUri = folder.getUriForMsg(msgHdr);
  let msgService = MailServices.messageServiceFromURI(msgUri);

  // Объект sink для разбора MIME
  let sink = Cc["@mozilla.org/messenger/messageheader-sink;1"]
               .createInstance(Ci.nsIMsgHeaderSink);
  
  sink.msgHdr = msgHdr;
  sink.onStartMessage = function() {};
  sink.onEndMessage = function() {
    let attachments = [];
    if (this.attachments && this.attachments.length) {
      for (let att of this.attachments) {
        attachments.push({
          name: att.name,
          size: att.size,
          url: att.url,
          contentType: att.contentType
        });
      }
    }
    callback(attachments);
  };
  
  let msgWindow = Cc["@mozilla.org/messenger/msgwindow;1"].createInstance(Ci.nsIMsgWindow);
  
  msgService.streamMessage(
    msgUri,
    sink,
    null,
    msgWindow,
    false,
    null
  );
}

// --- Использование ---
getAttachmentsByIndex(gDbView, 0, attachments => {
  console.log("Вложения:", attachments);
  attachments.forEach(a => console.log(a.name, a.size, a.url, a.contentType));
});
