/**
 * Получить вложения письма по индексу в gDbView
 * @param {nsIMsgDBView} gDbView - текущий view
 * @param {number} index - индекс письма в gDbView
 * @returns {Array} массив объектов {name, size, url, contentType}
 */
function getAttachmentsByIndex(gDbView, index) {
  if (!gDbView || typeof index !== "number") {
    return [];
  }

  try {
    // Получаем заголовок письма
    let msgHdr = gDbView.getMsgHdrAt(index);
    if (!msgHdr) return [];

    // Подготавливаем объект для MimeMessage
    let mimeMsg = {};
    MsgHdrToMimeMessage(msgHdr, null, false, mimeMsg);

    // Возвращаем массив вложений
    return mimeMsg.value.allAttachments.map(att => ({
      name: att.name,
      size: att.size,
      url: att.url,
      contentType: att.contentType
    }));
  } catch (e) {
    console.error("Ошибка при получении вложений:", e);
    return [];
  }
}

let attachments = getAttachmentsByIndex(gDbView, 0); // вложения первого письма
attachments.forEach(a => {
  console.log(a.name, a.size, a.url, a.contentType);
});

