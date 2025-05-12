import api from '../lib/axios';
import { UserFeature } from '../lib/types';

/**
 * Get all features for the current authenticated user
 */
export const getUserFeatures = async (): Promise<UserFeature[]> => {
  try {
    const response = await api.get<UserFeature[]>('/user-features');
    return response.data;
  } catch (error) {
    console.error('Error fetching user features:', error);
    throw error;
  }
};

/**
 * Add or update a feature for the current authenticated user
 */
export const upsertUserFeature = async (
  featureName: string,
  featureValue: string
): Promise<UserFeature> => {
  try {
    const response = await api.post<UserFeature>('/user-features', {
      featureName,
      featureValue,
    });
    return response.data;
  } catch (error) {
    console.error('Error upserting user feature:', error);
    throw error;
  }
};

/**
 * Delete a feature for the current authenticated user
 */
export const deleteUserFeature = async (
  featureName: string
): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>('/user-features', {
      params: { featureName }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting user feature:', error);
    throw error;
  }
}; 