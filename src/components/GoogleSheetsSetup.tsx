import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateGoogleSheetsConfig, extractSpreadsheetId, type GoogleSheetsConfig } from '@/services/googleSheets';
import { useToast } from '@/hooks/use-toast';

interface GoogleSheetsSetupProps {
  onConfigSave: (config: GoogleSheetsConfig) => void;
  initialConfig?: GoogleSheetsConfig;
}

const GoogleSheetsSetup = ({ onConfigSave, initialConfig }: GoogleSheetsSetupProps) => {
  const [config, setConfig] = useState<Partial<GoogleSheetsConfig>>({
    apiKey: '',
    spreadsheetId: '',
    sheetName: 'WorkoutLogs',
    ...initialConfig
  });
  
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const validationErrors = validateGoogleSheetsConfig(config);
    setErrors(validationErrors);
    setIsValid(validationErrors.length === 0);
  }, [config]);

  const handleSpreadsheetUrlChange = (url: string) => {
    setSpreadsheetUrl(url);
    const extractedId = extractSpreadsheetId(url);
    if (extractedId) {
      setConfig(prev => ({ ...prev, spreadsheetId: extractedId }));
    }
  };

  const handleSave = () => {
    if (isValid) {
      localStorage.setItem('googleSheets_config', JSON.stringify(config));
      onConfigSave(config as GoogleSheetsConfig);
      toast({
        title: "Configuration Saved",
        description: "Google Sheets integration is now active!",
      });
    }
  };

  const openApiKeyGuide = () => {
    window.open('https://developers.google.com/sheets/api/guides/authorizing#APIKey', '_blank');
  };

  return (
    <Card className="bg-glass border-glass backdrop-blur-sm p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Google Sheets Integration</h3>
        <p className="text-muted-foreground">
          Connect your workout data to Google Sheets for automatic logging and progress tracking.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Setup Instructions:</strong>
          <br />
          1. Create a Google Sheets API key (read-only is sufficient for viewing data)
          <br />
          2. Create a Google Spreadsheet and make it publicly editable for logging workouts
          <br />
          3. Add a sheet named "WorkoutLogs" with headers: Date, Exercise Name, Muscle Group, Set Number, Reps, Weight (kg), Difficulty Level, Notes
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="apiKey">Google Sheets API Key</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={openApiKeyGuide}
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Get API Key
            </Button>
          </div>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your Google Sheets API key"
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className="bg-muted/50"
          />
        </div>

        {/* Spreadsheet URL */}
        <div className="space-y-2">
          <Label htmlFor="spreadsheetUrl">Google Spreadsheet URL</Label>
          <Input
            id="spreadsheetUrl"
            placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit"
            value={spreadsheetUrl}
            onChange={(e) => handleSpreadsheetUrlChange(e.target.value)}
            className="bg-muted/50"
          />
          {config.spreadsheetId && (
            <p className="text-sm text-green-400">
              ✓ Spreadsheet ID extracted: {config.spreadsheetId}
            </p>
          )}
        </div>

        {/* Sheet Name */}
        <div className="space-y-2">
          <Label htmlFor="sheetName">Sheet Name</Label>
          <Input
            id="sheetName"
            placeholder="WorkoutLogs"
            value={config.sheetName}
            onChange={(e) => setConfig(prev => ({ ...prev, sheetName: e.target.value }))}
            className="bg-muted/50"
          />
        </div>

        {/* Sample Sheet Structure */}
        <div className="space-y-2">
          <Label>Required Headers (Row 1 of your sheet)</Label>
          <Textarea
            readOnly
            value="Date	Exercise Name	Muscle Group	Set Number	Reps	Weight (kg)	Difficulty Level	Notes"
            className="bg-muted/50 text-sm font-mono"
            rows={2}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {isValid && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">
            Configuration is valid and ready to use!
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleSave} 
        disabled={!isValid}
        className="w-full"
        variant={isValid ? "default" : "secondary"}
      >
        {isValid ? "Save Configuration" : "Complete Setup First"}
      </Button>
    </Card>
  );
};

export default GoogleSheetsSetup;