function waitForFolderTree(callback) {
  if (folderPane.isInitialized) {
    callback();
    return;
  }

  const timer = setTimeout(() => {
    waitForFolderTree(callback);
  }, 50);
}

// Использование:
waitForFolderTree(() => {
  // folderTree полностью готов
  for (const row of document.querySelectorAll(`li[is="folder-tree-row"]`)) {
    row.removeAttribute("open");
  }
});
