async function replaceFromHeader(emlFile, templatesFolder) {
  const identity = MailServices.accounts.getFirstIdentityForServer(
    templatesFolder.server
  );

  if (!identity) {
    return;
  }

  const newFrom = identity.fullName
    ? `${identity.fullName} <${identity.email}>`
    : identity.email;

  const fileInputStream = Cc["@mozilla.org/network/file-input-stream;1"]
    .createInstance(Ci.nsIFileInputStream);
  fileInputStream.init(emlFile, 0x01, 0, 0);

  const scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
    .createInstance(Ci.nsIScriptableInputStream);
  scriptableStream.init(fileInputStream);

  let emlContent = "";
  let chunk;
  while ((chunk = scriptableStream.read(8192))) {
    emlContent += chunk;
  }
  scriptableStream.close();
  fileInputStream.close();

  const headerEnd = emlContent.indexOf("\r\n\r\n");
  if (headerEnd === -1) {
    return;
  }

  const headers = emlContent.substring(0, headerEnd);
  const body = emlContent.substring(headerEnd);

  const newHeaders = headers.replace(
    /^From:.*?(?=\r?\n[^\s]|\r?\n\r?\n|$)/ims,
    `From: ${newFrom}`
  );

  const newContent = newHeaders + body;

  const fileOutputStream = Cc["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Ci.nsIFileOutputStream);
  fileOutputStream.init(emlFile, 0x02 | 0x08 | 0x20, 0o600, 0);

  const converter = Cc["@mozilla.org/intl/converter-output-stream;1"]
    .createInstance(Ci.nsIConverterOutputStream);
  converter.init(fileOutputStream, "UTF-8");
  converter.writeString(newContent);
  converter.close();
}


async function saveEmlAttachmentAsTemplate(attachment, templatesFolder) {
  const tmpFile = await streamAttachmentToTempFile(attachment);

  try {
    // ── НОВОЕ: заменяем From: перед копированием ───────────────
    await replaceFromHeader(tmpFile, templatesFolder);
    // ────────────────────────────────────────────────────────────

    await copyFileAsTemplate(tmpFile, templatesFolder);
  } finally {
    // Всегда удаляем временный файл
    try {
      tmpFile.remove(false);
    } catch (e) {
      console.warn("Failed to remove temp file:", e);
    }
  }
}
