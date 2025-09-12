import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DifficultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodyPart: string;
  onSelectDifficulty: (difficulty: 'beginner' | 'intermediate' | 'professional') => void;
}

const DifficultyModal = ({ isOpen, onClose, bodyPart, onSelectDifficulty }: DifficultyModalProps) => {
  const difficulties = [
    { 
      level: 'beginner' as const, 
      title: 'Beginner',
      description: 'Perfect for starting your fitness journey',
      icon: '🌱'
    },
    { 
      level: 'intermediate' as const, 
      title: 'Intermediate', 
      description: 'Ready to challenge yourself more',
      icon: '💪'
    },
    { 
      level: 'professional' as const, 
      title: 'Professional',
      description: 'Advanced training for peak performance',
      icon: '🏆'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-glass backdrop-blur-lg max-w-md animate-fade-in">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Level
          </DialogTitle>
          <p className="text-muted-foreground">
            Select difficulty for <span className="text-primary font-semibold">{bodyPart}</span> workouts
          </p>
        </DialogHeader>
        
        <div className="space-y-3">
          {difficulties.map((difficulty) => (
            <Button
              key={difficulty.level}
              variant="outline"
              className="w-full h-auto p-4 border-glass hover:border-primary hover:shadow-glow transition-all duration-300 group"
              onClick={() => {
                onSelectDifficulty(difficulty.level);
                onClose();
              }}
            >
              <div className="flex items-center text-left w-full">
                <span className="text-2xl mr-3">{difficulty.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {difficulty.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {difficulty.description}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DifficultyModal;