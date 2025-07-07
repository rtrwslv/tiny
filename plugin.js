tinymce.PluginManager.add('customimage', function(editor) {
  function showFilePicker(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => callback(input.files[0] || null);
    input.click();
  }

  function insertImage() {
    showFilePicker(file => {
      if (!file) return;
      editor.windowManager.open({
        title: 'Выберите действие',
        body: {
          type: 'panel',
          items: [
            {
              type: 'htmlpanel',
              html: `<p>Выбран файл: <strong>${file.name}</strong></p>`
            }
          ]
        },
        buttons: [
          {
            type: 'custom',
            text: 'Вставить в текст',
            primary: true,
            name: 'insert'
          },
          {
            type: 'custom',
            text: 'Добавить как вложение',
            name: 'attachment'
          }
        ],
        onAction: (api, details) => {
          if (details.name === "attachment") {
            console.log("Файл добавлен как вложение:", file);
          } else if (details.name === "insert") {
            const imgTag = `<img src="${URL.createObjectURL(file)}" alt="${file.name}" />`;
            editor.insertContent(imgTag);
          }
          api.close();
        },
      });
    });
  }

  editor.ui.registry.addButton('customimage', {
    icon: 'image',
    tooltip: 'Вставить изображение',
    onAction: insertImage
  });
});
