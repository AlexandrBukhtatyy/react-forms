export interface FileUploaderRequest {
  files: File[];
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

export interface FileUploaderResponse {
  data: {
    id: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }[];
  success: boolean;
  error?: string;
}

export interface FileUploader {
  upload: (files: File[], options?: Omit<FileUploaderRequest, 'files'>) => Promise<FileUploaderResponse>;
  abort: () => void;
  isUploading: boolean;
}

export function makeFileUploader(
  callback: (params: FileUploaderRequest) => Promise<FileUploaderResponse>
): FileUploader {
  let isUploading = false;
  let abortController: AbortController | null = null;

  const upload = async (
    files: File[],
    options?: Omit<FileUploaderRequest, 'files'>
  ): Promise<FileUploaderResponse> => {
    if (isUploading) {
      throw new Error('Upload already in progress');
    }

    isUploading = true;
    abortController = new AbortController();

    try {
      const request: FileUploaderRequest = {
        files,
        ...options
      };

      const response = await callback(request);
      return response;
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      isUploading = false;
      abortController = null;
    }
  };

  const abort = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isUploading = false;
    }
  };

  return {
    upload,
    abort,
    get isUploading() {
      return isUploading;
    }
  };
}
