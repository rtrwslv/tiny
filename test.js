function openConversation(msgHdr) {
  const win = Services.wm.getMostRecentWindow("mail:3pane");

  ConversationOpener.openConversationForMessages(
    [msgHdr],
    win
  );

  return win;
}

function filterConversationView(win, allowedMessageIds) {
  const tabmail = win.gTabmail;

  const waitForConversation = () => {
    const tab = tabmail.currentTabInfo;
    const browser = tab?.browser;

    if (!browser || !browser.contentDocument) {
      setTimeout(waitForConversation, 50);
      return;
    }

    const doc = browser.contentDocument;

    // 💥 ищем все сообщения в conversation
    const messages = doc.querySelectorAll("[data-message-id]");

    if (!messages.length) {
      setTimeout(waitForConversation, 50);
      return;
    }

    for (const el of messages) {
      const id = el.getAttribute("data-message-id");

      if (!allowedMessageIds.has(id)) {
        // 👉 скрываем лишние
        el.style.display = "none";
      } else {
        el.style.display = "";
      }
    }
  };

  waitForConversation();
}

async function collectReplyIds(msgHdr) {
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
    return new Set();
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
  const originalId = msgHdr.messageId;

  for (const m of conv.items) {
    const hdr = m.folderMessage;
    if (!hdr) continue;

    const id = hdr.messageId;

    if (id && id !== originalId) {
      ids.add(id);
    }
  }

  return ids;
}

async function openFilteredConversation(msgHdr) {
  const ids = await collectReplyIds(msgHdr);

  const win = openConversation(msgHdr);

  filterConversationView(win, ids);
}
