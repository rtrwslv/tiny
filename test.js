async function SaveAsTemplate() {
  // ── Проверка 1: это окно с открытым .eml вложением? ─────────
  // Когда .eml открывается двойным кликом, он открывается в специальном окне
  // Проверяем есть ли opener (родительское окно) и attachment там
  
  if (window.opener && window.opener.attachmentList) {
    const parentAttachment = window.opener.attachmentList.selectedItem?.attachment;
    
    if (parentAttachment && 
        (parentAttachment.name?.toLowerCase().endsWith(".eml") ||
         parentAttachment.contentType === "message/rfc822")) {
      
      // Это .eml вложение — используем нашу логику
      await saveEmlAttachmentAsTemplateFromWindow(parentAttachment);
      return;
    }
  }

  // ── Проверка 2: это само окно с вложением которое мы открыли? ─
  // Если окно открыто из вложения, может быть messageURI специфичный
  if (window.arguments && window.arguments[0]) {
    const messageURI = window.arguments[0];
    
    // Проверяем это attachment: URI
    if (messageURI.includes("type=message/rfc822") || 
        messageURI.includes(".eml")) {
      
      await saveEmlFromMessageURI(messageURI);
      return;
    }
  }

  // ── Стандартная логика для обычных писем ───────────────────
  // Если ничего из выше не сработало — это обычное письмо
  // Здесь должен быть существующий код SaveAsTemplate
  // НЕ УДАЛЯЙ ЕГО — просто наш код идёт перед ним
  
  const msgHdr = gMessage || GetSelectedMessages()[0];
  if (!msgHdr) {
    return;
  }

  // ... остальной существующий код SaveAsTemplate ...
}

// ── Вспомогательные функции ────────────────────────────────

async function saveEmlAttachmentAsTemplateFromWindow(attachment) {
  // Получаем папку Templates из родительского окна
  const parentWindow = window.opener;
  const templatesFolder = parentWindow.getTemplatesFolderForCurrentMessage 
    ? parentWindow.getTemplatesFolderForCurrentMessage()
    : await getDefaultTemplatesFolder();

  if (!templatesFolder) {
    Services.prompt.alert(
      window,
      "Error",
      "Templates folder not found. Please configure Templates folder in account settings."
    );
    return;
  }

  try {
    // Используем функции из родительского окна если доступны
    if (parentWindow.saveEmlAttachmentAsTemplate) {
      await parentWindow.saveEmlAttachmentAsTemplate(attachment, templatesFolder);
    } else {
      // Fallback — вызываем напрямую
      const tmpFile = await streamAttachmentToTempFile(attachment);
      try {
        await replaceFromHeader(tmpFile);
        await copyFileAsTemplate(tmpFile, templatesFolder);
      } finally {
        try { tmpFile.remove(false); } catch {}
      }
    }

    window.close();
    
    Services.prompt.alert(
      window.opener || window,
      "Success",
      `"${attachment.name}" saved as template.`
    );
  } catch (e) {
    Services.prompt.alert(
      window,
      "Error",
      `Failed to save template: ${e.message}`
    );
  }
}

async function saveEmlFromMessageURI(messageURI) {
  // Этот случай сложнее — нужно извлечь .eml из URI
  // Пока заглушка
  Services.prompt.alert(
    window,
    "Not Implemented",
    "Saving .eml from message URI not yet implemented. Please use context menu in the main window."
  );
}

async function getDefaultTemplatesFolder() {
  const defaultAccount = MailServices.accounts.defaultAccount;
  if (!defaultAccount) {
    return null;
  }

  try {
    const rootFolder = defaultAccount.incomingServer.rootFolder;
    return rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
  } catch (e) {
    return null;
  }
}

// ── Импорт функций из msgHdrView.js если нужно ───────────────
// Если streamAttachmentToTempFile, replaceFromHeader, copyFileAsTemplate
// не доступны в этом скоупе — нужно либо:
// 1. Перенести их в общий модуль
// 2. Или импортировать через ChromeUtils.import
// 3. Или дублировать здесь

// Пример импорта (если функции экспортированы как модуль):
// const { streamAttachmentToTempFile, replaceFromHeader, copyFileAsTemplate } =
//   ChromeUtils.import("resource:///modules/AttachmentUtils.jsm");
