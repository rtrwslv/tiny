const msgId = window.tabmail.currentTabInfo.message.messageId;

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
    const msgDatabase = folder.msgDatabase;
    if (!msgDatabase) {
      return null;
    }

    const enumerator = msgDatabase.enumerateMessages();
    while (enumerator.hasMoreElements()) {
      const msgHdr = enumerator.getNext();
      
      const attachments = msgHdr.getStringProperty("attachmentNames");
      if (attachments && attachments.toLowerCase().includes(".eml")) {
        console.log("Found potential parent:", msgHdr.subject, "in", folder.name);
        return msgHdr;
      }
    }
  } catch (e) {}

  for (const subFolder of folder.subFolders) {
    const result = await searchFolderForParent(subFolder, childMessageId);
    if (result) {
      return result;
    }
  }

  return null;
}

findParentMessage(msgId).then(parent => {
  if (parent) {
    console.log("FOUND PARENT:");
    console.log("  subject:", parent.subject);
    console.log("  folder:", parent.folder.name);
    console.log("  messageKey:", parent.messageKey);
  } else {
    console.log("Parent not found");
  }
});
