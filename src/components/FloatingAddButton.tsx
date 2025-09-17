import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Plus, X, Leaf, Trash2, Squirrel, MapPin, Award, Clock, CheckCircle } from 'lucide-react';
import { GlassmorphismModal, GlassCard, GlassButton } from './ui/glassmorphism-modal';
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

  const handleModalClose = () => {
    setIsOpen(false);
    setActiveSection(null);
    setPlantData(null);
    setAnimalData(null);
    setLitterSubmitted(false);
  };

  const sections = [
    {
      id: 'plant',
      title: 'Plant Image',
      icon: Leaf,
      description: 'Identify and upload plant images'
    },
    {
      id: 'animal',
      title: 'Animal Image',
      icon: Squirrel,
      description: 'Capture and upload animal photos'
    },
    {
      id: 'litter',
      title: 'Litter Image',
      icon: Trash2,
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

      {/* Main floating button */}
      <motion.div
        className="fixed bottom-8 left-[50%] translate-x-[-50%] z-50"
      >
        <Button
          onClick={toggleMenu}
          size="icon"
          className="h-16 w-16 rounded-full shadow-lg bg-slate-700 hover:bg-slate-600 backdrop-blur-sm border border-slate-600 transition-all duration-300 flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="text-white"
          >
            {isOpen ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
          </motion.div>
        </Button>
      </motion.div>

      {/* Radial popup menu */}
      <AnimatePresence>
        {isOpen && !activeSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-[50%] -translate-x-1/2 z-40 "
          >
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              // Create a proper radial distribution around the center button
              // Spread buttons in a semi-circle above the main button
              const baseAngle = -90; // Start from straight up
              const angleSpread = 120; // Total spread of 120 degrees
              const angle = baseAngle + (index - 1) * (angleSpread / 2); // Center the middle button
              const radius = 90;
              const x = Math.cos((angle * Math.PI) / 180) * radius - 25;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: 'backOut'
                  }}
                  className="absolute w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-md flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent className="h-6 w-6" />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Modal for Upload Screens */}
      <GlassmorphismModal
        open={isOpen && activeSection !== null}
        setOpen={(open) => {
          if (!open) {
            handleModalClose();
          }
        }}
        title={sections.find((s) => s.id === activeSection)?.title}
        subtitle={sections.find((s) => s.id === activeSection)?.description}
        size="lg"
        onClose={handleModalClose}
      >
        {/* Section content */}
        {activeSection === 'plant' && (
          <div className="space-y-6">
            {!plantData ? (
              <>
                <GlassCard className="p-4">
                  <p className="text-white/80 text-sm text-center">
                    Upload a plant image to identify the species and contribute to our ecosystem database.
                  </p>
                </GlassCard>
                <PlantUpload
                  userLocation={userLocation}
                  onUploadSuccess={handlePlantUploadSuccess}
                />
              </>
            ) : (
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-green-400 mb-2">Plant Identified!</h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Award className="h-6 w-6 text-yellow-400" />
                      <span className="font-bold text-yellow-400 text-lg">+{plantData.plant.ecopoints} EcoPoints</span>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <img
                      src={plantData.plant.plant.imageUrl}
                      alt={plantData.plant.plant.plantName}
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      Rarity: {plantData.plant.plant.rarity}/5
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-2xl font-bold text-center text-white">{plantData.plant.plant.plantName}</h4>
                    <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {plantData.plant.plant.latitude.toFixed(6)}, {plantData.plant.plant.longitude.toFixed(6)}
                      </span>
                    </div>
                    <GlassCard variant="solid" className="p-4">
                      <p className="text-white/90 text-sm leading-relaxed">
                        {plantData.plant.plant.description.length > 200
                          ? `${plantData.plant.plant.description.substring(0, 200)}...`
                          : plantData.plant.plant.description}
                      </p>
                    </GlassCard>
                  </div>
                </GlassCard>

                <div className="flex gap-3">
                  <GlassButton variant="secondary" onClick={handleBackToMenu} className="flex-1">
                    Upload Another
                  </GlassButton>
                  <GlassButton variant="primary" onClick={handleModalClose} className="flex-1">
                    Close
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'animal' && (
          <div className="space-y-6">
            {!animalData ? (
              <>
                <GlassCard className="p-4">
                  <p className="text-white/80 text-sm text-center">
                    Capture wildlife photos to help track biodiversity in your area.
                  </p>
                </GlassCard>
                <AnimalUpload
                  userLocation={userLocation}
                  onUploadSuccess={handleAnimalUploadSuccess}
                />
              </>
            ) : (
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-blue-400 mb-2">Animal Identified!</h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Award className="h-6 w-6 text-yellow-400" />
                      <span className="font-bold text-yellow-400 text-lg">+{animalData.animal.ecopoints} EcoPoints</span>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <img
                      src={animalData.animal.animal.imageUrl}
                      alt={animalData.animal.animal.name}
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      Rarity: {animalData.animal.animal.rarity}/5
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-2xl font-bold text-center text-white">{animalData.animal.animal.name}</h4>
                    <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {animalData.animal.animal.latitude.toFixed(6)}, {animalData.animal.animal.longitude.toFixed(6)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                      <Clock className="h-4 w-4" />
                      <span>Life Span: {animalData.animal.animal.average_life_span}</span>
                    </div>
                    <GlassCard variant="solid" className="p-4">
                      <p className="text-white/90 text-sm leading-relaxed">
                        {animalData.animal.animal.description.length > 200
                          ? `${animalData.animal.animal.description.substring(0, 200)}...`
                          : animalData.animal.animal.description}
                      </p>
                    </GlassCard>
                  </div>
                </GlassCard>

                <div className="flex gap-3">
                  <GlassButton variant="secondary" onClick={handleBackToMenu} className="flex-1">
                    Upload Another
                  </GlassButton>
                  <GlassButton variant="primary" onClick={handleModalClose} className="flex-1">
                    Close
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'litter' && (
          <div className="space-y-6">
            {!litterSubmitted ? (
              <>
                <GlassCard className="p-4">
                  <p className="text-white/80 text-sm text-center">
                    Report litter in your area with before and after cleanup photos.
                  </p>
                </GlassCard>
                <LitterUpload userLocation={userLocation} onUploadSuccess={handleLitterUploadSuccess} />
              </>
            ) : (
              <div className="space-y-6">
                <GlassCard className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto border border-green-400/30">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-400 mb-2">Thank You!</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Your litter report has been submitted successfully. Thank you for helping clean our environment!
                    </p>
                  </div>
                </GlassCard>

                <div className="flex gap-3">
                  <GlassButton variant="secondary" onClick={handleBackToMenu} className="flex-1">
                    Report More
                  </GlassButton>
                  <GlassButton variant="primary" onClick={handleModalClose} className="flex-1">
                    Close
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassmorphismModal>
    </>
  );
};

export default FloatingAddButton;
