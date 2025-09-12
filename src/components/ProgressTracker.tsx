import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Dumbbell } from 'lucide-react';
import { GoogleSheetsService } from '@/services/googleSheets';
import { WorkoutLog } from '@/data/exercises';
import { format, parseISO } from 'date-fns';

interface ProgressTrackerProps {
  googleSheetsService: GoogleSheetsService | null;
  selectedMuscleGroup?: string;
}

type TimeRange = 'week' | 'month' | 'quarter';

const ProgressTracker = ({ googleSheetsService, selectedMuscleGroup }: ProgressTrackerProps) => {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    averageWeight: 0,
    maxWeight: 0
  });

  useEffect(() => {
    loadWorkoutData();
  }, [googleSheetsService, selectedMuscleGroup, timeRange]);

  useEffect(() => {
    processChartData();
  }, [workoutLogs, selectedExercise, timeRange]);

  const loadWorkoutData = async () => {
    if (!googleSheetsService) {
      // Load from localStorage
      const localLogs = localStorage.getItem('workout_logs');
      const logs: WorkoutLog[] = localLogs ? JSON.parse(localLogs) : [];
      
      const filteredLogs = selectedMuscleGroup 
        ? logs.filter(log => log.muscleGroup === selectedMuscleGroup)
        : logs;
      
      setWorkoutLogs(filteredLogs);
      return;
    }

    setLoading(true);
    try {
      const logs = await googleSheetsService.getWorkoutHistory(selectedMuscleGroup);
      setWorkoutLogs(logs);
    } catch (error) {
      console.error('Error loading workout data:', error);
      // Fallback to localStorage
      const localLogs = localStorage.getItem('workout_logs');
      const logs: WorkoutLog[] = localLogs ? JSON.parse(localLogs) : [];
      setWorkoutLogs(logs);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    let filteredLogs = workoutLogs;
    
    // Filter by exercise if selected
    if (selectedExercise !== 'all') {
      filteredLogs = workoutLogs.filter(log => log.exerciseId === selectedExercise);
    }

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
    }

    filteredLogs = filteredLogs.filter(log => new Date(log.date) >= cutoffDate);

    // Group by date and calculate metrics
    const groupedData = filteredLogs.reduce((acc, log) => {
      const date = format(parseISO(log.date), 'MMM dd');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalWeight: 0,
          totalReps: 0,
          maxWeight: 0,
          sets: 0
        };
      }

      log.sets.forEach(set => {
        acc[date].totalWeight += set.weight * set.reps;
        acc[date].totalReps += set.reps;
        acc[date].maxWeight = Math.max(acc[date].maxWeight, set.weight);
        acc[date].sets += 1;
      });

      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setChartData(chartData);

    // Calculate stats
    const totalSets = filteredLogs.reduce((sum, log) => sum + log.sets.length, 0);
    const allWeights = filteredLogs.flatMap(log => log.sets.map(set => set.weight));
    const averageWeight = allWeights.length > 0 ? allWeights.reduce((sum, w) => sum + w, 0) / allWeights.length : 0;
    const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0;

    setStats({
      totalWorkouts: filteredLogs.length,
      totalSets,
      averageWeight: Math.round(averageWeight * 10) / 10,
      maxWeight
    });
  };

  const getUniqueExercises = () => {
    const exercises = new Map();
    workoutLogs.forEach(log => {
      if (!exercises.has(log.exerciseId)) {
        exercises.set(log.exerciseId, log.exerciseName);
      }
    });
    return Array.from(exercises.entries());
  };

  if (workoutLogs.length === 0) {
    return (
      <Card className="bg-glass border-glass backdrop-blur-sm p-8 text-center">
        <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Workout Data
        </h3>
        <p className="text-muted-foreground">
          Start logging workouts to see your progress here!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-glass border-glass backdrop-blur-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-secondary" />
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exercises</SelectItem>
                {getUniqueExercises().map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-glass border-glass backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalWorkouts}</div>
            <div className="text-sm text-muted-foreground">Workouts</div>
          </div>
        </Card>
        
        <Card className="bg-glass border-glass backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{stats.totalSets}</div>
            <div className="text-sm text-muted-foreground">Total Sets</div>
          </div>
        </Card>
        
        <Card className="bg-glass border-glass backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.averageWeight}kg</div>
            <div className="text-sm text-muted-foreground">Avg Weight</div>
          </div>
        </Card>
        
        <Card className="bg-glass border-glass backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.maxWeight}kg</div>
            <div className="text-sm text-muted-foreground">Max Weight</div>
          </div>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card className="bg-glass border-glass backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Progress Over Time</h3>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="maxWeight" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Max Weight (kg)"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalReps" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                name="Total Reps"
                dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Volume Chart */}
      <Card className="bg-glass border-glass backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Training Volume</h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="sets" 
                fill="hsl(var(--primary))" 
                name="Sets Completed"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default ProgressTracker;