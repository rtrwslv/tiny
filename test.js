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

    // Попробуем isDraft=true вместо Template флага
    MailServices.copy.copyFileMessage(
      emlFile,
      templatesFolder,
      null,
      true,  // isDraft = true
      0,     // без флага Template
      "",
      copyListener,
      null
    );
  });
}
