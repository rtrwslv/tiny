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

    // Используем enumerator вложений
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

// --- Пример использования ---
let attachments = getAttachmentsByIndexSync(gDbView, 0);
console.log("Вложения первого письма:", attachments);
attachments.forEach(a => {
  console.log(`Имя: ${a.name}, Размер: ${a.size}, URL: ${a.url}, Тип: ${a.contentType}`);
});
