import { useRef, useState } from 'react';
import { apiClient } from "../lib/apiClient";
import { Camera } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={handleUploadClick}
        className="relative group cursor-pointer"
      >
        <div className="w-full h-48 border-2 border-dashed border-white/30 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/30 hover:border-white/50 transition-all duration-300 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-400/30">
            <Camera className="h-8 w-8 text-blue-400" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-white font-medium text-lg">Upload Animal Photo</h3>
            <p className="text-white/60 text-sm">Click to select an image from your device</p>
            <p className="text-white/40 text-xs">Supports JPG, PNG up to 10MB</p>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-400 mx-auto" />
              <div className="text-white font-medium">Uploading Animal Photo...</div>
              <div className="text-white/60 text-sm">Processing your wildlife capture</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimalUpload;
