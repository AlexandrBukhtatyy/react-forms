export interface Filters {
  login: string;
  email: string;
  status: '' | 'active' | 'inactive';
  role: '' | 'admin' | 'user' | 'moderator';
  registrationDate: string; // ISO date string or empty
}

export interface User {
  id: number;
  login: string;
  email: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'user' | 'moderator';
  registrationDate: string; // ISO date string
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const allUsers: User[] = [
  { id: 1, login: 'alice', email: 'alice@example.com', status: 'active', registrationDate: '2023-01-15', role: 'admin' },
  { id: 2, login: 'bob', email: 'bob@example.com', status: 'inactive', registrationDate: '2023-02-20', role: 'user' },
  { id: 3, login: 'charlie', email: 'charlie@example.com', status: 'active', registrationDate: '2023-03-10', role: 'moderator' },
  { id: 4, login: 'dave', email: 'dave@example.com', status: 'active', registrationDate: '2023-04-25', role: 'user' },
  { id: 5, login: 'eve', email: 'eve@example.com', status: 'inactive', registrationDate: '2023-05-05', role: 'admin' },
  { id: 6, login: 'frank', email: 'frank@example.com', status: 'active', registrationDate: '2023-06-01', role: 'user' },
  { id: 7, login: 'grace', email: 'grace@example.com', status: 'inactive', registrationDate: '2023-07-07', role: 'moderator' },
  { id: 8, login: 'heidi', email: 'heidi@example.com', status: 'active', registrationDate: '2023-08-18', role: 'user' },
  { id: 9, login: 'ivan', email: 'ivan@example.com', status: 'inactive', registrationDate: '2023-09-11', role: 'admin' },
  { id: 10, login: 'judy', email: 'judy@example.com', status: 'active', registrationDate: '2023-10-01', role: 'moderator' },
  { id: 11, login: 'kathy', email: 'kathy@example.com', status: 'inactive', registrationDate: '2023-11-15', role: 'user' },
  { id: 12, login: 'leo', email: 'leo@example.com', status: 'active', registrationDate: '2023-12-01', role: 'moderator' },
];

interface FetchResult {
  users: User[];
  totalCount: number;
  totalPages: number;
}

export const fetchUsers = async (filters: Filters, page: number, pageSize: number): Promise<FetchResult> => {
  const filteredUsers = allUsers.filter(user => {
    const { login, email, status, role, registrationDate } = filters;

    const matchesLogin = !login || user.login.toLowerCase().includes(login.toLowerCase());
    const matchesEmail = !email || user.email.toLowerCase().includes(email.toLowerCase());
    const matchesStatus = !status || user.status === status;
    const matchesRole = !role || user.role === role;
    const matchesDate = !registrationDate || new Date(user.registrationDate) >= new Date(registrationDate);

    return matchesLogin && matchesEmail && matchesStatus && matchesRole && matchesDate;
  });

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const usersForPage = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  await delay(1000);

  return { users: usersForPage, totalCount, totalPages };
};

// Новая функция для работы с ResourceParams
export interface ResourceParams {
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export const fetchUsersResource = async (params: ResourceParams): Promise<{ items: User[]; total: number }> => {
  const filters: Filters = {
    login: params.filters?.login || '',
    email: params.filters?.email || '',
    status: params.filters?.status || '',
    role: params.filters?.role || '',
    registrationDate: params.filters?.registrationDate || ''
  };

  const result = await fetchUsers(filters, params.page, params.pageSize);

  return {
    items: result.users,
    total: result.totalCount
  };
};

export interface CreateUserData {
  login: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'user' | 'moderator';
}

export const createUser = async (data: CreateUserData): Promise<User> => {
  await delay(1000); // Имитация API запроса

  const newUser: User = {
    id: allUsers.length + 1,
    login: data.login,
    email: data.email,
    status: data.status,
    role: data.role,
    registrationDate: new Date().toISOString().split('T')[0]
  };

  allUsers.push(newUser);

  return newUser;
};