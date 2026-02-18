async function saveEmlAttachmentAsTemplate(attachment, templatesFolder) {
  const tmpFile = await streamAttachmentToTempFile(attachment);

  try {
    const newMsgHdr = await copyFileAsTemplate(tmpFile, templatesFolder);
    
    if (newMsgHdr) {
      await replaceFromHeaderInMessage(newMsgHdr, templatesFolder);
    }
  } finally {
    try {
      tmpFile.remove(false);
    } catch {}
  }
}

function copyFileAsTemplate(emlFile, templatesFolder) {
  return new Promise((resolve, reject) => {
    let newMsgKey = null;

    const copyListener = {
      QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
      OnStartCopy() {},
      OnProgress(progress, progressMax) {},
      
      SetMessageKey(msgKey) {
        newMsgKey = msgKey;
      },
      
      GetMessageId() {
        return null;
      },
      
      OnStopCopy(statusCode) {
        if (Components.isSuccessCode(statusCode)) {
          if (newMsgKey) {
            const newMsgHdr = templatesFolder.GetMessageHeader(newMsgKey);
            resolve(newMsgHdr);
          } else {
            resolve(null);
          }
        } else {
          reject(new Error(`copyFileMessage failed: 0x${statusCode.toString(16)}`));
        }
      },
    };

    MailServices.copy.copyFileMessage(
      emlFile,
      templatesFolder,
      null,
      false,
      Ci.nsMsgMessageFlags.Template,
      "",
      copyListener,
      null
    );
  });
}

async function replaceFromHeaderInMessage(msgHdr, folder) {
  const msgHdrInner = gMessage;
  if (!msgHdrInner) {
    return;
  }

  let identity = MailServices.accounts.getFirstIdentityForServer(
    msgHdrInner.folder.server
  );

  if (!identity) {
    const defaultAccount = MailServices.accounts.defaultAccount;
    if (defaultAccount) {
      identity = defaultAccount.defaultIdentity;
    }
  }

  if (!identity || !identity.email) {
    return;
  }

  const newAuthor = identity.fullName
    ? `${identity.fullName} <${identity.email}>`
    : identity.email;

  try {
    msgHdr.setStringProperty("author", newAuthor);
    msgHdr.author = newAuthor;
    
    folder.msgDatabase.Commit(Ci.nsMsgDBCommitType.kLargeCommit);
  } catch (e) {
    console.error("Failed to update author:", e);
  }
}
