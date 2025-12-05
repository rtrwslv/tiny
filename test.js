const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

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
    };

    // streamMessage использует nsIStreamListener
    msgService.streamMessage(
      msgUri,
      listener,
      null,
      null,
      false,
      ""
    );

  } catch (e) {
    console.error("Ошибка получения вложений:", e);
    callback([]);
  }
}
