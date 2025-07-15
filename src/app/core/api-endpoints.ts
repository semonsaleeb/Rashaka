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
    register: '/register',
    profile: '/profile'
  },
  users: {
    getAll: '/users',
    getById: (id: number) => `/users/${id}`,
    updateProfile: '/users/profile'
  },
  categories: {
    getAll: '/categories',
    getProducts: (category: string) => `/category/${category}`
  },
  blogs: {
    getAll: '/blogs',
    getById: (id: number) => `/blogs/${id}`
  }
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;