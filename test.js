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
    
    copyToTemplatesFolderForTemplate(tmpFile, templatesFolder).then(() => {
      try { tmpFile.remove(false); } catch {}
      delete window._lastEmlAttachment;

      const tabInfo = window.tabmail?.currentTabInfo;
      if (tabInfo) {
        window.tabmail.closeTab(tabInfo);
      }

      Services.prompt.alert(window, "Success", "Message saved as template.");
    }).catch(e => {
      console.error("Copy error:", e);
      try { tmpFile.remove(false); } catch {}
      Services.prompt.alert(window, "Error", `Copy failed: ${e.message}`);
    });

  } catch (e) {
    console.error("saveEmlFromStoredAttachment:", e);
    Services.prompt.alert(window, "Error", `Failed: ${e.message}`);
  }
}
