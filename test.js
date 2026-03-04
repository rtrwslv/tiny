async function copyToTemplatesFolderForTemplate(emlFile, templatesFolder) {
  console.log("=== copyToTemplatesFolder START ===");
  console.log("emlFile:", emlFile.path);
  console.log("templatesFolder:", templatesFolder.name);
  console.log("templatesFolder.server.type:", templatesFolder.server?.type);
  console.log("templatesFolder.URI:", templatesFolder.URI);

  return new Promise((resolve, reject) => {
    const copyListener = {
      QueryInterface: ChromeUtils.generateQI([
        "nsIMsgCopyServiceListener",
        "nsISupports"
      ]),
      
      OnStartCopy() {
        console.log("OnStartCopy called");
      },
      
      OnProgress(progress, progressMax) {
        console.log("OnProgress:", progress, "/", progressMax);
      },
      
      SetMessageKey(msgKey) {
        console.log("SetMessageKey:", msgKey);
      },
      
      GetMessageId(messageId) {
        return null;
      },
      
      OnStopCopy(statusCode) {
        console.log("OnStopCopy called, status:", statusCode);
        console.log("isSuccess:", Components.isSuccessCode(statusCode));
        
        if (Components.isSuccessCode(statusCode)) {
          console.log("Resolving promise");
          resolve();
        } else {
          console.log("Rejecting promise");
          reject(new Error(`copyFileMessage failed: 0x${statusCode.toString(16)}`));
        }
      },
    };

    try {
      console.log("Calling MailServices.copy.copyFileMessage");
      
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
      
      console.log("copyFileMessage called");
    } catch (e) {
      console.error("copyFileMessage threw error:", e);
      reject(e);
    }
  });
}
