const { Gloda } = ChromeUtils.import("resource:///modules/gloda/gloda.js");

// Получаем текущую папку
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
for (let f of folders) {
  query.folder(f);
}

// Создаём listener
let listener = {
  onItemsAdded: function(items) {
    for (let msg of items) {
      console.log(
        new Date(msg.date).toLocaleString(),
        msg.from ? msg.from[0].name : "",
        msg.subject,
        msg.folder ? msg.folder.name : ""
      );
    }
  },
  onItemsModified: function() {},
  onItemsRemoved: function() {},
  onQueryCompleted: function() {
    console.log("Поиск завершён");
  }
};

// Получаем коллекцию с listener сразу
let collection = query.getCollection({ listener });
