import { useRef, useState } from 'react';
import { apiClient } from "../lib/apiClient";

interface LitterUploadProps {
  userLocation?: [number, number] | null;
  onUploadSuccess?: () => void;
}

function LitterUpload({ userLocation, onUploadSuccess }: LitterUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const beforeFileInputRef = useRef<HTMLInputElement | null>(null);
  const afterFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle litter upload
  const handleLitterUpload = async () => {
    if (!beforeImage || !afterImage) {
      alert('Please select both before and after images');
      return;
    }

    setIsUploading(true);
    try {
      // Use user location if available, otherwise use dummy coordinates
      const latitude = userLocation ? userLocation[1] : 22.22;
      const longitude = userLocation ? userLocation[0] : 13.1;

      // Create FormData for litter upload
      const formData = new FormData();
      formData.append('beforeImg', beforeImage);
      formData.append('afterImg', afterImage);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      // Send litter upload request
      const litterResponse = await apiClient.litter.upload(formData);

      console.log('Litter upload result:', litterResponse.data);

      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset form
      setBeforeImage(null);
      setAfterImage(null);
      setBeforePreview(null);
      setAfterPreview(null);

      alert('Litter report submitted successfully! Thank you for helping clean the environment.');

    } catch (error) {
      console.error('Error in litter upload:', error);
      alert('Failed to upload litter report. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle before image selection
  const handleBeforeImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }

      setBeforeImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBeforePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle after image selection
  const handleAfterImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }

      setAfterImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAfterPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBeforeClick = () => {
    beforeFileInputRef.current?.click();
  };

  const handleAfterClick = () => {
    afterFileInputRef.current?.click();
  };

  if (!userLocation) {
    return null; // Don't show the component if location is not available
  }

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={beforeFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBeforeImageSelect}
        className="hidden"
      />
      <input
        ref={afterFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAfterImageSelect}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-3">
        {/* Before Image */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-center">Before Photo</h4>
          <div
            onClick={handleBeforeClick}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors bg-gray-50 hover:bg-red-50"
          >
            {beforePreview ? (
              <img
                src={beforePreview}
                alt="Before"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="text-xs">Add Before</div>
              </div>
            )}
          </div>
        </div>

        {/* After Image */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-center">After Photo</h4>
          <div
            onClick={handleAfterClick}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors bg-gray-50 hover:bg-green-50"
          >
            {afterPreview ? (
              <img
                src={afterPreview}
                alt="After"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="text-xs">Add After</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleLitterUpload}
        disabled={isUploading || !beforeImage || !afterImage}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-3 rounded-lg shadow-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Submitting Report...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit Litter Report
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="text-xs text-gray-600 text-center">
        <p>Take a photo of litter before cleaning, then another after cleaning to report environmental improvement.</p>
      </div>
    </div>
  );
}

export default LitterUpload;