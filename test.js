async function collectRepliesForSyntheticView(msgHdr) {
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

    // 🔥 HARD DEDUPE (cross-folder safe)
    const key = hdr.messageKey + "::" + hdr.folder?.URI;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    // exclude original
    if (id === originalId) {
      continue;
    }

    // optional: only real replies in thread
    const refs = hdr.getStringProperty("references") || "";
    const inReplyTo = hdr.getStringProperty("in-reply-to") || "";

    const isReply =
      refs.includes(originalId) ||
      inReplyTo.includes(originalId);

    if (!isReply) {
      continue;
    }

    filtered.push(hdr); // ⚠️ IMPORTANT: ONLY DBHDR, NO Gloda object
  }

  // 🔥 FINAL SORT (deterministic, fixes “last = penultimate”)
  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date - b.date;
    }
    return a.messageKey - b.messageKey;
  });

  return {
    items: filtered.map(hdr => ({
      folderMessage: hdr,
      messageKey: hdr.messageKey,
      messageId: hdr.messageId,
      date: hdr.date,
    })),
    query: conversationCollection.query,
  };
}


function openRepliesSyntheticView(collection, tabmail) {
  if (!collection?.items?.length) {
    return;
  }

  // 🔥 IMPORTANT: fresh object identity (prevents Gloda reuse bugs)
  const cleanCollection = {
    items: collection.items.map(i => ({
      folderMessage: i.folderMessage,
      messageKey: i.messageKey,
      messageId: i.messageId,
      date: i.date,
    })),
    query: collection.query,
  };

  const view = new GlodaSyntheticView({
    collection: cleanCollection,
  });

  tabmail.openTab("mail3PaneTab", {
    syntheticView: view,
    background: false,
  });
}
