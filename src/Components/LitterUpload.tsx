import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { getCurrentLocation, type GeolocationError } from '@/utils/geolocation';
import axios from 'axios';

interface LitterUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LitterUpload({ isOpen, onClose }: LitterUploadProps) {
  // Form state
  const [formData, setFormData] = useState({
    beforeImg: null as File | null,
    afterImg: null as File | null,
    latitude: '',
    longitude: ''
  });

  // UI state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Location state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false);

  // Preview URLs for images
  const [beforeImgPreview, setBeforeImgPreview] = useState<string | null>(null);
  const [afterImgPreview, setAfterImgPreview] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (type: 'beforeImg' | 'afterImg') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      // Update form data
      setFormData(prev => ({ ...prev, [type]: file }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      if (type === 'beforeImg') {
        if (beforeImgPreview) URL.revokeObjectURL(beforeImgPreview);
        setBeforeImgPreview(previewUrl);
      } else {
        if (afterImgPreview) URL.revokeObjectURL(afterImgPreview);
        setAfterImgPreview(previewUrl);
      }

      setError(null);
    }
  };

  // Fetch current location
  const fetchCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      });

      setFormData(prev => ({
        ...prev,
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6)
      }));
      setIsLocationFetched(true);
    } catch (error) {
      const geoError = error as GeolocationError;
      let userFriendlyMessage = geoError.message;
      
      // Provide more helpful error messages
      switch (geoError.code) {
        case 1:
          userFriendlyMessage = 'Please enable location access to auto-fill coordinates';
          break;
        case 2:
          userFriendlyMessage = 'Location unavailable. Please enter coordinates manually';
          break;
        case 3:
          userFriendlyMessage = 'Location request timed out. Please try again or enter manually';
          break;
        default:
          userFriendlyMessage = 'Could not get location. Please enter coordinates manually';
      }
      
      setLocationError(userFriendlyMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.beforeImg || !formData.afterImg) {
      setError('Please select both before and after images');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please provide location coordinates');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('beforeImg', formData.beforeImg);
      uploadData.append('afterImg', formData.afterImg);
      uploadData.append('latitude', formData.latitude);
      uploadData.append('longitude', formData.longitude);

      const response = await axios.post(
        'http://localhost:3000/api/v1/litter/upload',
        uploadData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Litter upload successful:', response.data);
      setSuccess('Litter report uploaded successfully!');
      
      // Reset form after success
      resetForm();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error uploading litter report:', error);
      setError('Failed to upload litter report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      beforeImg: null,
      afterImg: null,
      latitude: '',
      longitude: ''
    });
    
    // Clean up preview URLs
    if (beforeImgPreview) URL.revokeObjectURL(beforeImgPreview);
    if (afterImgPreview) URL.revokeObjectURL(afterImgPreview);
    setBeforeImgPreview(null);
    setAfterImgPreview(null);
    
    setError(null);
    setSuccess(null);
    setIsLocationFetched(false);
    setLocationError(null);
  };

  // Auto-fetch location when modal opens
  useEffect(() => {
    if (isOpen && !isLocationFetched && formData.latitude === '' && formData.longitude === '') {
      fetchCurrentLocation();
    }
  }, [isOpen, isLocationFetched, formData.latitude, formData.longitude]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (beforeImgPreview) URL.revokeObjectURL(beforeImgPreview);
      if (afterImgPreview) URL.revokeObjectURL(afterImgPreview);
    };
  }, [beforeImgPreview, afterImgPreview]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Report Litter Cleanup
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Before Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Before Image *
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect('beforeImg')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {beforeImgPreview && (
                    <div className="w-full h-32 border border-gray-300 rounded overflow-hidden">
                      <img
                        src={beforeImgPreview}
                        alt="Before preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* After Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After Image *
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect('afterImg')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {afterImgPreview && (
                    <div className="w-full h-32 border border-gray-300 rounded overflow-hidden">
                      <img
                        src={afterImgPreview}
                        alt="After preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Location status and controls */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {locationLoading && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Getting your location...
                    </div>
                  )}
                  {locationError && (
                    <div className="text-xs text-red-600 leading-tight">
                      {locationError}
                    </div>
                  )}
                  {isLocationFetched && !locationError && !locationLoading && formData.latitude && formData.longitude && (
                    <div className="text-xs text-green-600">
                      ✓ Current location auto-filled
                    </div>
                  )}
                  {!isLocationFetched && !locationLoading && !locationError && (
                    <div className="text-xs text-gray-500">
                      Click to get current location or enter manually
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  disabled={locationLoading}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={locationLoading ? 'Getting location...' : 'Get current location'}
                >
                  {locationLoading ? '⏳' : '📍'} {locationLoading ? 'Getting...' : 'Get Location'}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-2 text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  'Submit Litter Report'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}