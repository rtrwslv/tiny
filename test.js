async function loadRepliesCount(msgHdr, bannerElement) {
  if (!msgHdr) {
    return null;
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
    return null;
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
    return null;
  }

  const seen = new Set();
  conversationCollection.items = conversationCollection.items.filter(g => {
    if (seen.has(g.headerMessageID)) {
      return false;
    }
    seen.add(g.headerMessageID);
    return true;
  });

  const myEmails = new Set(
    Array.from(MailServices.accounts.allIdentities).map(id =>
      id.email.toLowerCase()
    )
  );

  const originalMessageId = msgHdr.messageId;

  const filteredGlodaMessages = conversationCollection.items.filter(glodaReply => {
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

  if (!filteredGlodaMessages.length) {
    return null;
  }

  if (filteredGlodaMessages.length === 1) {
    const folderMsg = filteredGlodaMessages[0].folderMessage;
    const date = new Date(folderMsg.date / 1000);
    const dateStr = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    const timeStr = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    document.l10n.setAttributes(bannerElement, "replied-banner-single", {
      date: dateStr,
      time: timeStr,
    });
  } else {
    document.l10n.setAttributes(bannerElement, "replied-banner-multiple", {
      count: filteredGlodaMessages.length,
    });
  }

  return { filteredGlodaMessages, conversationCollection };
}

async function openRepliesForMessage(filteredGlodaMessages, conversationCollection, tabmail) {
  if (!filteredGlodaMessages?.length) {
    return;
  }

  conversationCollection.items = filteredGlodaMessages;

  const syntheticView = new GlodaSyntheticView({
    collection: conversationCollection,
  });

  tabmail.openTab("mail3PaneTab", {
    syntheticView,
    background: false,
  });
}


replied-banner-single = Вы ответили на это сообщение { $date } в { $time }
replied-banner-multiple =
    { $count ->
        [one] Вы уже отвечали на это сообщение { $count } раз
        [few] Вы уже отвечали на это сообщение { $count } раза
       *[other] Вы уже отвечали на это сообщение { $count } раз
    }

