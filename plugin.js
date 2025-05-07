const TemplateCreator = {
  templates: (function() {
    const stored = Services.xulStore.getValue("chrome://editor/content/editor.xhtml", "tinymce-templates", "data");
    return stored ? JSON.parse(stored) : [];
  })(),

  init(editor) {
    const self = this;

    editor.ui.registry.addButton('templatecreator', {
      text: 'Шаблоны',
      onAction: () => self.showInsertTemplateDialog(editor)
    });

    editor.ui.registry.addButton('savetemplate', {
      text: 'Сохранить шаблон',
      onAction: () => self.showCreateTemplateDialog(editor)
    });
  },
//affп
  saveTemplates() {
    Services.xulStore.setValue("chrome://editor/content/editor.xhtml", "tinymce-templates", "data", JSON.stringify(this.templates));
  },

  showInsertTemplateDialog(editor) {
    const self = this;
    editor.windowManager.open({
      title: 'Мои шаблоны',
      size: 'large',
      body: {
        type: 'panel',
        items: [
          {
            type: 'selectbox',
            name: 'template_select',
            label: 'Выберите шаблон',
            items: self.templates.map((t, i) => ({
              text: t.title + (t.description ? ` (${t.description})` : ''),
              value: i.toString()
            }))
          },
          {
            type: 'bar',
            columns: 2,
            items: [
              {
                type: 'button',
                name: 'preview_btn',
                text: 'Предпросмотр',
                buttonType: 'secondary'
              },
              {
                type: 'button',
                name: 'delete_btn',
                text: 'Удалить',
                buttonType: 'secondary'
              }
            ]
          }
        ]
      },
      buttons: [
        { type: 'cancel', text: 'Закрыть' },
        { type: 'submit', text: 'Вставить', primary: true }
      ],
      onAction: (api, details) => {
        const data = api.getData();
        const selectedIndex = parseInt(data.template_select, 10);

        if (details.name === 'preview_btn') {
          if (!isNaN(selectedIndex) && self.templates[selectedIndex]) {
            editor.windowManager.open({
              title: 'Предпросмотр шаблона',
              body: {
                type: 'panel',
                items: [
                  {
                    type: 'htmlpanel',
                    html: `<div style="padding:10px;border:1px solid #ccc;">${self.templates[selectedIndex].content}</div>`
                  }
                ]
              },
              buttons: [{ type: 'cancel', text: 'Закрыть' }]
            });
          }
        }

        if (details.name === 'delete_btn') {
          if (!isNaN(selectedIndex) && self.templates[selectedIndex]) {
            const title = self.templates[selectedIndex].title;
            editor.windowManager.open({
              title: 'Подтверждение удаления',
              body: {
                type: 'panel',
                items: [
                  {
                    type: 'htmlpanel',
                    html: `<p>Вы уверены, что хотите удалить шаблон <strong>"${title}"</strong>?</p>`
                  }
                ]
              },
              buttons: [
                { type: 'cancel', text: 'Отмена' },
                {
                  type: 'submit',
                  text: 'Удалить',
                  primary: true
                }
              ],
              onSubmit: (confirmApi) => {
                self.templates.splice(selectedIndex, 1);
                self.saveTemplates();
                confirmApi.close();
                api.close();
                self.showInsertTemplateDialog(editor);
              }
            });
          }
        }
      },
      onSubmit: (api) => {
        const data = api.getData();
        const selectedIndex = parseInt(data.template_select, 10);
        if (!isNaN(selectedIndex) && self.templates[selectedIndex]) {
          editor.insertContent(self.templates[selectedIndex].content);
        }
        api.close();
      }
    });
  },

  showCreateTemplateDialog(editor) {
    const self = this;
    editor.windowManager.open({
      title: 'Создать шаблон',
      body: {
        type: 'panel',
        items: [
          { type: 'input', name: 'title', label: 'Название' },
          { type: 'textarea', name: 'description', label: 'Описание' }
        ]
      },
      buttons: [
        { type: 'cancel', text: 'Отмена' },
        { type: 'submit', text: 'Сохранить', primary: true }
      ],
      onSubmit: (api) => {
        const data = api.getData();
        const content = editor.getContent({ format: 'html' }).trim();
        const title = data.title.trim();
        if (!title || !content) {
          editor.windowManager.alert('Название и содержимое шаблона не должны быть пустыми!');
          return;
        }

        self.templates.push({
          title: title,
          description: data.description.trim(),
          content: content
        });
        self.saveTemplates();
        api.close();

        editor.notificationManager.open({
          text: 'Шаблон сохранён',
          type: 'success',
          timeout: 2000
        });
      }
    });
  }
};

tinymce.PluginManager.add('templatecreator', (editor) => {
  const instance = Object.create(TemplateCreator);
  instance.init(editor);
  return instance;
});