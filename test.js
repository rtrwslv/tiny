const msgId = window.tabmail.currentTabInfo.message.messageId;

// Функция поиска родительского письма
async function findParentMessage(messageId) {
  for (const account of MailServices.accounts.accounts) {
    const rootFolder = account.incomingServer.rootFolder;
    const result = await searchFolderForParent(rootFolder, messageId);
    if (result) {
      return result;
    }
  }
  return null;
}

async function searchFolderForParent(folder, childMessageId) {
  try {
    // Ищем письмо которое содержит этот messageId как вложение
    const enumerator = folder.messages;
    while (enumerator.hasMoreElements()) {
      const msgHdr = enumerator.getNext();
      
      // Проверяем есть ли у этого письма вложения
      const attachments = msgHdr.getStringProperty("attachmentNames");
      if (attachments && attachments.includes(".eml")) {
        // Потенциальный кандидат — нужно проверить глубже
        console.log("Found potential parent:", msgHdr.subject);
        return msgHdr;
      }
    }
  } catch (e) {
    console.error("Error searching folder:", e);
  }

  // Рекурсивно по подпапкам
  for (const subFolder of folder.subFolders) {
    const result = await searchFolderForParent(subFolder, childMessageId);
    if (result) {
      return result;
    }
  }

  return null;
}

// Запускаем поиск
findParentMessage(msgId).then(parent => {
  if (parent) {
    console.log("FOUND PARENT:", parent.subject);
    console.log("parent folder:", parent.folder.name);
  } else {
    console.log("Parent not found");
  }
});
