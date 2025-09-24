import { makeResource, type ResourceRequest, type ResourceResponse } from "../core/make-resource";

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  isImage: boolean;
  thumbnailUrl?: string;
}

export const filesResource = makeResource<FileInfo>(async (params: ResourceRequest): Promise<ResourceResponse<FileInfo>> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mock file data
    const mockFiles: FileInfo[] = [
      {
        id: '1',
        name: 'document.pdf',
        size: 2048000,
        type: 'application/pdf',
        url: 'https://example.com/files/document.pdf',
        uploadedAt: '2024-01-15T10:30:00Z',
        isImage: false
      },
      {
        id: '2',
        name: 'image.jpg',
        size: 1024000,
        type: 'image/jpeg',
        url: 'https://example.com/files/image.jpg',
        uploadedAt: '2024-01-14T15:20:00Z',
        isImage: true,
        thumbnailUrl: 'https://example.com/files/thumbs/image.jpg'
      },
      {
        id: '3',
        name: 'spreadsheet.xlsx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: 'https://example.com/files/spreadsheet.xlsx',
        uploadedAt: '2024-01-13T09:45:00Z',
        isImage: false
      },
      {
        id: '4',
        name: 'photo.png',
        size: 3072000,
        type: 'image/png',
        url: 'https://example.com/files/photo.png',
        uploadedAt: '2024-01-12T14:10:00Z',
        isImage: true,
        thumbnailUrl: 'https://example.com/files/thumbs/photo.png'
      },
      {
        id: '5',
        name: 'video.mp4',
        size: 10240000,
        type: 'video/mp4',
        url: 'https://example.com/files/video.mp4',
        uploadedAt: '2024-01-11T11:30:00Z',
        isImage: false
      }
    ];

    // Filter by file type if specified
    const typeFilter = params.filters?.type;
    let filteredFiles = typeFilter
      ? mockFiles.filter(file => {
          if (typeFilter === 'images') return file.isImage;
          if (typeFilter === 'documents') return !file.isImage && file.type !== 'video/mp4';
          if (typeFilter === 'videos') return file.type.startsWith('video/');
          return file.type === typeFilter;
        })
      : mockFiles;

    // Filter by search query
    const query = params.query?.toLowerCase() || '';
    if (query) {
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sortedFiles = params.sort
      ? filteredFiles.sort((a, b) => {
          let comparison = 0;
          switch (params.sort!.field) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'size':
              comparison = a.size - b.size;
              break;
            case 'uploadedAt':
              comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
              break;
            default:
              comparison = a.name.localeCompare(b.name);
          }
          return params.sort!.order === 'desc' ? -comparison : comparison;
        })
      : filteredFiles;

    // Apply pagination
    const page = params.pagination?.page || 1;
    const limit = params.pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

    return {
      data: paginatedFiles,
      total: sortedFiles.length,
      page,
      limit,
      hasNext: endIndex < sortedFiles.length,
      hasPrev: page > 1,
      success: true
    };
  } catch (error) {
    return {
      data: [],
      total: 0,
      page: 1,
      limit: params.pagination?.limit || 10,
      hasNext: false,
      hasPrev: false,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load files'
    };
  }
});