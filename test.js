const { Gloda } = ChromeUtils.import("resource:///modules/gloda/gloda.js");

// 1. Получаем текущую папку и сервер
let currentFolder = gFolderDisplay.selectedFolder;
let server = currentFolder.server;

// 2. Рекурсивный обход всех папок аккаунта
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

// 3. Создаём GlodaQuery
let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
query.subjectMatches("Test");

// Ограничиваем поиск папками
for (let f of folders) {
  query.folder(f);
}

// 4. Запускаем поиск через коллекцию с onQueryCompleted
let collection = query.getCollection({
  onQueryCompleted: function() {
    console.log("Поиск завершён. Всего найдено:", collection.items.length);

    // Выводим таблицу результатов
    let rows = collection.items.map(msg => ({
      date: new Date(msg.date).toLocaleString(),
      from: msg.from ? msg.from[0].name : "",
      subject: msg.subject,
      folder: msg.folder ? msg.folder.name : ""
    }));

    console.table(rows);
  }
});
