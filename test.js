async function copyToTemplatesFolderForTemplate(emlFile, templatesFolder) {
  console.log("=== copyToTemplatesFolder START ===");
  console.log("emlFile:", emlFile.path);
  console.log("templatesFolder:", templatesFolder.name);
  console.log("templatesFolder.server.type:", templatesFolder.server?.type);

  try {
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
    
    console.log("copyFileMessage called, waiting for completion...");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("Copy should be complete");
    
  } catch (e) {
    console.error("copyFileMessage error:", e);
    throw e;
  }
}
