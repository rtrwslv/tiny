function onShowAttachmentItemContextMenu(event) {
  // ... весь существующий код без изменений ...

  // ── ВСТАВИТЬ ПЕРЕД ЗАКРЫВАЮЩЕЙ СКОБКОЙ ──────────────────────
  const emlMenuItem = document.getElementById("context-saveEmlAsTemplate");
  if (emlMenuItem) {
    const att = attachmentList.selectedItem?.attachment;
    const isEml =
      att &&
      (att.name?.toLowerCase().endsWith(".eml") ||
        att.contentType === "message/rfc822");
    emlMenuItem.hidden = !isEml;
  }
  // ────────────────────────────────────────────────────────────
}                                      // ← закрывающая скобка функции

/**
 * Handles "Save as Template" for .eml attachments.
 * Uses the same nsIMsgCopyService mechanism that Thunderbird
 * uses internally for all template save operations.
 */
async function HandleEmlAttachmentSaveAsTemplate() {
  const attachment = attachmentList.selectedItem?.attachment;
  if (!attachment) {
    return;
  }

  // Найти папку Templates для аккаунта текущего письма
  const templatesFolder = getTemplatesFolderForCurrentMessage();
  if (!templatesFolder) {
    // Показываем стандартный диалог выбора папки как fallback
    console.error("No Templates folder found for current account");
    Services.prompt.alert(
      window,
      await document.l10n.formatValue("attachment-template-error-title"),
      await document.l10n.formatValue("attachment-template-no-folder-error")
    );
    return;
  }

  try {
    await saveEmlAttachmentAsTemplate(attachment, templatesFolder);

    // Стандартное уведомление — такое же, как после Save as Template в compose
    window.alert(
      `"${attachment.name}" was saved as a template in ${templatesFolder.prettyName}.`
    );
  } catch (e) {
    console.error("HandleEmlAttachmentSaveAsTemplate failed:", e);
    Services.prompt.alert(window, "Error", e.message);
  }
}

/**
 * Gets the Templates folder for the account of the currently
 * displayed message. Mirrors the logic in MsgComposeCommands.js
 * GetTemplateFolder().
 *
 * This is the same lookup Thunderbird's own compose window uses.
 *
 * @returns {nsIMsgFolder|null}
 */
function getTemplatesFolderForCurrentMessage() {
  const msgHdr = gMessage;
  if (!msgHdr) {
    return null;
  }

  // Используем тот же метод что и MsgComposeCommands.js
  const identity = MailServices.accounts.getFirstIdentityForServer(
    msgHdr.folder.server
  );

  // Стандартный путь Thunderbird для поиска папки Templates по identity
  if (identity) {
    const stationeryFolder = identity.stationeryFolder;
    if (stationeryFolder) {
      // stationeryFolder — это URI папки Templates из настроек identity
      return MailUtils.getOrCreateFolder(stationeryFolder);
    }
  }

  // Fallback: ищем по флагу в корне аккаунта
  const rootFolder = msgHdr.folder.server.rootFolder;
  return rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
}

/**
 * Core implementation: streams the .eml attachment to a temp file,
 * then copies it into the Templates folder using nsIMsgCopyService —
 * the same service used by all Thunderbird template/draft save operations.
 *
 * @param {AttachmentInfo} attachment
 * @param {nsIMsgFolder} templatesFolder
 * @returns {Promise<void>}
 */
async function saveEmlAttachmentAsTemplate(attachment, templatesFolder) {
  // 1. Записываем вложение во временный файл
  const tmpFile = await streamAttachmentToTempFile(attachment);

  try {
    // 2. Копируем через MailServices.copy с флагом Template
    await copyFileAsTemplate(tmpFile, templatesFolder);
  } finally {
    // 3. Всегда удаляем временный файл
    try {
      tmpFile.remove(false);
    } catch (e) {
      console.warn("Failed to remove temp file:", e);
    }
  }
}

/**
 * Streams attachment content to a temp .eml file using
 * the standard Thunderbird channel mechanism.
 * Same approach as AttachmentInfo.save() in msgHdrView.js.
 *
 * @param {AttachmentInfo} attachment
 * @returns {Promise<nsIFile>}
 */
