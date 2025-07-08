export const API_ENDPOINTS = {
  products: {
    getAll: '/products',
    getById: (id: number) => `/products/${id}`,
    getByCategory: (category: string) => `/products/category/${category}`,
    create: '/products',
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`
  },
  auth: {
    login: '/auth/login',
    register: '/users',
    profile: '/users/me'
  },
  users: {
    getAll: '/users',
    getById: (id: number) => `/users/${id}`,
    updateProfile: '/users/profile'
  },
  categories: {
    getAll: '/products/categories',
    getProducts: (category: string) => `/products/category/${category}`
  }
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
