const newFrom = encodedName
  ? `${encodedName} <${identity.email}>`
  : identity.email;

console.log("=== IDENTITY INFO ===");
console.log("email:", identity.email);
console.log("fullName:", identity.fullName);
console.log("encodedName:", encodedName);
console.log("newFrom:", newFrom);

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

// ДИАГНОСТИКА: проверяем что записалось
console.log("=== WRITTEN From: header ===");
const fromMatch = newContent.match(/^From:.*$/m);
console.log(fromMatch ? fromMatch[0] : "NOT FOUND");