function streamAttachmentToTempFile(attachment) {
  return new Promise((resolve, reject) => {
    // Создаём уникальный временный файл
    const tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile).clone();
    tmpFile.append("thunderbird-template.eml");
    tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);

    // Открываем выходной поток
    const outStream = Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
    outStream.init(tmpFile, -1, -1, 0);

    // Используем стандартный механизм Thunderbird для чтения вложений —
    // тот же, что использует attachment.save() в существующем коде
    const uri = Services.io.newURI(attachment.uri);
    const channel = Services.io.newChannelFromURI(
      uri,
      null,
      Services.scriptSecurityManager.getSystemPrincipal(),
      null,
      Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
      Ci.nsIContentPolicy.TYPE_OTHER
    );

    channel.asyncOpen({
      onStartRequest(request) {},

      onDataAvailable(request, inputStream, offset, count) {
        // Pipe напрямую из входного потока в файл
        const sStream = Cc["@mozilla.org/scriptableinputstream;1"]
          .createInstance(Ci.nsIScriptableInputStream);
        sStream.init(inputStream);
        outStream.write(sStream.read(count), count);
      },

      onStopRequest(request, statusCode) {
        outStream.close();

        if (!Components.isSuccessCode(statusCode)) {
          tmpFile.remove(false);
          reject(
            new Error(`Failed to read .eml attachment: 0x${statusCode.toString(16)}`)
          );
          return;
        }

        resolve(tmpFile);
      },
    });
  });
}

/**
 * Copies a .eml file into the Templates folder using nsIMsgCopyService.
 * Sets nsMsgMessageFlags.Template so Thunderbird treats it as a template,
 * not a regular message.
 *
 * This is exactly what DoSaveAsTemplate() does in MsgComposeCommands.js.
 *
 * @param {nsIFile} emlFile
 * @param {nsIMsgFolder} templatesFolder
 * @returns {Promise<void>}
 */
function copyFileAsTemplate(emlFile, templatesFolder) {
  return new Promise((resolve, reject) => {
    // nsIMsgCopyServiceListener — стандартный интерфейс колбэков
    const copyListener = {
      QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),

      OnStartCopy() {},

      OnProgress(progress, progressMax) {},

      // Ключевой колбэк — вызывается после завершения копирования
      SetMessageKey(msgKey) {
        // msgKey — ключ нового сообщения в базе.
        // Можно использовать для последующего открытия шаблона если нужно.
      },

      GetMessageId() {
        return null;
      },

      OnStopCopy(statusCode) {
        if (Components.isSuccessCode(statusCode)) {
          resolve();
        } else {
          reject(
            new Error(`copyFileMessage failed: 0x${statusCode.toString(16)}`)
          );
        }
      },
    };

    // Это тот же вызов что делает Thunderbird при сохранении шаблона
    MailServices.copy.copyFileMessage(
      emlFile,                          // nsIFile — source
      templatesFolder,                  // nsIMsgFolder — destination
      null,                             // msgToReplace (null = новое сообщение)
      false,                            // isDraft
      Ci.nsMsgMessageFlags.Template,    // ← ключевой флаг: Template, не Draft
      "",                               // keywords
      copyListener,
      null                              // msgWindow (null — без UI прогресса)
    );
  });
}
```

---

## Полная схема потока данных
```
Клик "Save as Template"
        │
        ▼
HandleEmlAttachmentSaveAsTemplate()
        │
        ├─→ getTemplatesFolderForCurrentMessage()
        │         │
        │         └─→ identity.stationeryFolder  ← тот же путь что в Compose
        │
        ▼
saveEmlAttachmentAsTemplate(attachment, folder)
        │
        ├─→ streamAttachmentToTempFile()
        │         │
        │         └─→ channel.asyncOpen()  ← стандартный механизм вложений
        │                   │
        │                   └─→ /tmp/thunderbird-template.eml
        │
        ├─→ copyFileAsTemplate(tmpFile, templatesFolder)
        │         │
        │         └─→ MailServices.copy.copyFileMessage()
        │                   │         ← тот же путь что DoSaveAsTemplate()
        │                   └─→ Templates/
        │                         └─→ [новое письмо с флагом Template]
        │
        └─→ tmpFile.remove()
```

---

## Итог изменений
```
comm/mail/base/content/
  ├── msgHdrView.xhtml  ← +1 menuitem (5 строк)
  ├── msgHdrView.js     ← +4 функции (~100 строк)
comm/mail/locales/en-US/mail/messenger.ftl  ← +3 строки
