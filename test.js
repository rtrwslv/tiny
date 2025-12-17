const { Gloda } = ChromeUtils.import(
  "resource:///modules/gloda/gloda.js"
);

// -------------------------
// 1. Подготовка поиска
// -------------------------

// searchTerms — это массив объектов с информацией о термах
// Пример:
// [{ field: "subject", value: "test" }, { field: "body", value: "hello" }]
// Ты можешь получить их из DBViewWrapper:
// let searchTerms = gDBView.searchTerms.map(term => ({
//   field: term.attrib, value: term.value.str
// }));

let searchTerms = [
  { field: "subject", value: "Test" },
  { field: "body", value: "Hello" }
];

// Получаем все папки текущего аккаунта
let folders = [];
let account = gCurrentFolder.server; // например текущая папка
for (let folder of account.folders) {
  folders.push(folder);
}

// -------------------------
// 2. Создание GlodaQuery
// -------------------------

let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);

// Преобразуем термы в GlodaQuery
for (let term of searchTerms) {
  switch (term.field) {
    case "subject":
      query.subjectMatches(term.value);
      break;
    case "body":
      query.bodyMatches(term.value);
      break;
    case "from":
      query.fromMatches(term.value);
      break;
    case "to":
      query.toMatches(term.value);
      break;
    default:
      console.warn("Unknown term field:", term.field);
  }
}

// Ограничиваем поиск папками
query.folders(folders);

// -------------------------
// 3. Асинхронная коллекция результатов
// -------------------------

let collection = query.getCollection();

collection.addListener({
  onItemsAdded: function (items) {
    for (let msg of items) {
      // msg — Gloda message object
      console.log(
        new Date(msg.date).toLocaleString(),
        msg.from ? msg.from[0].name : "",
        msg.subject,
        msg.folder ? msg.folder.name : ""
      );
    }
  },
  onItemsModified: function () {},
  onItemsRemoved: function () {},
  onQueryCompleted: function () {
    console.log("Поиск завершён. Всего найдено:", collection.items.length);
  }
});
