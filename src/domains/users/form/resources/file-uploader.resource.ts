/**
 * Загрузчик файлов для пользователей
 */
export const fileUploader = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Имитация загрузки
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      url: URL.createObjectURL(file),
      name: file.name
    };
  }
};
