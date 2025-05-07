const TemplateCreator = {
  db: null,
  templates: [],

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('tinymce_templates_db', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  async getAllTemplates() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction('templates', 'readonly');
      const store = transaction.objectStore('templates');
      const request = store.getAll();

      request.onsuccess = () => {
        this.templates = request.result;
        resolve(this.templates);
      };

      request.onerror = (event) => {
        console.error('Error getting templates:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  async saveTemplate(template) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction('templates', 'readwrite');
      const store = transaction.objectStore('templates');
      const request = store.add(template);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('Error saving template:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  async deleteTemplate(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction('templates', 'readwrite');
      const store = transaction.objectStore('templates');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('Error deleting template:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  async init(editor) {
    const self = this;
    
    try {
      await this.initDB();
      await this.getAllTemplates();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }

    editor.ui.registry.addButton('templatecreator', {
      text: 'Шаблоны',
      onAction: () => self.showInsertTemplateDialog(editor)
    });

    editor.ui.registry.addButton('savetemplate', {
      text: 'Сохранить шаблон',
      onAction: () => self.showCreateTemplateDialog(editor)
    });
  },

  async showInsertTemplateDialog(editor) {
    const self = this;
    
    try {
      await this.getAllTemplates();
    } catch (error) {
      console.error('Failed to load templates:', error);
      editor.notificationManager.open({
        text: 'Ошибка загрузки шаблонов',
        type: 'error',
        timeout: 2000
      });
      return;
    }

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
      onAction: async (api, details) => {
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
            const template = self.templates[selectedIndex];
            const title = template.title;
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
              onSubmit: async (confirmApi) => {
                try {
                  await self.deleteTemplate(template.id);
                  await self.getAllTemplates();
                  confirmApi.close();
                  api.close();
                  self.showInsertTemplateDialog(editor);
                } catch (error) {
                  console.error('Failed to delete template:', error);
                  editor.notificationManager.open({
                    text: 'Ошибка удаления шаблона',
                    type: 'error',
                    timeout: 2000
                  });
                }
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

  async showCreateTemplateDialog(editor) {
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
      onSubmit: async (api) => {
        const data = api.getData();
        const content = editor.getContent({ format: 'html' }).trim();
        const title = data.title.trim();
        if (!title || !content) {
          editor.windowManager.alert('Название и содержимое шаблона не должны быть пустыми!');
          return;
        }

        const newTemplate = {
          title: title,
          description: data.description.trim(),
          content: content
        };

        try {
          await self.saveTemplate(newTemplate);
          await self.getAllTemplates();
          api.close();

          editor.notificationManager.open({
            text: 'Шаблон сохранён',
            type: 'success',
            timeout: 2000
          });
        } catch (error) {
          console.error('Failed to save template:', error);
          editor.notificationManager.open({
            text: 'Ошибка сохранения шаблона',
            type: 'error',
            timeout: 2000
          });
        }
      }
    });
  }
};

tinymce.PluginManager.add('templatecreator', (editor) => {
  const instance = Object.create(TemplateCreator);
  instance.init(editor);
  return instance;
});