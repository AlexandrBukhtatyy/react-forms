import { makeResource, type ResourceRequest, type ResourceResponse } from "../make-resource";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url?: string;
}

export const inputSearchResource = makeResource<SearchResult>(async (params: ResourceRequest): Promise<ResourceResponse<SearchResult>> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock search results based on query
    const query = params.query?.toLowerCase() || '';
    const mockResults: SearchResult[] = [
      { id: '1', title: 'React Documentation', description: 'Official React documentation', url: 'https://react.dev' },
      { id: '2', title: 'TypeScript Handbook', description: 'Learn TypeScript', url: 'https://typescriptlang.org' },
      { id: '3', title: 'MDN Web Docs', description: 'Web development resources', url: 'https://developer.mozilla.org' },
      { id: '4', title: 'Stack Overflow', description: 'Programming Q&A', url: 'https://stackoverflow.com' },
      { id: '5', title: 'GitHub', description: 'Code repositories', url: 'https://github.com' }
    ];

    // Filter results based on query
    const filteredResults = query
      ? mockResults.filter(item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        )
      : mockResults;

    // Apply pagination
    const page = params.pagination?.page || 1;
    const limit = params.pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    return {
      data: paginatedResults,
      total: filteredResults.length,
      page,
      limit,
      hasNext: endIndex < filteredResults.length,
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
      error: error instanceof Error ? error.message : 'Search failed'
    };
  }
});