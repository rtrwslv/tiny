async function saveEmlFromStoredAttachment() {
  try {
    const attachment = window._lastEmlAttachment;
    
    const tmpFile = await streamAttachmentToTempFileForTemplate(attachment);

    const templatesFolder = getTemplatesFolderForTemplate();
    if (!templatesFolder) {
      try { tmpFile.remove(false); } catch {}
      Services.prompt.alert(window, "Error", "Templates folder not found.");
      return;
    }

    await replaceFromAndDateHeadersForTemplate(tmpFile);
    
    try {
      await copyToTemplatesFolderForTemplate(tmpFile, templatesFolder);
    } catch (copyError) {
      console.error("Copy error:", copyError);
      try { tmpFile.remove(false); } catch {}
      Services.prompt.alert(window, "Error", `Copy failed: ${copyError.message}`);
      return;
    }

    try { tmpFile.remove(false); } catch {}

    delete window._lastEmlAttachment;

    const tabInfo = window.tabmail?.currentTabInfo;
    if (tabInfo) {
      window.tabmail.closeTab(tabInfo);
    }

    Services.prompt.alert(window, "Success", "Message saved as template.");

  } catch (e) {
    console.error("saveEmlFromStoredAttachment:", e);
    Services.prompt.alert(window, "Error", `Failed: ${e.message}`);
  }
}
