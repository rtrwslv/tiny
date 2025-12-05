/**
 * Получить вложения письма по индексу в gDbView (асинхронно)
 * @param {nsIMsgDBView} gDbView 
 * @param {number} index 
 * @param {function} callback - вызывается с массивом вложений
 */
function getAttachmentsByIndexAsync(gDbView, index, callback) {
  try {
    let msgHdr = gDbView.getMsgHdrAt(index);
    if (!msgHdr) {
      callback([]);
      return;
    }

    let messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
    let msgUri = msgHdr.folder.getUriForMsg(msgHdr);

    messenger.messageServiceFromURI(msgUri)
      .streamMessage(
        msgUri,
        {
          onStartRequest() {},
          onStopRequest(request, context, statusCode) {},
          onDataAvailable() {},
          msgHdr: msgHdr,
          attachments: [],
          onMsgParsed(mimeMsg) {
            // Когда MIME разобран, забираем вложения
            let result = [];
            if (mimeMsg.allAttachments) {
              for (let att of mimeMsg.allAttachments) {
                result.push({
                  name: att.name,
                  size: att.size,
                  url: att.url,
                  contentType: att.contentType
                });
              }
            }
            callback(result);
          }
        },
        null,
        false,
        null
      );
  } catch (e) {
    console.error("Ошибка получения вложений:", e);
    callback([]);
  }
}

getAttachmentsByIndexAsync(gDbView, 0, attachments => {
  console.log("Вложения первого письма:", attachments);
});
