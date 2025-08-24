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
    const response = await apiClient.get(`/spaces/${spaceId}/categories`);
    return response.data;
  },

  getCategoriesByBudget: async (
    spaceId: string,
    budgetId: string,
  ): Promise<Category[]> => {
    const response = await apiClient.get(
      `/spaces/${spaceId}/categories/budget/${budgetId}`,
    );
    return response.data;
  },

  getCategory: async (
    spaceId: string,
    categoryId: string,
  ): Promise<Category> => {
    const response = await apiClient.get(
      `/spaces/${spaceId}/categories/${categoryId}`,
    );
    return response.data;
  },

  getCategorySpending: async (
    spaceId: string,
    categoryId: string,
  ): Promise<any> => {
    const response = await apiClient.get(
      `/spaces/${spaceId}/categories/${categoryId}/spending`,
    );
    return response.data;
  },

  createCategory: async (
    spaceId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> => {
    const response = await apiClient.post(`/spaces/${spaceId}/categories`, dto);
    return response.data;
  },

  updateCategory: async (
    spaceId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> => {
    const response = await apiClient.patch(
      `/spaces/${spaceId}/categories/${categoryId}`,
      dto,
    );
    return response.data;
  },

  deleteCategory: async (
    spaceId: string,
    categoryId: string,
  ): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/categories/${categoryId}`);
  },
};