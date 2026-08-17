const StorageService = require('./storage.service');

async function uploadFile(req, res, next) {
  try {
    const { category, fileName, data, mimeType } = req.body;

    if (!category || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: category and data (base64 or buffer) are required.'
      });
    }

    const fileResult = await StorageService.uploadFile({
      category,
      fileName,
      data,
      mimeType
    });

    return res.json({
      success: true,
      file: fileResult
    });
  } catch (err) {
    next(err);
  }
}

async function listFiles(req, res, next) {
  try {
    const { category } = req.params;
    const files = await StorageService.listCategoryFiles(category);
    return res.json({
      success: true,
      category,
      files
    });
  } catch (err) {
    next(err);
  }
}

async function getCategories(req, res) {
  return res.json({
    success: true,
    categories: StorageService.getCategories()
  });
}

module.exports = {
  uploadFile,
  listFiles,
  getCategories
};
