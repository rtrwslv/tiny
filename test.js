async function findReplies(msgHdr) {
  if (!msgHdr) {
    return [];
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
    return [];
  }

  const conversation = await new Promise((resolve, reject) => {
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

  const items = conversation.items || [];
  if (!items.length) {
    return [];
  }

  const myEmails = new Set(
    Array.from(MailServices.accounts.allIdentities)
      .map(i => i.email?.toLowerCase())
      .filter(Boolean)
  );

  const originalId = msgHdr.messageId;

  const replies = items.filter(m => {
    if (m.headerMessageID === originalId) {
      return false;
    }

    const from = m.from?.value?.toLowerCase();
    if (!myEmails.has(from)) {
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

  // dedupe across folders
  const unique = new Map();

  for (const m of replies) {
    const hdr = m.folderMessage;
    if (!hdr) {
      continue;
    }

    const key = hdr.messageKey + ":" + hdr.folder.URI;
    if (!unique.has(key)) {
      unique.set(key, m);
    }
  }

  return Array.from(unique.values());
}

async function openRepliesView(msgHdr, replies) {
  if (!replies?.length) {
    return;
  }

  const win = Services.wm.getMostRecentWindow("mail:3pane");

  if (!win?.openTab) {
    return;
  }

  const session = Cc[
    "@mozilla.org/messenger/searchSession;1"
  ].createInstance(Ci.nsIMsgSearchSession);

  const folders = new Set();

  // scope + terms
  for (const m of replies) {
    const hdr = m.folderMessage;
    if (!hdr) {
      continue;
    }

    const folder = hdr.folder;
    if (folder) {
      folders.add(folder);
    }

    const term = session.createTerm();
    const value = term.value;
    value.str = hdr.messageId;

    term.value = value;
    term.attrib = Ci.nsMsgSearchAttrib.MessageId;
    term.op = Ci.nsMsgSearchOp.Contains;

    session.appendTerm(term);
  }

  for (const f of folders) {
    session.addScopeTerm(
      Ci.nsMsgSearchScope.Folder,
      f
    );
  }

  win.openTab("folderSearchTab", {
    searchSession: session,
    background: false,
  });
}
