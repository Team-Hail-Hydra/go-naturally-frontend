import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Plus, X, Leaf, Trash2, Squirrel, MapPin, Award, Clock, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import PlantUpload from './PlantUpload';
import AnimalUpload from './AnimalUpload';
import LitterUpload from './LitterUpload';

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

interface FloatingAddButtonProps {
  userLocation?: [number, number] | null;
}

const FloatingAddButton = ({ userLocation }: FloatingAddButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [animalData, setAnimalData] = useState<AnimalData | null>(null);
  const [litterSubmitted, setLitterSubmitted] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setActiveSection(null);
      setPlantData(null);
      setAnimalData(null);
      setLitterSubmitted(false);
    }
  };

  const handleSectionClick = (section: string) => {
    setActiveSection(section);
  };

  const handleBackToMenu = () => {
    setActiveSection(null);
    setPlantData(null);
    setAnimalData(null);
    setLitterSubmitted(false);
  };

  const handlePlantUploadSuccess = (data: PlantData) => {
    setPlantData(data);
  };

  const handleAnimalUploadSuccess = (data: AnimalData) => {
    setAnimalData(data);
  };

  const handleLitterUploadSuccess = () => {
    setLitterSubmitted(true);
  };

  const sections = [
    {
      id: 'plant',
      title: 'Plant Image',
      icon: Leaf,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Identify and upload plant images'
    },
    {
      id: 'animal',
      title: 'Animal Image',
      icon: Squirrel,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Capture and upload animal photos'
    },
    {
      id: 'litter',
      title: 'Litter Image',
      icon: Trash2,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Report litter with before/after photos'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Main floating button - centered */}
      <motion.div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={toggleMenu}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-slate-700/90 hover:bg-slate-600/90 backdrop-blur-sm border border-slate-600 transition-all duration-300"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-white"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>

      {/* Radial popup menu */}
      <AnimatePresence>
        {isOpen && !activeSection && (
          <>
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              // Calculate position for radial layout - all items above the center button
              // Spread items in a semi-circle above the button
              const angle = (index * 60) + 60; // 60 degrees apart, starting from 60° to 180°
              const radius = 100;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: x, y: -y }} // Negative y to place above
                  exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${-y}px))`,
                  }}
                >
                  <motion.button
                    onClick={() => handleSectionClick(section.id)}
                    className="w-12 h-12 rounded-full bg-slate-700/90 backdrop-blur-sm border border-slate-600 shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:bg-slate-600/90"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </motion.button>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Section content modals */}
      <AnimatePresence>
        {isOpen && activeSection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToMenu}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Section content */}
              {activeSection === 'plant' && (
                <div className="space-y-4">
                  {!plantData ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Upload a plant image to identify the species and contribute to our ecosystem database.
                      </p>
                      <PlantUpload
                        userLocation={userLocation}
                        onUploadSuccess={handlePlantUploadSuccess}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-green-600 mb-2">Plant Identified!</h3>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">+{plantData.plant.ecopoints} EcoPoints</span>
                        </div>
                      </div>

                      <div className="relative">
                        <img
                          src={plantData.plant.plant.imageUrl}
                          alt={plantData.plant.plant.plantName}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          Rarity: {plantData.plant.plant.rarity}/5
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-center">{plantData.plant.plant.plantName}</h4>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{plantData.plant.plant.latitude.toFixed(6)}, {plantData.plant.plant.longitude.toFixed(6)}</span>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm leading-relaxed">
                            {plantData.plant.plant.description.length > 200
                              ? `${plantData.plant.plant.description.substring(0, 200)}...`
                              : plantData.plant.plant.description
                            }
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleBackToMenu}
                            className="flex-1"
                            variant="outline"
                          >
                            Upload Another
                          </Button>
                          <Button
                            onClick={toggleMenu}
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'animal' && (
                <div className="space-y-4">
                  {!animalData ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Capture wildlife photos to help track biodiversity in your area.
                      </p>
                      <AnimalUpload
                        userLocation={userLocation}
                        onUploadSuccess={handleAnimalUploadSuccess}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-blue-600 mb-2">Animal Identified!</h3>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">+{animalData.animal.ecopoints} EcoPoints</span>
                        </div>
                      </div>

                      <div className="relative">
                        <img
                          src={animalData.animal.animal.imageUrl}
                          alt={animalData.animal.animal.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          Rarity: {animalData.animal.animal.rarity}/5
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-center">{animalData.animal.animal.name}</h4>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{animalData.animal.animal.latitude.toFixed(6)}, {animalData.animal.animal.longitude.toFixed(6)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Life Span: {animalData.animal.animal.average_life_span}</span>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm leading-relaxed">
                            {animalData.animal.animal.description.length > 200
                              ? `${animalData.animal.animal.description.substring(0, 200)}...`
                              : animalData.animal.animal.description
                            }
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleBackToMenu}
                            className="flex-1"
                            variant="outline"
                          >
                            Upload Another
                          </Button>
                          <Button
                            onClick={toggleMenu}
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'litter' && (
                <div className="space-y-4">
                  {!litterSubmitted ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Report litter in your area with before and after cleanup photos.
                      </p>
                      <LitterUpload
                        userLocation={userLocation}
                        onUploadSuccess={handleLitterUploadSuccess}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-green-600 mb-2">Thank You!</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Your litter report has been submitted successfully. Thank you for helping clean our environment!
                        </p>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleBackToMenu}
                            className="flex-1"
                            variant="outline"
                          >
                            Report More
                          </Button>
                          <Button
                            onClick={toggleMenu}
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAddButton;