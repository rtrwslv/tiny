async function replaceFromHeader(emlFile) {
  const msgHdr = gMessage;
  if (!msgHdr) {
    return;
  }

  let identity = MailServices.accounts.getFirstIdentityForServer(
    msgHdr.folder.server
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

  const newFrom = identity.fullName
    ? `${identity.fullName} <${identity.email}>`
    : identity.email;

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
  } catch (e) {
    return;
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

  const newHeaders = headers.replace(
    /^From:.*?(?=\r?\n[^\s]|\n[^\s]|\r?\n\r?\n|\n\n|$)/ims,
    `From: ${newFrom}`
  );

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
