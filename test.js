async function copyToFolderAsTemplate(emlFile, destFolder) {
  if (!emlFile?.exists()) {
    throw new Error("EML file does not exist");
  }

  if (!destFolder?.canFileMessages) {
    throw new Error("Destination folder cannot file messages");
  }

  return new Promise((resolve, reject) => {
    let newMsgKey = null;

    let listener = {
      OnStartCopy() {},

      OnProgress(progress, progressMax) {},

      SetMessageKey(key) {
        newMsgKey = key;
      },

      SetMessageId(msgId) {},

      OnStopCopy(status) {
        if (!Components.isSuccessCode(status)) {
          reject(new Error("Copy failed: " + status));
          return;
        }

        try {
          // Для IMAP папок нужно обновление
          if (destFolder.server.type === "imap") {
            destFolder.updateFolder(null);
          }

          let hdr = null;

          if (newMsgKey !== null) {
            hdr = destFolder.msgDatabase?.GetMsgHdrForKey(newMsgKey);
          }

          // fallback — иногда IMAP не даёт key сразу
          if (!hdr) {
            destFolder.msgDatabase?.EnumerateMessages().forEach(h => {
              if (h.flags & Ci.nsMsgMessageFlags.Template) {
                hdr = h;
              }
            });
          }

          resolve(hdr || null);
        } catch (e) {
          reject(e);
        }
      },
    };

    try {
      MailServices.copy.copyFileMessage(
        emlFile,
        destFolder,
        null, // msgToReplace
        false, // isDraft
        Ci.nsMsgMessageFlags.Template,
        "",
        listener,
        null
      );
    } catch (e) {
      reject(e);
    }
  });
}
