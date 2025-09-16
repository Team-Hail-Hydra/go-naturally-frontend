import { useRef, useState } from 'react';
import { apiClient } from "../lib/apiClient";
import { ImagePlus, Upload } from 'lucide-react';

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

      <div className="grid grid-cols-2 gap-4">
        {/* Before Image */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-center text-white">Before Photo</h4>
          <div
            onClick={handleBeforeClick}
            className="group relative w-full h-40 border-2 border-dashed border-white/30 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/30 hover:border-red-400/60 transition-all duration-300 flex items-center justify-center cursor-pointer"
          >
            {beforePreview ? (
              <img
                src={beforePreview}
                alt="Before"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-red-400/30">
                  <ImagePlus className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-white/80 text-xs">Add Before Photo</div>
              </div>
            )}
          </div>
        </div>

        {/* After Image */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-center text-white">After Photo</h4>
          <div
            onClick={handleAfterClick}
            className="group relative w-full h-40 border-2 border-dashed border-white/30 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/30 hover:border-green-400/60 transition-all duration-300 flex items-center justify-center cursor-pointer"
          >
            {afterPreview ? (
              <img
                src={afterPreview}
                alt="After"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-green-400/30">
                  <ImagePlus className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-white/80 text-xs">Add After Photo</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleLitterUpload}
        disabled={isUploading || !beforeImage || !afterImage}
        className="relative w-full bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-500/90 hover:to-orange-500/90 disabled:from-gray-500/50 disabled:to-gray-600/50 backdrop-blur-sm border border-white/20 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isUploading ? (
          <>
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Submitting Report...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span>Submit Litter Report</span>
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <p className="text-xs text-white/60 text-center leading-relaxed">
          Take a photo of litter before cleaning, then another after cleaning to report environmental improvement.
        </p>
      </div>
    </div>
  );
}

export default LitterUpload;