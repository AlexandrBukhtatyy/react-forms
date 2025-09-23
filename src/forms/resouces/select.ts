import { makeResource, type ResourceRequest, type ResourceResponse } from "../make-resource";

interface SelectOption {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  group?: string;
}

export const selectResource = makeResource<SelectOption>(async (params: ResourceRequest): Promise<ResourceResponse<SelectOption>> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock select options
    const mockOptions: SelectOption[] = [
      { id: '1', label: 'Apple', value: 'apple', group: 'Fruits' },
      { id: '2', label: 'Banana', value: 'banana', group: 'Fruits' },
      { id: '3', label: 'Orange', value: 'orange', group: 'Fruits' },
      { id: '4', label: 'Carrot', value: 'carrot', group: 'Vegetables' },
      { id: '5', label: 'Broccoli', value: 'broccoli', group: 'Vegetables' },
      { id: '6', label: 'Spinach', value: 'spinach', group: 'Vegetables', disabled: true },
      { id: '7', label: 'Red', value: 'red', group: 'Colors' },
      { id: '8', label: 'Blue', value: 'blue', group: 'Colors' },
      { id: '9', label: 'Green', value: 'green', group: 'Colors' }
    ];

    // Filter by query if provided
    const query = params.query?.toLowerCase() || '';
    const filteredOptions = query
      ? mockOptions.filter(option =>
          option.label.toLowerCase().includes(query) ||
          option.value.toLowerCase().includes(query) ||
          option.group?.toLowerCase().includes(query)
        )
      : mockOptions;

    // Filter by group if specified in filters
    const groupFilter = params.filters?.group;
    const finalOptions = groupFilter
      ? filteredOptions.filter(option => option.group === groupFilter)
      : filteredOptions;

    // Apply sorting
    const sortedOptions = params.sort
      ? finalOptions.sort((a, b) => {
          const aValue = a[params.sort!.field as keyof SelectOption] as string;
          const bValue = b[params.sort!.field as keyof SelectOption] as string;
          const comparison = aValue.localeCompare(bValue);
          return params.sort!.order === 'desc' ? -comparison : comparison;
        })
      : finalOptions;

    // Apply pagination
    const page = params.pagination?.page || 1;
    const limit = params.pagination?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOptions = sortedOptions.slice(startIndex, endIndex);

    return {
      data: paginatedOptions,
      total: sortedOptions.length,
      page,
      limit,
      hasNext: endIndex < sortedOptions.length,
      hasPrev: page > 1,
      success: true
    };
  } catch (error) {
    return {
      data: [],
      total: 0,
      page: 1,
      limit: params.pagination?.limit || 20,
      hasNext: false,
      hasPrev: false,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load options'
    };
  }
});