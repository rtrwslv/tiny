async function copyToTemplatesFolderForTemplate(emlFile, templatesFolder) {
  console.log("=== copyToTemplatesFolder START ===");
  console.log("templatesFolder:", templatesFolder.name);
  console.log("server.type:", templatesFolder.server?.type);

  if (templatesFolder.server?.type === "imap") {
    console.log("IMAP folder detected, initializing...");
    
    await ensureIMAPFolderReady(templatesFolder);
  }

  MailServices.copy.copyFileMessage(
    emlFile,
    templatesFolder,
    null,
    false,
    Ci.nsMsgMessageFlags.Template,
    "",
    null,
    null
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function ensureIMAPFolderReady(folder) {
  try {
    if (!folder.msgDatabase) {
      console.log("Opening msgDatabase...");
      folder.msgDatabase = folder.getMsgDatabase(null);
    }
    
    folder.updateFolder(null);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("IMAP folder ready");
  } catch (e) {
    console.error("ensureIMAPFolderReady error:", e);
  }
}
