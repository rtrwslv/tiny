const { MailServices } = ChromeUtils.import(
  "resource:///modules/MailServices.jsm"
);

// 1️⃣ Берём Local Folders сервер
let localServer = MailServices.accounts.accounts
  .find(acc => acc.incomingServer.type === "none")
  .incomingServer;

// 2️⃣ Рекурсивная функция перебора папок
function getNonEmptyFolders(folder, result = []) {
  try {
    // Проверяем, есть ли база сообщений
    if (folder.msgDatabase) {
      let enumerator = folder.msgDatabase.EnumerateMessages();
      if (enumerator.hasMoreElements()) {
        result.push(folder); // добавляем папку в результат, если есть письма
      }
    }
  } catch (e) {
    // Папка не загружена → пропускаем
  }

  // Рекурсивно обходим subFolders
  if (folder.subFolders) {
    for (let sub of folder.subFolders) {
      getNonEmptyFolders(sub, result);
    }
  }

  return result;
}

// 3️⃣ Запускаем рекурсию с rootFolder
let nonEmptyFolders = getNonEmptyFolders(localServer.rootFolder);

// 4️⃣ Выводим результат
console.log("Папки с письмами из Local Folders:");
nonEmptyFolders.forEach(f => console.log(f.prettyName || f.name));
