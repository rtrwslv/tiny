// ВРЕМЕННО: ищем From: во всех заголовках
console.log("=== FULL HEADERS ===");
console.log(headers);
console.log("=== FROM: position ===");
console.log(headers.indexOf("From:"));
console.log(headers.indexOf("from:"));
console.log(headers.indexOf("FROM:"));
