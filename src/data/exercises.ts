export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  equipment: string[];
  tips: string;
  difficulty: 'beginner' | 'intermediate' | 'professional';
  muscleGroup: string;
}

export interface WorkoutLog {
  exerciseId: string;
  exerciseName: string;
  sets: {
    reps: number;
    weight: number;
  }[];
  date: string;
  muscleGroup: string;
}

export const exercises: Record<string, Record<string, Exercise[]>> = {
  chest: {
    beginner: [
      {
        id: 'chest-1',
        name: 'Chest Press Machine',
        sets: '3',
        reps: '8-12',
        equipment: ['Chest Press Machine'],
        tips: 'Adjust seat height so handles are at chest level. Press smoothly without locking elbows.',
        difficulty: 'beginner',
        muscleGroup: 'chest'
      },
      {
        id: 'chest-2',
        name: 'Pec Deck (Butterfly Machine)',
        sets: '3',
        reps: '10-15',
        equipment: ['Pec Deck Machine'],
        tips: 'Keep back pressed against pad, squeeze chest muscles at peak contraction.',
        difficulty: 'beginner',
        muscleGroup: 'chest'
      },
      {
        id: 'chest-3',
        name: 'Incline Dumbbell Press',
        sets: '3',
        reps: '8-10',
        equipment: ['Dumbbells', 'Incline Bench'],
        tips: 'Set bench to 30-45 degree incline. Lower weights to chest level with control.',
        difficulty: 'beginner',
        muscleGroup: 'chest'
      }
    ],
    intermediate: [
      {
        id: 'chest-4',
        name: 'Barbell Bench Press',
        sets: '4',
        reps: '6-8',
        equipment: ['Barbell', 'Bench', 'Safety Rack'],
        tips: 'Lower bar to chest, press up explosively. Always use safety bars or spotter.',
        difficulty: 'intermediate',
        muscleGroup: 'chest'
      },
      {
        id: 'chest-5',
        name: 'Cable Crossover',
        sets: '3',
        reps: '10-12',
        equipment: ['Cable Machine'],
        tips: 'Set cables at chest height, bring handles together in wide arc motion.',
        difficulty: 'intermediate',
        muscleGroup: 'chest'
      },
      {
        id: 'chest-6',
        name: 'Decline Barbell Press',
        sets: '3',
        reps: '8-10',
        equipment: ['Barbell', 'Decline Bench'],
        tips: 'Target lower chest with 15-30 degree decline. Control the weight throughout.',
        difficulty: 'intermediate',
        muscleGroup: 'chest'
      }
    ],
    professional: [
      {
        id: 'chest-7',
        name: 'Weighted Dips',
        sets: '4',
        reps: '6-8',
        equipment: ['Dip Station', 'Weight Belt'],
        tips: 'Lean forward slightly, lower until shoulders below elbows. Add weight progressively.',
        difficulty: 'professional',
        muscleGroup: 'chest'
      },
      {
        id: 'chest-8',
        name: 'Single-Arm Cable Press',
        sets: '3',
        reps: '8-10 each arm',
        equipment: ['Cable Machine'],
        tips: 'Unilateral pressing for core stability and muscle imbalances. Control rotation.',
        difficulty: 'professional',
        muscleGroup: 'chest'
      },
      {
        id: 'chest-9',
        name: 'Incline Barbell Press (Heavy)',
        sets: '4',
        reps: '4-6',
        equipment: ['Barbell', 'Incline Bench', 'Safety Rack'],
        tips: 'Heavy compound movement for upper chest. Use progressive overload principles.',
        difficulty: 'professional',
        muscleGroup: 'chest'
      }
    ]
  },
  biceps: {
    beginner: [
      {
        id: 'biceps-1',
        name: 'Wall Bicep Curls',
        sets: '3',
        reps: '12-15',
        equipment: [],
        tips: 'Stand arms length from wall, place palms flat and curl by bending elbows.',
        difficulty: 'beginner',
        muscleGroup: 'biceps'
      },
      {
        id: 'biceps-2',
        name: 'Towel Bicep Curls',
        sets: '3',
        reps: '10-15',
        equipment: ['Towel'],
        tips: 'Step on towel, hold ends and curl up. Create your own resistance.',
        difficulty: 'beginner',
        muscleGroup: 'biceps'
      }
    ],
    intermediate: [
      {
        id: 'biceps-3',
        name: 'Chin-ups (Assisted)',
        sets: '3',
        reps: '5-8',
        equipment: ['Pull-up Bar', 'Resistance Band'],
        tips: 'Use resistance band for assistance. Focus on controlled movement and full range of motion.',
        difficulty: 'intermediate',
        muscleGroup: 'biceps'
      },
      {
        id: 'biceps-4',
        name: 'Backpack Curls',
        sets: '3',
        reps: '10-12',
        equipment: ['Backpack', 'Books/Water'],
        tips: 'Load backpack with books or water bottles. Perform bicep curls holding the straps.',
        difficulty: 'intermediate',
        muscleGroup: 'biceps'
      }
    ],
    professional: [
      {
        id: 'biceps-5',
        name: 'Commando Pull-ups',
        sets: '3',
        reps: '4-6',
        equipment: ['Pull-up Bar'],
        tips: 'Pull up to one side of the bar, then the other. Extremely challenging variation.',
        difficulty: 'professional',
        muscleGroup: 'biceps'
      }
    ]
  },
  triceps: {
    beginner: [
      {
        id: 'triceps-1',
        name: 'Wall Tricep Push',
        sets: '3',
        reps: '10-15',
        equipment: [],
        tips: 'Face wall, place palms flat and push. Focus on using triceps to push away from wall.',
        difficulty: 'beginner',
        muscleGroup: 'triceps'
      },
      {
        id: 'triceps-2',
        name: 'Bench Dips (Knees Bent)',
        sets: '3',
        reps: '8-12',
        equipment: ['Chair', 'Bench'],
        tips: 'Sit on edge, hands beside you, lower body by bending elbows. Keep knees bent for easier variation.',
        difficulty: 'beginner',
        muscleGroup: 'triceps'
      }
    ],
    intermediate: [
      {
        id: 'triceps-3',
        name: 'Bench Dips (Legs Extended)',
        sets: '3',
        reps: '8-12',
        equipment: ['Chair', 'Bench'],
        tips: 'Same as beginner but with legs extended for increased difficulty.',
        difficulty: 'intermediate',
        muscleGroup: 'triceps'
      },
      {
        id: 'triceps-4',
        name: 'Pike Push-ups',
        sets: '3',
        reps: '6-10',
        equipment: [],
        tips: 'Form downward dog position, lower head toward ground. Great shoulder and tricep exercise.',
        difficulty: 'intermediate',
        muscleGroup: 'triceps'
      }
    ],
    professional: [
      {
        id: 'triceps-5',
        name: 'Handstand Push-ups',
        sets: '3',
        reps: '3-8',
        equipment: [],
        tips: 'Against wall for support. Ultimate upper body strength exercise requiring significant practice.',
        difficulty: 'professional',
        muscleGroup: 'triceps'
      }
    ]
  },
  back: {
    beginner: [
      {
        id: 'back-1',
        name: 'Superman',
        sets: '3',
        reps: '10-15',
        equipment: [],
        tips: 'Lie face down, lift chest and legs simultaneously. Hold for 2-3 seconds at top.',
        difficulty: 'beginner',
        muscleGroup: 'back'
      },
      {
        id: 'back-2',
        name: 'Reverse Snow Angels',
        sets: '3',
        reps: '12-15',
        equipment: [],
        tips: 'Lie face down, move arms in snow angel motion while lifting chest slightly.',
        difficulty: 'beginner',
        muscleGroup: 'back'
      }
    ],
    intermediate: [
      {
        id: 'back-3',
        name: 'Doorway Rows',
        sets: '3',
        reps: '10-12',
        equipment: ['Towel'],
        tips: 'Wrap towel around door handle, lean back and pull body forward. Great lat exercise.',
        difficulty: 'intermediate',
        muscleGroup: 'back'
      },
      {
        id: 'back-4',
        name: 'Single-Arm Rows',
        sets: '3',
        reps: '8-10 each arm',
        equipment: ['Backpack', 'Books'],
        tips: 'Use loaded backpack as weight, perform rowing motion while in split stance.',
        difficulty: 'intermediate',
        muscleGroup: 'back'
      }
    ],
    professional: [
      {
        id: 'back-5',
        name: 'Wide-Grip Pull-ups',
        sets: '3',
        reps: '5-10',
        equipment: ['Pull-up Bar'],
        tips: 'Hands wider than shoulders, pull until chin clears bar. Focus on lat engagement.',
        difficulty: 'professional',
        muscleGroup: 'back'
      }
    ]
  },
  shoulders: {
    beginner: [
      {
        id: 'shoulders-1',
        name: 'Arm Circles',
        sets: '3',
        reps: '15 each direction',
        equipment: [],
        tips: 'Start small, gradually increase circle size. Great warm-up and strength builder.',
        difficulty: 'beginner',
        muscleGroup: 'shoulders'
      },
      {
        id: 'shoulders-2',
        name: 'Wall Handstand Hold',
        sets: '3',
        reps: '10-30 seconds',
        equipment: [],
        tips: 'Chest facing wall, walk feet up. Build shoulder stability and strength.',
        difficulty: 'beginner',
        muscleGroup: 'shoulders'
      }
    ],
    intermediate: [
      {
        id: 'shoulders-3',
        name: 'Pike Walk-outs',
        sets: '3',
        reps: '6-8',
        equipment: [],
        tips: 'Start in pike position, walk hands forward and back. Great dynamic shoulder exercise.',
        difficulty: 'intermediate',
        muscleGroup: 'shoulders'
      },
      {
        id: 'shoulders-4',
        name: 'Lateral Arm Raises',
        sets: '3',
        reps: '12-15',
        equipment: ['Water Bottles'],
        tips: 'Use water bottles as weights, raise arms to sides until parallel to ground.',
        difficulty: 'intermediate',
        muscleGroup: 'shoulders'
      }
    ],
    professional: [
      {
        id: 'shoulders-5',
        name: 'Handstand Push-ups',
        sets: '3',
        reps: '3-8',
        equipment: [],
        tips: 'Full handstand push-up against wall. Ultimate shoulder strength exercise.',
        difficulty: 'professional',
        muscleGroup: 'shoulders'
      }
    ]
  },
  legs: {
    beginner: [
      {
        id: 'legs-1',
        name: 'Bodyweight Squats',
        sets: '3',
        reps: '12-15',
        equipment: [],
        tips: 'Feet shoulder-width apart, lower until thighs parallel to ground. Keep chest up.',
        difficulty: 'beginner',
        muscleGroup: 'legs'
      },
      {
        id: 'legs-2',
        name: 'Stationary Lunges',
        sets: '3',
        reps: '8-10 each leg',
        equipment: [],
        tips: 'Step forward, lower back knee toward ground. Keep front knee over ankle.',
        difficulty: 'beginner',
        muscleGroup: 'legs'
      },
      {
        id: 'legs-3',
        name: 'Wall Sits',
        sets: '3',
        reps: '20-45 seconds',
        equipment: [],
        tips: 'Back against wall, slide down until thighs parallel. Great isometric exercise.',
        difficulty: 'beginner',
        muscleGroup: 'legs'
      }
    ],
    intermediate: [
      {
        id: 'legs-4',
        name: 'Jump Squats',
        sets: '3',
        reps: '8-12',
        equipment: [],
        tips: 'Explode up from squat position, land softly. Great for power development.',
        difficulty: 'intermediate',
        muscleGroup: 'legs'
      },
      {
        id: 'legs-5',
        name: 'Walking Lunges',
        sets: '3',
        reps: '10-12 each leg',
        equipment: [],
        tips: 'Continuous forward lunges. Great for balance, coordination, and strength.',
        difficulty: 'intermediate',
        muscleGroup: 'legs'
      },
      {
        id: 'legs-6',
        name: 'Single-Leg Squats (Assisted)',
        sets: '3',
        reps: '5-8 each leg',
        equipment: [],
        tips: 'Hold onto something for balance, lower on one leg. Build single-leg strength.',
        difficulty: 'intermediate',
        muscleGroup: 'legs'
      }
    ],
    professional: [
      {
        id: 'legs-7',
        name: 'Pistol Squats',
        sets: '3',
        reps: '3-6 each leg',
        equipment: [],
        tips: 'Full single-leg squat with other leg extended forward. Ultimate leg strength test.',
        difficulty: 'professional',
        muscleGroup: 'legs'
      },
      {
        id: 'legs-8',
        name: 'Shrimp Squats',
        sets: '2',
        reps: '2-4 each leg',
        equipment: [],
        tips: 'Single-leg squat holding other foot behind. Extremely advanced movement.',
        difficulty: 'professional',
        muscleGroup: 'legs'
      }
    ]
  },
  abs: {
    beginner: [
      {
        id: 'abs-1',
        name: 'Plank',
        sets: '3',
        reps: '20-45 seconds',
        equipment: [],
        tips: 'Maintain straight line from head to heels. Engage core throughout.',
        difficulty: 'beginner',
        muscleGroup: 'abs'
      },
      {
        id: 'abs-2',
        name: 'Crunches',
        sets: '3',
        reps: '12-15',
        equipment: [],
        tips: 'Lift shoulders off ground, exhale at top. Focus on controlled movement.',
        difficulty: 'beginner',
        muscleGroup: 'abs'
      },
      {
        id: 'abs-3',
        name: 'Dead Bug',
        sets: '3',
        reps: '8-10 each side',
        equipment: [],
        tips: 'Lie on back, extend opposite arm and leg. Great for core stability.',
        difficulty: 'beginner',
        muscleGroup: 'abs'
      }
    ],
    intermediate: [
      {
        id: 'abs-4',
        name: 'Bicycle Crunches',
        sets: '3',
        reps: '15-20 each side',
        equipment: [],
        tips: 'Alternate elbow to opposite knee. Keep steady rhythm and controlled movement.',
        difficulty: 'intermediate',
        muscleGroup: 'abs'
      },
      {
        id: 'abs-5',
        name: 'Mountain Climbers',
        sets: '3',
        reps: '30 seconds',
        equipment: [],
        tips: 'Quick alternating knee drives in plank position. Keep hips level.',
        difficulty: 'intermediate',
        muscleGroup: 'abs'
      },
      {
        id: 'abs-6',
        name: 'Russian Twists',
        sets: '3',
        reps: '15-20 each side',
        equipment: [],
        tips: 'Sit with feet off ground, rotate torso side to side. Can hold weight for added difficulty.',
        difficulty: 'intermediate',
        muscleGroup: 'abs'
      }
    ],
    professional: [
      {
        id: 'abs-7',
        name: 'Dragon Flags',
        sets: '3',
        reps: '3-6',
        equipment: ['Bench'],
        tips: 'Lie on bench, hold behind head, lift entire body parallel to ground. Extremely advanced.',
        difficulty: 'professional',
        muscleGroup: 'abs'
      },
      {
        id: 'abs-8',
        name: 'Human Flag Progressions',
        sets: '3',
        reps: '5-10 seconds',
        equipment: ['Pull-up Bar'],
        tips: 'Side plank against vertical bar. Work up to full human flag position.',
        difficulty: 'professional',
        muscleGroup: 'abs'
      }
    ]
  }
};