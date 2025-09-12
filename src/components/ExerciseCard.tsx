import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  equipment: string[];
  tips: string;
  difficulty: 'beginner' | 'intermediate' | 'professional';
}

interface ExerciseCardProps {
  exercise: Exercise;
}

const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'professional': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <Card className="bg-glass border-glass backdrop-blur-sm hover:border-primary transition-all duration-300 hover:shadow-glow group">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
            {exercise.name}
          </h3>
          <Badge className={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
        </div>

        {/* Sets & Reps */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Sets:</span>
            <span className="font-semibold text-foreground">{exercise.sets}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-muted-foreground">Reps:</span>
            <span className="font-semibold text-foreground">{exercise.reps}</span>
          </div>
        </div>

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Equipment needed:</p>
            <div className="flex flex-wrap gap-2">
              {exercise.equipment.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Form tips:</p>
          <p className="text-sm text-foreground bg-muted/30 p-3 rounded-md border border-border">
            {exercise.tips}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ExerciseCard;