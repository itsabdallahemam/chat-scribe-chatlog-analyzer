import React, { useState } from 'react';
import { Card as UICard } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PlusCircle, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { useUserFeatures } from '../contexts/UserFeatureContext';
import LoadingSpinner from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

interface FeatureFormData {
  featureName: string;
  featureValue: string;
}

const UserFeaturesManager: React.FC = () => {
  const { features, loading, error, refreshFeatures, addOrUpdateFeature, removeFeature } = useUserFeatures();
  const [formData, setFormData] = useState<FeatureFormData>({ featureName: '', featureValue: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.featureName.trim() || !formData.featureValue.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrUpdateFeature(formData.featureName, formData.featureValue);
      // Reset form if it was an add operation
      if (isAddingNew) {
        setFormData({ featureName: '', featureValue: '' });
        setIsAddingNew(false);
      }
    } catch (err) {
      // Error is already handled in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (featureName: string, featureValue: string) => {
    setFormData({ featureName, featureValue });
    setIsAddingNew(false);
  };

  const handleDelete = async (featureName: string) => {
    if (window.confirm(`Are you sure you want to delete "${featureName}"?`)) {
      try {
        await removeFeature(featureName);
        // Reset form if we were editing this feature
        if (formData.featureName === featureName) {
          setFormData({ featureName: '', featureValue: '' });
          setIsAddingNew(false);
        }
      } catch (err) {
        // Error is already handled in the context
      }
    }
  };

  const cancelForm = () => {
    setFormData({ featureName: '', featureValue: '' });
    setIsAddingNew(false);
  };

  return (
    <UICard className="p-6 shadow-lg dark:bg-gray-900/80 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold dark:text-white">User Features</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Manage your personalized features and settings
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refreshFeatures()}
          className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={loading}
        >
          {loading ? <LoadingSpinner size={18} /> : <RefreshCw size={18} />}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Feature Form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3 dark:text-white">
          {isAddingNew ? 'Add New Feature' : 'Edit Feature'}
        </h3>
        <div className="grid gap-4">
          <div>
            <label htmlFor="featureName" className="text-sm font-medium block mb-1 dark:text-gray-200">
              Feature Name
            </label>
            <Input
              id="featureName"
              name="featureName"
              placeholder="e.g., dark_mode, notifications_enabled"
              value={formData.featureName}
              onChange={handleFormChange}
              disabled={isSubmitting || (!isAddingNew && formData.featureName !== '')}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="featureValue" className="text-sm font-medium block mb-1 dark:text-gray-200">
              Feature Value
            </label>
            <Input
              id="featureValue"
              name="featureValue"
              placeholder="e.g., true, enabled, 5"
              value={formData.featureValue}
              onChange={handleFormChange}
              disabled={isSubmitting}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.featureName.trim() || !formData.featureValue.trim()}
              className="bg-app-blue hover:bg-app-blue/90 dark:bg-app-blue/80 dark:hover:bg-app-blue/70 text-white font-medium"
            >
              {isSubmitting ? <LoadingSpinner size={18} className="mr-2" /> : null}
              {formData.featureName ? 'Save' : 'Add'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancelForm}
              disabled={isSubmitting}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>

      {/* Add New Feature Button */}
      <Button
        variant="outline"
        onClick={() => {
          setFormData({ featureName: '', featureValue: '' });
          setIsAddingNew(true);
        }}
        disabled={isAddingNew || isSubmitting}
        className="mb-4 border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-100"
      >
        <PlusCircle size={18} className="mr-2" />
        Add New Feature
      </Button>

      {/* Features List */}
      <div className="space-y-2 overflow-y-auto flex-1">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Your Features</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner size={24} />
          </div>
        ) : features.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-6 text-center">
            No features found. Add your first feature above.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="py-3 grid grid-cols-[1fr,auto] gap-2 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded"
              >
                <div>
                  <div className="font-medium dark:text-white">{feature.featureName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {feature.featureValue}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(feature.featureName, feature.featureValue)}
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(feature.featureName)}
                    className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UICard>
  );
};

export default UserFeaturesManager; 