import { useRef, useState } from 'react';
import { apiClient } from "../lib/apiClient";

interface AnimalData {
  animal: {
    animal: {
      id: string;
      name: string;
      description: string;
      average_life_span: string;
      imageUrl: string;
      createdById: string;
      latitude: number;
      longitude: number;
      rarity: number;
    };
    ecopoints: number;
  };
  rarity: number;
  ecoPointsAwarded: number;
}

interface AnimalUploadProps {
  userLocation?: [number, number] | null;
  onUploadSuccess?: (data: AnimalData) => void;
}

function AnimalUpload({ userLocation, onUploadSuccess }: AnimalUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle animal upload
  const handleAnimalUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Use user location if available, otherwise use dummy coordinates
      const latitude = userLocation ? userLocation[1] : 22.22;
      const longitude = userLocation ? userLocation[0] : 13.1;

      // Create FormData for animal upload
      const formData = new FormData();
      formData.append('image', file); // Field name is 'image' as specified
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      // Send animal upload request
      const animalResponse = await apiClient.animals.upload(formData);

      console.log('Animal upload result:', animalResponse.data);

      // Call the success callback if provided
      if (onUploadSuccess && animalResponse.data) {
        onUploadSuccess(animalResponse.data as AnimalData);
      }

    } catch (error) {
      console.error('Error in animal upload:', error);
      alert('Failed to upload animal image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      handleAnimalUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!userLocation) {
    return null; // Don't show the button if location is not available
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Uploading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Animal Photo
          </>
        )}
      </button>
    </div>
  );
}

export default AnimalUpload;
