async function saveEmlAttachmentAsTemplateFromTab() {
  try {
    const tabInfo = window.tabmail.currentTabInfo;
    const msgHdr = tabInfo.message;
    
    if (!msgHdr) {
      throw new Error("Message not found");
    }

    const emlContent = await new Promise((resolve, reject) => {
      try {
        const msgService = MailServices.messageServiceFromURI(
          `mid:${msgHdr.messageId}`
        );

        const streamListener = {
          QueryInterface: ChromeUtils.generateQI(["nsIStreamListener"]),
          _data: [],
          onStartRequest(request) {},
          onDataAvailable(request, inputStream, offset, count) {
            const binaryStream = Cc["@mozilla.org/binaryinputstream;1"]
              .createInstance(Ci.nsIBinaryInputStream);
            binaryStream.setInputStream(inputStream);
            this._data.push(binaryStream.readBytes(count));
          },
          onStopRequest(request, statusCode) {
            if (Components.isSuccessCode(statusCode)) {
              resolve(this._data.join(""));
            } else {
              reject(new Error(`Stream failed: 0x${statusCode.toString(16)}`));
            }
          }
        };

        msgService.streamMessage(
          `mid:${msgHdr.messageId}`,
          streamListener,
          null,
          null,
          false,
          null
        );
      } catch (e) {
        const browser = tabInfo.chromeBrowser || tabInfo.browser;
        if (browser?.contentDocument) {
          const pre = browser.contentDocument.querySelector("pre");
          if (pre) {
            resolve(pre.textContent);
            return;
          }
        }
        reject(e);
      }
    });
    
    if (!emlContent) {
      throw new Error("Could not extract message content");
    }

    const tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile).clone();
    tmpFile.append("tb_eml_template.eml");
    tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);

    const foStream = Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
    foStream.init(tmpFile, 0x02 | 0x08 | 0x20, 0o600, 0);
    foStream.write(emlContent, emlContent.length);
    foStream.close();

    const templatesFolder = getTemplatesFolder();
    if (!templatesFolder) {
      tmpFile.remove(false);
      Services.prompt.alert(window, "Error", "Templates folder not found.");
      return;
    }

    await replaceFromAndDateHeaders(tmpFile);
    await copyToTemplatesFolder(tmpFile, templatesFolder);

    try {
      tmpFile.remove(false);
    } catch {}

    window.tabmail.closeTab(tabInfo);
    Services.prompt.alert(window, "Success", "Message saved as template.");

  } catch (e) {
    console.error("saveEmlAttachmentAsTemplateFromTab:", e);
    Services.prompt.alert(window, "Error", `Failed: ${e.message}`);
  }
}
