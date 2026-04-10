async function collectReplyMessageIds(msgHdr) {
  const glodaMsg = await new Promise((resolve, reject) => {
    Gloda.getMessageCollectionForHeader(msgHdr, {
      onItemsAdded() {},
      onQueryCompleted(c) {
        resolve(c.items[0] ?? null);
      },
      onQueryError(e) {
        reject(e);
      },
    });
  });

  if (!glodaMsg?.conversation) {
    return [];
  }

  const conv = await new Promise((resolve, reject) => {
    glodaMsg.conversation.getMessagesCollection({
      onItemsAdded() {},
      onQueryCompleted(c) {
        resolve(c);
      },
      onQueryError(e) {
        reject(e);
      },
    });
  });

  const ids = new Set();

  for (const m of conv.items) {
    const hdr = m.folderMessage;
    if (!hdr) {
      continue;
    }

    const id = hdr.messageId;

    if (id && id !== msgHdr.messageId) {
      ids.add(id);
    }
  }

  return Array.from(ids);
}

function openRepliesAsSearchFolder(msgHdr, messageIds, tabmail) {
  const session = Cc[
    "@mozilla.org/messenger/searchSession;1"
  ].createInstance(Ci.nsIMsgSearchSession);

  const folder = msgHdr.folder;

  session.addScopeTerm(
    Ci.nsMsgSearchScope.Folder,
    folder
  );

  for (const id of messageIds) {
    const term = session.createTerm();
    const value = term.value;
    value.str = id;

    term.value = value;
    term.attrib = Ci.nsMsgSearchAttrib.MessageId;
    term.op = Ci.nsMsgSearchOp.Is;

    session.appendTerm(term);
  }

  tabmail.openTab("mail3PaneTab", {
    folder,
    searchSession: session,
    background: false,
  });
}
