import { useState, useEffect } from 'react';
import { ArrowLeft, Dumbbell, Settings, TrendingUp } from 'lucide-react';
import BodyPartCard from './BodyPartCard';
import DifficultyModal from './DifficultyModal';
import ExerciseCard from './ExerciseCard';
import WorkoutLogger from './WorkoutLogger';
import ProgressTracker from './ProgressTracker';
import GoogleSheetsSetup from './GoogleSheetsSetup';
import { exercises } from '@/data/exercises';
import { Button } from '@/components/ui/button';
import { GoogleSheetsService, type GoogleSheetsConfig } from '@/services/googleSheets';
import { WorkoutLog } from '@/data/exercises';

// Import muscle group images
import chestImage from '@/assets/chest.jpg';
import bicepsImage from '@/assets/biceps.jpg';
import tricepsImage from '@/assets/triceps.jpg';
import backImage from '@/assets/back.jpg';
import shouldersImage from '@/assets/shoulders.jpg';
import legsImage from '@/assets/legs.jpg';
import absImage from '@/assets/abs.jpg';

const bodyParts = [
  { name: 'Chest', key: 'chest', image: chestImage },
  { name: 'Biceps', key: 'biceps', image: bicepsImage },
  { name: 'Triceps', key: 'triceps', image: tricepsImage },
  { name: 'Back', key: 'back', image: backImage },
  { name: 'Shoulders', key: 'shoulders', image: shouldersImage },
  { name: 'Legs', key: 'legs', image: legsImage },
  { name: 'Abs', key: 'abs', image: absImage },
];

type Difficulty = 'beginner' | 'intermediate' | 'professional';

const FitnessApp = () => {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentExercises, setCurrentExercises] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'exercises' | 'progress' | 'setup'>('home');
  const [googleSheetsService, setGoogleSheetsService] = useState<GoogleSheetsService | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    // Load Google Sheets config from localStorage
    const savedConfig = localStorage.getItem('googleSheets_config');
    if (savedConfig) {
      try {
        const config: GoogleSheetsConfig = JSON.parse(savedConfig);
        setGoogleSheetsService(new GoogleSheetsService(config));
      } catch (error) {
        console.error('Error loading Google Sheets config:', error);
      }
    }
  }, []);

  const handleBodyPartClick = (bodyPartKey: string, bodyPartName: string) => {
    setSelectedBodyPart(bodyPartKey);
    setShowModal(true);
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    if (selectedBodyPart) {
      setSelectedDifficulty(difficulty);
      setCurrentExercises(exercises[selectedBodyPart]?.[difficulty] || []);
      setCurrentView('exercises');
    }
  };

  const handleLogWorkout = async (workoutLog: WorkoutLog) => {
    setIsLogging(true);
    try {
      if (googleSheetsService) {
        await googleSheetsService.logWorkout(workoutLog);
      } else {
        // Fallback to localStorage only
        const existingLogs = localStorage.getItem('workout_logs');
        const logs = existingLogs ? JSON.parse(existingLogs) : [];
        logs.push(workoutLog);
        localStorage.setItem('workout_logs', JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Error logging workout:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleConfigSave = (config: GoogleSheetsConfig) => {
    setGoogleSheetsService(new GoogleSheetsService(config));
    setCurrentView('home');
  };

  // Show setup view
  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-dark p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('home')}
            className="mb-6 text-foreground hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <GoogleSheetsSetup onConfigSave={handleConfigSave} />
        </div>
      </div>
    );
  }

  // Show progress view
  if (currentView === 'progress') {
    return (
      <div className="min-h-screen bg-gradient-dark p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
              className="text-foreground hover:text-primary"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Progress Tracking</h1>
            <div className="w-[120px]" />
          </div>
          <ProgressTracker 
            googleSheetsService={googleSheetsService}
            selectedMuscleGroup={selectedBodyPart || undefined}
          />
        </div>
      </div>
    );
  }

  const handleBackToHome = () => {
    setSelectedBodyPart(null);
    setSelectedDifficulty(null);
    setCurrentExercises([]);
  };

  const getDifficultyTitle = (difficulty: Difficulty) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getBodyPartName = (key: string) => {
    return bodyParts.find(bp => bp.key === key)?.name || key;
  };

  // Show exercise list if we have selected body part and difficulty
  if (selectedBodyPart && selectedDifficulty && currentExercises.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-dark p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="text-foreground hover:text-primary hover:bg-primary/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Muscle Groups
            </Button>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {getBodyPartName(selectedBodyPart)}
              </h1>
              <p className="text-muted-foreground">
                {getDifficultyTitle(selectedDifficulty)} Level
              </p>
            </div>
            <div className="w-[120px]" /> {/* Spacer for centering */}
          </div>

          {/* Exercise Grid */}
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {currentExercises.map((exercise) => (
              <div key={exercise.id} className="space-y-4">
                <ExerciseCard exercise={exercise} />
                <WorkoutLogger 
                  exercise={exercise} 
                  onLogWorkout={handleLogWorkout}
                  isLogging={isLogging}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show main body parts selection
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        </div>
        <div className="relative px-4 py-16 sm:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Dumbbell className="w-12 h-12 text-primary mr-4 animate-pulse-glow" />
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                FitTracker
              </h1>
            </div>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-4">
              Your Personal Workout Companion
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-8">
              Track your workouts with Google Sheets integration and monitor your progress over time.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                onClick={() => setCurrentView('progress')}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Progress
              </Button>
              <Button 
                onClick={() => setCurrentView('setup')}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Google Sheets Setup
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body Parts Grid */}
      <div className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Choose Your Target
            </h2>
            <p className="text-lg text-muted-foreground">
              Select a muscle group to begin your workout
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bodyParts.map((bodyPart) => (
              <BodyPartCard
                key={bodyPart.key}
                name={bodyPart.name}
                image={bodyPart.image}
                onClick={() => handleBodyPartClick(bodyPart.key, bodyPart.name)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Difficulty Modal */}
      <DifficultyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        bodyPart={selectedBodyPart ? getBodyPartName(selectedBodyPart) : ''}
        onSelectDifficulty={handleDifficultySelect}
      />
    </div>
  );
};

export default FitnessApp;