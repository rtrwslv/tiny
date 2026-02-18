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

// ПРОВЕРКА: читаем файл обратно
try {
  const checkStream = Cc["@mozilla.org/network/file-input-stream;1"]
    .createInstance(Ci.nsIFileInputStream);
  checkStream.init(emlFile, 0x01, 0, 0);
  
  const checkScriptable = Cc["@mozilla.org/scriptableinputstream;1"]
    .createInstance(Ci.nsIScriptableInputStream);
  checkScriptable.init(checkStream);
  
  const saved = checkScriptable.read(2000);
  checkScriptable.close();
  checkStream.close();
  
  console.log("=== SAVED FILE (first 2000 chars) ===");
  console.log(saved);
  console.log("=== IDENTITY EMAIL ===");
  console.log(identity.email);
} catch (e) {
  console.log("Check failed:", e);
}
