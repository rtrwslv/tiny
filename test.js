/**
 * Получить вложения письма по индексу в gDbView (синхронно)
 * @param {nsIMsgDBView} gDbView 
 * @param {number} index 
 * @returns {Array} массив объектов {name, size, url, contentType}
 */
function getAttachmentsByIndexSync(gDbView, index) {
  let result = [];
  try {
    let msgHdr = gDbView.getMsgHdrAt(index);
    if (!msgHdr) return result;

    let folder = msgHdr.folder;
    let db = folder.msgDatabase;
    if (!db) return result;

    // Получаем список вложений через db
    let attachmentArray = [];
    msgHdr.getStringProperty("attachmentNames"); // проверка, есть ли вложения

    let enumerator = db.EnumerateAttachments(msgHdr.messageKey);
    while (enumerator.hasMoreElements()) {
      let attachment = enumerator.getNext().QueryInterface(Ci.nsIMsgAttachment);
      result.push({
        name: attachment.name,
        size: attachment.size,
        url: attachment.url,
        contentType: attachment.contentType
      });
    }
  } catch (e) {
    console.error("Ошибка при получении вложений:", e);
  }
  return result;
}

let attachments = getAttachmentsByIndexSync(gDbView, 0);
attachments.forEach(a => {
  console.log(a.name, a.size, a.url, a.contentType);
});

