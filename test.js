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

  console.log("=== HEADERS LENGTH ===");
  console.log(headers.length);
  console.log("=== FROM: position ===");
  console.log(headers.indexOf("From:"));

  const lines = headers.split(/\r?\n/);
  console.log("=== TOTAL LINES ===");
  console.log(lines.length);

  const newLines = [];
  let i = 0;
  let foundFrom = false;

  while (i < lines.length) {
    const line = lines[i];

    if (/^From:\s/i.test(line)) {
      console.log("=== FOUND From: at line", i, "===");
      console.log("Line content:", line);
      
      foundFrom = true;
      
      let fullHeader = line;
      let j = i + 1;
      while (j < lines.length && /^\s/.test(lines[j])) {
        fullHeader += "\n" + lines[j];
        j++;
      }
      
      console.log("=== OLD From ===");
      console.log(fullHeader);
      console.log("=== NEW From ===");
      console.log(`From: ${newFrom}`);
      
      newLines.push(`From: ${newFrom}`);
      i = j;
      continue;
    }

    newLines.push(line);
    i++;
  }

  if (!foundFrom) {
    console.log("=== From: NOT FOUND, checking first 10 lines ===");
    for (let k = 0; k < Math.min(10, lines.length); k++) {
      console.log(`Line ${k}:`, lines[k]);
    }
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
