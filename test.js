static async openRepliesForMessage(msgHdr, tabmail) {
  if (!msgHdr) {
    return;
  }

  const glodaMsg = await new Promise((resolve, reject) => {
    Gloda.getMessageCollectionForHeader(msgHdr, {
      onItemsAdded(items, collection) {},
      onQueryCompleted(collection) {
        resolve(collection.items[0] ?? null);
      },
      onQueryError(error) {
        reject(error);
      },
    });
  });

  if (!glodaMsg?.conversation) {
    return;
  }

  const conversationCollection = await new Promise((resolve, reject) => {
    glodaMsg.conversation.getMessagesCollection({
      onItemsAdded(items, collection) {},
      onQueryCompleted(collection) {
        resolve(collection);
      },
      onQueryError(error) {
        reject(error);
      },
    });
  });

  if (!conversationCollection.items.length) {
    return;
  }

  const myEmails = new Set(
    Array.from(MailServices.accounts.allIdentities).map(id =>
      id.email.toLowerCase()
    )
  );

  const originalMessageId = msgHdr.messageId;

  conversationCollection.items = conversationCollection.items.filter(glodaReply => {
    if (glodaReply.headerMessageID === originalMessageId) {
      return false;
    }

    const authorEmail = glodaReply.from?.value?.toLowerCase();
    if (!myEmails.has(authorEmail)) {
      return false;
    }

    const folderMsg = glodaReply.folderMessage;
    if (!folderMsg) {
      return false;
    }

    const references = folderMsg.getStringProperty("references") || "";
    const inReplyTo = folderMsg.getStringProperty("in-reply-to") || "";

    return (
      references.includes(originalMessageId) ||
      inReplyTo.includes(originalMessageId)
    );
  });

  if (!conversationCollection.items.length) {
    return;
  }

  const syntheticView = new GlodaSyntheticView({
    collection: conversationCollection,
  });

  ConversationOpener.openConversation(
    tabmail.ownerGlobal,
    syntheticView
  );
}
