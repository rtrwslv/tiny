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

  const appLocale = Services.locale.appLocaleAsBCP47;

  if (filteredGlodaMessages.length === 1) {
    const folderMsg = filteredGlodaMessages[0].folderMessage;
    const date = new Date(folderMsg.date / 1000);
    const dateStr = new Intl.DateTimeFormat(appLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    const timeStr = new Intl.DateTimeFormat(appLocale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    bannerElement.textContent = await document.l10n.formatValue(
      "replied-banner-single",
      { date: dateStr, time: timeStr }
    );
  } else {
    const count = filteredGlodaMessages.length;
    const pluralRules = new Intl.PluralRules(appLocale);
    const pluralForms = {
      "en-US": { one: "раз", few: "раза", other: "раз" },
      "en-GB": { one: "time", other: "times" },
    };
    const forms = pluralForms[appLocale] ?? pluralForms["en-GB"];
    const form = forms[pluralRules.select(count)] ?? forms.other;

    bannerElement.textContent = await document.l10n.formatValue(
      "replied-banner-multiple",
      { count, form }
    );
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
