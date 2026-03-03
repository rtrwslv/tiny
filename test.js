// resource:///modules/ReplyNavigator.sys.mjs

import { Gloda } from "resource:///modules/gloda/Gloda.sys.mjs";
import { GlodaSyntheticView } from "resource:///modules/gloda/GlodaSyntheticView.sys.mjs";
import { MailServices } from "resource:///modules/MailServices.sys.mjs";

export class ReplyNavigator {
  /**
   * Открывает вкладку с ответами на письмо в режиме беседы.
   *
   * @param {nsIMsgDBHdr} msgHdr - исходное письмо
   * @param {XULElement} tabmail - элемент tabmail из about:3pane
   */
  static async openRepliesForMessage(msgHdr, tabmail) {
    if (!msgHdr) {
      return;
    }

    // Шаг 1: получаем Gloda-сообщение для msgHdr
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
      console.warn("ReplyNavigator: gloda message or conversation not found");
      return;
    }

    // Шаг 2: получаем все сообщения беседы через запрос к conversation
    const conversationMessages = await new Promise((resolve, reject) => {
      glodaMsg.conversation.getMessagesCollection({
        onItemsAdded(items, collection) {},
        onQueryCompleted(collection) {
          resolve(collection.items);
        },
        onQueryError(error) {
          reject(error);
        },
      });
    });

    if (!conversationMessages.length) {
      return;
    }

    // Шаг 3: получаем email-адреса всех identities пользователя
    const myEmails = new Set(
      Array.from(MailServices.accounts.allIdentities).map(id =>
        id.email.toLowerCase()
      )
    );

    // Шаг 4: фильтруем — только ответы пользователя на это конкретное письмо
    const originalMessageId = msgHdr.messageId;

    const myReplies = conversationMessages.filter(glodaReply => {
      // Пропускаем само исходное письмо
      if (glodaReply.headerMessageID === originalMessageId) {
        return false;
      }

      // Автор должен быть пользователем
      const authorEmail = glodaReply.from?.value?.toLowerCase();
      if (!myEmails.has(authorEmail)) {
        return false;
      }

      // В References или In-Reply-To должен быть messageId исходного письма
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

    if (!myReplies.length) {
      console.log("ReplyNavigator: no replies found");
      return;
    }

    // Шаг 5: создаём synthetic view из всей беседы
    // GlodaSyntheticView принимает conversation, не отдельные сообщения
    const syntheticView = new GlodaSyntheticView({
      conversation: glodaMsg.conversation,
    });

    // Шаг 6: открываем вкладку
    // ConversationOpener в TB 145 — это статический метод или
    // открытие через tabmail напрямую
    tabmail.openTab("mail3PaneTab", {
      syntheticView,
      title: "Replies",
      background: false,
    });
  }


  import { ReplyNavigator } from "resource:///modules/ReplyNavigator.sys.mjs";

// В обработчике кнопки плашки:
document.getElementById("replied-banner-link").addEventListener("click", async () => {
  const msgHdr = gDBView.getMsgHdrAt(gDBView.currentIndex);
  const tabmail = document.getElementById("tabmail") 
    ?? window.browsingContext.topChromeWindow
         .document.getElementById("tabmail");

  await ReplyNavigator.openRepliesForMessage(msgHdr, tabmail).catch(console.error);
});
}
