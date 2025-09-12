import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Save, Timer } from 'lucide-react';
import { Exercise, WorkoutLog } from '@/data/exercises';
import { useToast } from '@/hooks/use-toast';

interface Set {
  reps: number;
  weight: number;
}

interface WorkoutLoggerProps {
  exercise: Exercise;
  onLogWorkout: (workoutLog: WorkoutLog) => void;
  isLogging?: boolean;
}

const WorkoutLogger = ({ exercise, onLogWorkout, isLogging }: WorkoutLoggerProps) => {
  const [sets, setSets] = useState<Set[]>([{ reps: 0, weight: 0 }]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    setSets(sets.map((set, i) => 
      i === index ? { ...set, [field]: Math.max(0, value) } : set
    ));
  };

  const handleLogWorkout = () => {
    const validSets = sets.filter(set => set.reps > 0);
    
    if (validSets.length === 0) {
      toast({
        title: "Invalid Workout",
        description: "Please add at least one set with reps > 0",
        variant: "destructive",
      });
      return;
    }

    const workoutLog: WorkoutLog = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: validSets,
      date: new Date().toISOString(),
      muscleGroup: exercise.muscleGroup,
    };

    onLogWorkout(workoutLog);
    
    // Reset form
    setSets([{ reps: 0, weight: 0 }]);
    setIsExpanded(false);
    
    toast({
      title: "Workout Logged!",
      description: `${exercise.name}: ${validSets.length} sets completed`,
    });
  };

  if (!isExpanded) {
    return (
      <Card className="bg-glass border-glass backdrop-blur-sm hover:border-primary transition-all duration-300 cursor-pointer"
            onClick={() => setIsExpanded(true)}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-primary" />
            <span className="font-medium">Log Workout</span>
          </div>
          <Button variant="ghost" size="sm">
            Start Logging
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-glass border-glass backdrop-blur-sm border-primary shadow-glow animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">
            Logging: {exercise.name}
          </h4>
          <Badge variant="secondary" className="text-xs">
            {exercise.muscleGroup}
          </Badge>
        </div>

        <div className="space-y-4">
          {sets.map((set, index) => (
            <div key={index} className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Set {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSet(index)}
                  disabled={sets.length === 1}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Reps</Label>
                  <Input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                    className="bg-background"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                  <Input
                    type="number"
                    value={set.weight || ''}
                    onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                    className="bg-background"
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={addSet}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Set
          </Button>
          
          <Button
            onClick={handleLogWorkout}
            disabled={isLogging}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLogging ? 'Saving...' : 'Log Workout'}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => setIsExpanded(false)}
          className="w-full text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default WorkoutLogger;