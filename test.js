async function SaveAsTemplate(uri) {
  if (window.tabmail?.currentTabInfo?.message?.folder === null && 
      window._lastEmlAttachment) {
    await saveEmlFromStoredAttachment();
    return;
  }

  let messageURI = uri;
  if (!messageURI && gDBView?.getURIsForSelection) {
    messageURI = gDBView.getURIsForSelection()[0];
  }
  if (!messageURI) {
    return;
  }

  // Остальной существующий код SaveAsTemplate...
}

async function saveEmlFromStoredAttachment() {
  try {
    const attachment = window._lastEmlAttachment;
    
    const tmpFile = await streamAttachmentToTempFileForTemplate(attachment);

    const templatesFolder = getTemplatesFolderForTemplate();
    if (!templatesFolder) {
      try { tmpFile.remove(false); } catch {}
      Services.prompt.alert(window, "Error", "Templates folder not found.");
      return;
    }

    await replaceFromAndDateHeadersForTemplate(tmpFile);
    await copyToTemplatesFolderForTemplate(tmpFile, templatesFolder);

    try { tmpFile.remove(false); } catch {}

    const tabInfo = window.tabmail.currentTabInfo;
    if (tabInfo) {
      window.tabmail.closeTab(tabInfo);
    }

    Services.prompt.alert(window, "Success", "Message saved as template.");
    
    delete window._lastEmlAttachment;

  } catch (e) {
    console.error("saveEmlFromStoredAttachment:", e);
    Services.prompt.alert(window, "Error", `Failed: ${e.message}`);
  }
}

function streamAttachmentToTempFileForTemplate(attachment) {
  return new Promise((resolve, reject) => {
    const tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile).clone();
    tmpFile.append("tb_eml_template.eml");
    tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);

    try {
      const channel = Services.io.newChannelFromURI(
        Services.io.newURI(attachment.url),
        null,
        Services.scriptSecurityManager.getSystemPrincipal(),
        null,
        Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
        Ci.nsIContentPolicy.TYPE_OTHER
      );

      const outStream = Cc["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Ci.nsIFileOutputStream);
      outStream.init(tmpFile, 0x02 | 0x08 | 0x20, 0o600, 0);

      channel.asyncOpen({
        QueryInterface: ChromeUtils.generateQI(["nsIStreamListener"]),
        onStartRequest(request) {},
        onDataAvailable(request, inputStream, offset, count) {
          const binStream = Cc["@mozilla.org/binaryinputstream;1"]
            .createInstance(Ci.nsIBinaryInputStream);
          binStream.setInputStream(inputStream);
          const data = binStream.readBytes(count);

          const binOutStream = Cc["@mozilla.org/binaryoutputstream;1"]
            .createInstance(Ci.nsIBinaryOutputStream);
          binOutStream.setOutputStream(outStream);
          binOutStream.writeBytes(data, data.length);
        },
        onStopRequest(request, statusCode) {
          try { outStream.close(); } catch {}
          if (Components.isSuccessCode(statusCode)) {
            resolve(tmpFile);
          } else {
            try { tmpFile.remove(false); } catch {}
            reject(new Error(`channel failed: 0x${statusCode.toString(16)}`));
          }
        },
      });
    } catch (e) {
      try { tmpFile.remove(false); } catch {}
      reject(e);
    }
  });
}

function getTemplatesFolderForTemplate() {
  const defaultAccount = MailServices.accounts.defaultAccount;
  if (!defaultAccount) {
    return null;
  }

  const identity = defaultAccount.defaultIdentity;
  
  if (identity?.stationeryFolder) {
    try {
      return MailUtils.getOrCreateFolder(identity.stationeryFolder);
    } catch {}
  }

  try {
    const rootFolder = defaultAccount.incomingServer.rootFolder;
    return rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
  } catch {}

  return null;
}

async function replaceFromAndDateHeadersForTemplate(emlFile) {
  const identity = MailServices.accounts.defaultAccount?.defaultIdentity;
  if (!identity || !identity.email) {
    return;
  }

  const encodedName = identity.fullName
    ? MailServices.mimeConverter.encodeMimePartIIStr_UTF8(
        identity.fullName,
        false,
        "UTF-8",
        0,
        72
      )
    : null;

  const newFrom = encodedName
    ? `${encodedName} <${identity.email}>`
    : identity.email;

  const currentDate = new Date().toUTCString();

  let fileInputStream;
  let scriptableStream;
  let emlContent = "";

  try {
    fileInputStream = Cc["@mozilla.org/network/file-input-stream;1"]
      .createInstance(Ci.nsIFileInputStream);
    fileInputStream.init(emlFile, 0x01, 0, 0);

    scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
      .createInstance(Ci.nsIScriptableInputStream);
    scriptableStream.init(fileInputStream);

    let chunk;
    while ((chunk = scriptableStream.read(8192))) {
      emlContent += chunk;
    }
  } finally {
    if (scriptableStream) {
      try { scriptableStream.close(); } catch {}
    }
    if (fileInputStream) {
      try { fileInputStream.close(); } catch {}
    }
  }

  let headerEnd = emlContent.indexOf("\r\n\r\n");
  if (headerEnd === -1) {
    headerEnd = emlContent.indexOf("\n\n");
  }
  if (headerEnd === -1) {
    return;
  }

  const headers = emlContent.substring(0, headerEnd);
  const body = emlContent.substring(headerEnd);

  const lines = headers.split(/\r?\n/);
  const newLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^(From|Sender|Reply-To|Return-Path|Date):\s/i.test(line)) {
      const headerName = line.match(/^([^:]+):/i)[1];
      
      let j = i + 1;
      while (j < lines.length && /^\s/.test(lines[j])) {
        j++;
      }

      if (headerName.toLowerCase() === "date") {
        newLines.push(`Date: ${currentDate}`);
      } else {
        newLines.push(`${headerName}: ${newFrom}`);
      }
      
      i = j;
      continue;
    }

    newLines.push(line);
    i++;
  }

  const newHeaders = newLines.join("\r\n");
  const newContent = newHeaders + body;

  let fileOutputStream;
  let converter;

  try {
    fileOutputStream = Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
    fileOutputStream.init(emlFile, 0x02 | 0x08 | 0x20, 0o600, 0);

    converter = Cc["@mozilla.org/intl/converter-output-stream;1"]
      .createInstance(Ci.nsIConverterOutputStream);
    converter.init(fileOutputStream, "UTF-8");
    converter.writeString(newContent);
  } finally {
    if (converter) {
      try { converter.close(); } catch {}
    }
  }
}

function copyToTemplatesFolderForTemplate(emlFile, templatesFolder) {
  return new Promise((resolve, reject) => {
    const copyListener = {
      QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
      OnStartCopy() {},
      OnProgress(progress, progressMax) {},
      SetMessageKey(msgKey) {},
      GetMessageId() { return null; },
      OnStopCopy(statusCode) {
        if (Components.isSuccessCode(statusCode)) {
          resolve();
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
