async function SaveAsTemplate(uri) {
  // ── Проверка: это .eml вложение в табе? ───────────────────
  if (window.tabmail?.currentTabInfo?.message) {
    const tabMessage = window.tabmail.currentTabInfo.message;
    
    // Проверяем что это вложение (folder === null)
    if (!tabMessage.folder) {
      await saveEmlAttachmentAsTemplateFromTab();
      return;
    }
  }

  // ── Стандартная логика для обычных писем ──────────────────
  // Существующий код SaveAsTemplate продолжается здесь
  // ...
}

async function saveEmlAttachmentAsTemplateFromTab() {
  try {
    // Шаг 1: Получаем browser из таба
    const tabInfo = window.tabmail.currentTabInfo;
    const browser = tabInfo.chromeBrowser || tabInfo.browser;
    
    if (!browser || !browser.currentURI) {
      throw new Error("Message browser not found");
    }

    const messageURI = browser.currentURI.spec;

    // Шаг 2: Сохраняем во временный файл
    const tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile).clone();
    tmpFile.append("tb_eml_template.eml");
    tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);

    const messenger = Cc["@mozilla.org/messenger;1"]
      .getService(Ci.nsIMessenger);

    await new Promise((resolve, reject) => {
      messenger.saveAs(
        messageURI,
        true,
        null,
        tmpFile.path,
        {
          QueryInterface: ChromeUtils.generateQI(["nsIUrlListener"]),
          OnStartRunningUrl(url) {},
          OnStopRunningUrl(url, exitCode) {
            if (Components.isSuccessCode(exitCode)) {
              resolve();
            } else {
              reject(new Error(`saveAs failed: 0x${exitCode.toString(16)}`));
            }
          },
        }
      );
    });

    // Шаг 3: Получаем Templates folder
    const templatesFolder = getTemplatesFolder();
    if (!templatesFolder) {
      tmpFile.remove(false);
      Services.prompt.alert(window, "Error", "Templates folder not found.");
      return;
    }

    // Шаг 4: Заменяем заголовки
    await replaceFromAndDateHeaders(tmpFile);

    // Шаг 5: Копируем в Templates
    await copyToTemplatesFolder(tmpFile, templatesFolder);

    // Шаг 6: Очистка
    try {
      tmpFile.remove(false);
    } catch {}

    // Шаг 7: Закрываем таб и показываем уведомление
    window.tabmail.closeTab(tabInfo);

    Services.prompt.alert(
      window,
      "Success",
      "Message saved as template."
    );

  } catch (e) {
    console.error("saveEmlAttachmentAsTemplateFromTab:", e);
    Services.prompt.alert(window, "Error", `Failed to save template: ${e.message}`);
  }
}

function getTemplatesFolder() {
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

async function replaceFromAndDateHeaders(emlFile) {
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

function copyToTemplatesFolder(emlFile, templatesFolder) {
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
