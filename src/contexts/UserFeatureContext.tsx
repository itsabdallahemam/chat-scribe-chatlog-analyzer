import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserFeature } from '../lib/types';
import { getUserFeatures, upsertUserFeature, deleteUserFeature } from '../services/userFeatureService';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/use-toast';

interface UserFeatureContextType {
  features: UserFeature[];
  loading: boolean;
  error: string | null;
  refreshFeatures: () => Promise<void>;
  addOrUpdateFeature: (featureName: string, featureValue: string) => Promise<void>;
  removeFeature: (featureName: string) => Promise<void>;
  getFeatureValue: (featureName: string, defaultValue?: string) => string | undefined;
}

const UserFeatureContext = createContext<UserFeatureContextType | undefined>(undefined);

export const UserFeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<UserFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load features when the user is authenticated
  useEffect(() => {
    if (user) {
      refreshFeatures();
    } else {
      setFeatures([]);
      setLoading(false);
    }
  }, [user]);

  const refreshFeatures = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserFeatures();
      setFeatures(data);
    } catch (err) {
      setError('Failed to load user features');
      toast({
        title: 'Error',
        description: 'Failed to load user features',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateFeature = async (featureName: string, featureValue: string) => {
    setError(null);
    
    try {
      const updatedFeature = await upsertUserFeature(featureName, featureValue);
      
      // Update the features array with the new/updated feature
      setFeatures(prevFeatures => {
        const exists = prevFeatures.some(f => f.featureName === featureName);
        
        if (exists) {
          return prevFeatures.map(f => 
            f.featureName === featureName ? updatedFeature : f
          );
        } else {
          return [...prevFeatures, updatedFeature];
        }
      });
      
      toast({
        title: 'Success',
        description: `Feature "${featureName}" saved successfully`,
      });
    } catch (err) {
      setError('Failed to save feature');
      toast({
        title: 'Error',
        description: 'Failed to save feature',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const removeFeature = async (featureName: string) => {
    setError(null);
    
    try {
      await deleteUserFeature(featureName);
      
      // Remove the feature from the features array
      setFeatures(prevFeatures => 
        prevFeatures.filter(f => f.featureName !== featureName)
      );
      
      toast({
        title: 'Success',
        description: `Feature "${featureName}" removed successfully`,
      });
    } catch (err) {
      setError('Failed to remove feature');
      toast({
        title: 'Error',
        description: 'Failed to remove feature',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Helper function to get a feature value by name
  const getFeatureValue = (featureName: string, defaultValue?: string): string | undefined => {
    const feature = features.find(f => f.featureName === featureName);
    return feature?.featureValue ?? defaultValue;
  };

  return (
    <UserFeatureContext.Provider
      value={{
        features,
        loading,
        error,
        refreshFeatures,
        addOrUpdateFeature,
        removeFeature,
        getFeatureValue
      }}
    >
      {children}
    </UserFeatureContext.Provider>
  );
};

export const useUserFeatures = () => {
  const context = useContext(UserFeatureContext);
  if (context === undefined) {
    throw new Error('useUserFeatures must be used within a UserFeatureProvider');
  }
  return context;
}; 