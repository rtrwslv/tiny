function waitForFolderTree(callback) {
  if (!folderPane.isInitialized) {
    setTimeout(() => waitForFolderTree(callback), 50);
    return;
  }

  // Проверяем что строки реально есть в DOM:
  const rows = document.querySelectorAll(`li[is="folder-tree-row"]`);
  if (rows.length === 0) {
    setTimeout(() => waitForFolderTree(callback), 50);
    return;
  }

  callback();
}
