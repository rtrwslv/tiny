/**
 * Получить вложения письма по индексу в gDbView
 * Работает в Thunderbird 145
 *
 * @param {nsIMsgDBView} gDbView - текущий view
 * @param {number} index - индекс письма в gDbView
 * @param {function} callback - вызовется с массивом вложений
 */
function getAttachmentsByIndex(gDbView, index, callback) {
  if (!gDbView || typeof index !== "number") {
    callback([]);
    return;
  }

  try {
    let msgHdr = gDbView.getMsgHdrAt(index);
    if (!msgHdr) {
      callback([]);
      return;
    }

    // MsgHdrToMimeMessage — единственный гарантированно рабочий способ получить allAttachments
    MsgHdrToMimeMessage(msgHdr, null, false, function(mimeMsg) {
      if (!mimeMsg) {
        callback([]);
        return;
      }

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
    });

  } catch (e) {
    console.error("Ошибка при получении вложений:", e);
    callback([]);
  }
}

getAttachmentsByIndex(gDbView, 0, attachments => {
  console.log("Вложения первого письма:", attachments);

  attachments.forEach(a => {
    console.log(`Имя: ${a.name}`);
    console.log(`Размер: ${a.size}`);
    console.log(`URL: ${a.url}`);
    console.log(`MIME-тип: ${a.contentType}`);
    console.log("---");
  });
});

