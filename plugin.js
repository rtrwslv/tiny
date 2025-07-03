tinymce.PluginManager.add('customimage', function(editor) {

  // Функция выбора файла
  function showFilePicker(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => callback(input.files[0] || null);
    input.click();
  }

  // Основная функция для отображения диалога
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
            type: 'submit',
            text: 'Вставить в текст',
            primary: true,
            name: 'insert'
          },
          {
            type: 'submit',
            text: 'Добавить как вложение',
            name: 'attachment'
          }
        ],
        onSubmit(api) {
          const formData = api.getData();
          console.log('Данные формы:', formData); // Для отладки

          const reader = new FileReader();
          reader.onload = function(e) {
            if (formData.insert) {
              // Вставка изображения в текст
              editor.insertContent(
                `<img src="${e.target.result}" alt="${file.name}" title="${file.name}" />`
              );
              api.close(); // Закрыть диалог после вставки
            } else if (formData.attachment) {
              // Добавление как вложение
              console.log('Добавление вложения:', file.name); // Для отладки
              editor.insertContent(
                `<div class="attachment-placeholder">Вложение: <strong>${file.name}</strong></div>`
              );
              api.close(); // Закрыть диалог после добавления
            }
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }

  // Регистрация кнопки в редакторе
  editor.ui.registry.addButton('customimage', {
    icon: 'image',
    tooltip: 'Вставить изображение',
    onAction: insertImage
  });
});
