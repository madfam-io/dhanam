import { apiClient } from './client';
import { Category } from '@dhanam/shared';

export interface CreateCategoryDto {
  budgetId: string;
  name: string;
  budgetedAmount: number;
  color?: string;
  icon?: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  budgetedAmount?: number;
  color?: string;
  icon?: string;
  description?: string;
}

export const categoriesApi = {
  getCategories: async (spaceId: string): Promise<Category[]> => {
    return apiClient.get<Category[]>(`/spaces/${spaceId}/categories`);
  },

  getCategoriesByBudget: async (spaceId: string, budgetId: string): Promise<Category[]> => {
    return apiClient.get<Category[]>(`/spaces/${spaceId}/categories/budget/${budgetId}`);
  },

  getCategory: async (spaceId: string, categoryId: string): Promise<Category> => {
    return apiClient.get<Category>(`/spaces/${spaceId}/categories/${categoryId}`);
  },

  getCategorySpending: async (spaceId: string, categoryId: string): Promise<any> => {
    return apiClient.get<any>(`/spaces/${spaceId}/categories/${categoryId}/spending`);
  },

  createCategory: async (spaceId: string, dto: CreateCategoryDto): Promise<Category> => {
    return apiClient.post<Category>(`/spaces/${spaceId}/categories`, dto);
  },

  updateCategory: async (
    spaceId: string,
    categoryId: string,
    dto: UpdateCategoryDto
  ): Promise<Category> => {
    return apiClient.patch<Category>(`/spaces/${spaceId}/categories/${categoryId}`, dto);
  },

  deleteCategory: async (spaceId: string, categoryId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/categories/${categoryId}`);
  },
};
