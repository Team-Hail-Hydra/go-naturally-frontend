import { useRef, useState } from 'react';
import { apiClient } from "../lib/apiClient";
import axios from 'axios';

interface PlantData {
  plant: {
    plant: {
      id: string;
      plantName: string;
      description: string;
      imageUrl: string;
      latitude: number;
      longitude: number;
      rarity: number;
      createdById: string;
    };
    ecopoints: number;
  };
}

interface PlantUploadProps {
  userLocation?: [number, number] | null;
  onUploadSuccess?: (data: PlantData) => void;
}

function PlantUpload({ userLocation, onUploadSuccess }: PlantUploadProps) {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle plant identification
  const handlePlantIdentification = async (file: File) => {
    setIsIdentifying(true);
    try {
      // Convert image to base64
      const base64Image = await fileToBase64(file);

      // Use user location if available, otherwise use dummy coordinates
      const latitude = userLocation ? userLocation[1] : 49.207;
      const longitude = userLocation ? userLocation[0] : 16.608;

      // Call Plant.ID API
      const plantIdResponse = await axios.post('https://plant.id/api/v3/identification', {
        images: [`data:image/jpeg;base64,${base64Image}`],
        latitude: latitude,
        longitude: longitude,
        similar_images: true,
      }, {
        headers: {
          'Api-Key': import.meta.env.VITE_PLANT_ID_API_KEY || 'your_api_key_here',
        }
      });

      console.log('Plant identification result:', plantIdResponse.data);

      if (!plantIdResponse.data.result?.classification?.suggestions?.[0]?.name) {
        throw new Error('No plant identification results found');
      }

      // Extract plant name from the first suggestion
      const plantName = plantIdResponse.data.result.classification.suggestions[0].name;

      // Create FormData for rarity check
      const formData = new FormData();
      formData.append('file', file); // Send the actual file
      formData.append('plantName', plantName);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      // Send rarity check request
      const rarityResponse = await apiClient.plants.upload(formData);

      console.log('Rarity check result:', rarityResponse.data);

      // Call the success callback if provided
      if (onUploadSuccess && rarityResponse.data) {
        onUploadSuccess(rarityResponse.data as PlantData);
      }

    } catch (error) {
      console.error('Error in plant processing:', error);
      alert('Failed to process plant. Please try again.');
    } finally {
      setIsIdentifying(false);
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

      handlePlantIdentification(file);
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
        disabled={isIdentifying}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        {isIdentifying ? (
          <>
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Identifying...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Identify Plant
          </>
        )}
      </button>
    </div >
  );
}

export default PlantUpload;
