const newHeaders = headers.replace(
  /^From:.*?(?=\r?\n[^\s]|\n[^\s]|\r?\n\r?\n|\n\n|$)/ims,
  `From: ${newFrom}`
);

// ВРЕМЕННО: проверим что замена произошла
console.log("=== BEFORE ===");
console.log(headers.substring(0, 300));
console.log("=== AFTER ===");
console.log(newHeaders.substring(0, 300));
console.log("=== NEW FROM ===");
console.log(newFrom);
