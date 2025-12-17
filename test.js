const { Gloda } = ChromeUtils.import("resource:///modules/gloda/gloda.js");

// 1️⃣ Получаем текущую папку и сервер
let currentFolder = gFolderDisplay.selectedFolder;
let server = currentFolder.server;

// 2️⃣ Рекурсивный обход всех папок аккаунта
function getAllFolders(folder) {
  let result = [];
  function walk(f) {
    result.push(f);
    if (f.subFolders && f.subFolders.length) {
      for (let sub of f.subFolders) walk(sub);
    }
  }
  walk(folder);
  return result;
}

let folders = getAllFolders(server.rootFolder);

// 3️⃣ Создаём GlodaQuery
let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);

// Пример термов поиска (можно заменить на QuickFilter термы)
query.subjectMatches("Test");

// Ограничиваем поиск папками
for (let f of folders) query.folder(f);

// 4️⃣ Получаем коллекцию с onQueryCompleted
let collection = query.getCollection({
  onQueryCompleted: function() {
    console.log("Поиск завершён. Всего найдено:", collection.items.length);

    // 5️⃣ Статистика по папкам
    let folderCounts = {};

    for (let msg of collection.items) {
      let folderName = msg.folder ? msg.folder.name : "Unknown";
      if (folderName === currentFolder.name) continue; // исключаем текущую папку

      if (!folderCounts[folderName]) folderCounts[folderName] = 0;
      folderCounts[folderName]++;
    }

    // 6️⃣ Выводим таблицу
    console.table(
      Object.entries(folderCounts).map(([folder, count]) => ({
        folder,
        count
      }))
    );
  }
});
