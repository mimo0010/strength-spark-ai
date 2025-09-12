import { useState } from 'react';

interface BodyPartCardProps {
  name: string;
  image: string;
  onClick: () => void;
}

const BodyPartCard = ({ name, image, onClick }: BodyPartCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative h-32 sm:h-40 md:h-48 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />
      
      {/* Glass Overlay */}
      <div className="absolute inset-0 bg-glass border border-glass backdrop-blur-sm" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      
      {/* Glow Effect on Hover */}
      {isHovered && (
        <div className="absolute inset-0 shadow-glow rounded-lg animate-pulse-glow" />
      )}
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-center p-4">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-foreground drop-shadow-lg">
          {name}
        </h3>
      </div>
    </div>
  );
};

export default BodyPartCard;