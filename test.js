const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

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

    let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
    let msgService = MailServices.messageServiceFromURI(msgUri);

    let listener = {
      msgHdr,
      attachments: [],
      onStartRequest() {},
      onStopRequest(request, context, statusCode) {},
      onDataAvailable() {},
      // вызывается, когда MIME-сообщение разобрано
      onMsgParsed(mimeMsg) {
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
    };

    msgService.streamMessage(
      msgUri,
      listener,
      null,   // aStreamConverter
      null,   // aChannel
      false,  // aConvertData
      ""      // aMsgWindow
    );

  } catch (e) {
    console.error("Ошибка получения вложений:", e);
    callback([]);
  }
}

// --- Пример использования ---
getAttachmentsByIndexAsync(gDbView, 0, attachments => {
  console.log("Вложения первого письма:", attachments);
  attachments.forEach(a => {
    console.log(`Имя: ${a.name}, Размер: ${a.size}, URL: ${a.url}, Тип: ${a.contentType}`);
  });
});
