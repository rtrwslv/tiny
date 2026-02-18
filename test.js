try {
  fileOutputStream = Cc["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Ci.nsIFileOutputStream);
  fileOutputStream.init(emlFile, 0x02 | 0x08 | 0x20, 0o600, 0);

  binaryStream = Cc["@mozilla.org/binaryoutputstream;1"]
    .createInstance(Ci.nsIBinaryOutputStream);
  binaryStream.setOutputStream(fileOutputStream);

  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(newContent);
  
  binaryStream.writeByteArray(utf8Bytes, utf8Bytes.length);
} finally {
  if (binaryStream) {
    try { binaryStream.close(); } catch {}
  }
  if (fileOutputStream) {
    try { fileOutputStream.close(); } catch {}
  }
}

// ДИАГНОСТИКА
console.log("=== WHAT WE WROTE ===");
console.log("newFrom:", newFrom);
console.log("identity.email:", identity.email);
console.log("identity.fullName:", identity.fullName);

// Проверяем все identity для этого сервера
console.log("=== ALL IDENTITIES ===");
const ids = MailServices.accounts.getIdentitiesForServer(msgHdr.folder.server);
for (let id of ids) {
  console.log(`ID: ${id.email}, name: ${id.fullName}`);
}
