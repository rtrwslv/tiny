async function openRepliesCrossFolder(msgHdr) {
  if (!msgHdr) {
    return;
  }

  // 1. Gloda message
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
    return;
  }

  // 2. Get conversation messages
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
    return;
  }

  // 3. My emails filter
  const myEmails = new Set(
    Array.from(MailServices.accounts.allIdentities)
      .map(i => i.email?.toLowerCase())
      .filter(Boolean)
  );

  const originalId = msgHdr.messageId;

  // 4. Filter replies across folders
  const replies = items.filter(m => {
    if (m.headerMessageID === originalId) {
      return false;
    }

    const author = m.from?.value?.toLowerCase();
    if (!myEmails.has(author)) {
      return false;
    }

    const hdr = m.folderMessage;
    if (!hdr) {
      return false;
    }

    const refs = hdr.getStringProperty("references") || "";
    const inReplyTo = hdr.getStringProperty("in-reply-to") || "";

    return (
      refs.includes(originalId) ||
      inReplyTo.includes(originalId)
    );
  });

  if (!replies.length) {
    return;
  }

  // 5. Convert to real nsIMsgDBHdr (IMPORTANT)
  const hdrs = replies
    .map(m => m.folderMessage)
    .filter(Boolean);

  // 6. Deduplicate across folders (important for IMAP copies)
  const unique = new Map();

  for (const h of hdrs) {
    const key = h.messageKey + ":" + h.folder.URI;
    if (!unique.has(key)) {
      unique.set(key, h);
    }
  }

  const finalHdrs = Array.from(unique.values());

  // 7. OPEN NATIVE THUNDERBIRD VIEW
  const win = Services.wm.getMostRecentWindow("mail:3pane");

  if (!win?.MailUtils?.displayMessages) {
    console.error("MailUtils.displayMessages not available");
    return;
  }

  win.MailUtils.displayMessages(finalHdrs);
}
