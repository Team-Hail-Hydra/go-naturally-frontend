import { useRef, useState } from 'react';
import { apiClient } from "../lib/apiClient";
import axios from 'axios';
import { Leaf } from 'lucide-react';

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
          <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-400/30">
            <Leaf className="h-8 w-8 text-green-400" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-white font-medium text-lg">Upload Plant Image</h3>
            <p className="text-white/60 text-sm">Click to select an image from your device</p>
            <p className="text-white/40 text-xs">Supports JPG, PNG up to 10MB</p>
          </div>
        </div>

        {isIdentifying && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-white/20 border-t-green-400 mx-auto" />
              <div className="text-white font-medium">Identifying Plant...</div>
              <div className="text-white/60 text-sm">This may take a few moments</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlantUpload;
