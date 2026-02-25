function copyToTemplatesFolderForTemplate(emlFile, templatesFolder) {
  return new Promise((resolve, reject) => {
    console.log("=== copyToTemplatesFolder START ===");
    console.log("emlFile:", emlFile.path);
    console.log("templatesFolder:", templatesFolder.name);

    const copyListener = {
      QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
      
      OnStartCopy() {
        console.log("OnStartCopy called");
      },
      
      OnProgress(progress, progressMax) {
        console.log("OnProgress:", progress, "/", progressMax);
      },
      
      SetMessageKey(msgKey) {
        console.log("SetMessageKey:", msgKey);
      },
      
      GetMessageId() {
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
      
      console.log("copyFileMessage called successfully");
    } catch (e) {
      console.error("copyFileMessage threw error:", e);
      reject(e);
    }
  });
}
