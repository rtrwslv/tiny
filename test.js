const { Gloda } = ChromeUtils.import("resource:///modules/gloda/gloda.js");

// Текущая папка
let currentFolder = gFolderDisplay.selectedFolder;
let server = currentFolder.server;

// Рекурсивный обход всех папок
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

// Создаём GlodaQuery
let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
query.subjectMatches("Test");

// Ограничиваем поиск папками
for (let f of folders) query.folder(f);

// Получаем коллекцию
let collection = query.getCollection();

// Регистрируем listener
collection.addListener({
  onItemsAdded(items) {
    for (let msg of items) {
      console.log(
        new Date(msg.date).toLocaleString(),
        msg.from ? msg.from[0].name : "",
        msg.subject,
        msg.folder ? msg.folder.name : ""
      );
    }
  },
  onQueryCompleted() {
    console.log("Поиск завершён. Всего найдено:", collection.items.length);
  },
  onItemsModified() {},
  onItemsRemoved() {}
});



