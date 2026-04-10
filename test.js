async function collectReplyCollection(msgHdr) {
  if (!msgHdr) {
    return null;
  }

  const glodaMsg = await new Promise((resolve, reject) => {
    Gloda.getMessageCollectionForHeader(msgHdr, {
      onItemsAdded() {},
      onQueryCompleted(collection) {
        resolve(collection.items[0] ?? null);
      },
      onQueryError(err) {
        reject(err);
      },
    });
  });

  if (!glodaMsg?.conversation) {
    return null;
  }

  const conversationCollection = await new Promise((resolve, reject) => {
    glodaMsg.conversation.getMessagesCollection({
      onItemsAdded() {},
      onQueryCompleted(c) {
        resolve(c);
      },
      onQueryError(err) {
        reject(err);
      },
    });
  });

  const items = conversationCollection.items || [];
  if (!items.length) {
    return null;
  }

  const originalId = msgHdr.messageId;

  const seen = new Set();

  const myEmails = new Set(
    Array.from(MailServices.accounts.allIdentities)
      .map(i => i.email?.toLowerCase())
      .filter(Boolean)
  );

  const filtered = [];

  for (const m of items) {
    const hdr = m.folderMessage;
    if (!hdr) {
      continue;
    }

    const id = hdr.messageId;

    // dedupe across folders / gloda duplicates
    const uniqueKey = id + "::" + hdr.folder?.URI;
    if (seen.has(uniqueKey)) {
      continue;
    }
    seen.add(uniqueKey);

    // exclude original message
    if (id === originalId) {
      continue;
    }

    // only messages FROM others replying TO me (твоя логика)
    const author = m.from?.value?.toLowerCase();
    if (myEmails.has(author)) {
      continue;
    }

    const refs = hdr.getStringProperty("references") || "";
    const inReplyTo = hdr.getStringProperty("in-reply-to") || "";

    const isReply =
      refs.includes(originalId) ||
      inReplyTo.includes(originalId);

    if (!isReply) {
      continue;
    }

    filtered.push(m);
  }

  return {
    items: filtered,
    query: conversationCollection.query,
  };
}
