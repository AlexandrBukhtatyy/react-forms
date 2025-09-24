import { makeFileUploader, type FileUploaderRequest, type FileUploaderResponse } from "../core/make-file-uploader";

export const fileUploader = makeFileUploader(async (params: FileUploaderRequest): Promise<FileUploaderResponse> => {
  try {
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate progress callback
    if (params.onProgress) {
      params.onProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      params.onProgress(100);
    }

    // Mock successful upload response
    const uploadedFiles = params.files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      url: `https://example.com/uploads/${file.name}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type
    }));

    return {
      data: uploadedFiles,
      success: true
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
});