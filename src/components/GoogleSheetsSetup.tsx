import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, ExternalLink, LogIn, LogOut, Copy, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateGoogleSheetsConfig, extractSpreadsheetId, type GoogleSheetsConfig } from '@/services/googleSheets';
import { useToast } from '@/hooks/use-toast';
import { apiLogger } from '@/lib/apiLogger';

interface GoogleSheetsSetupProps {
  onConfigSave: (config: GoogleSheetsConfig) => void;
  initialConfig?: GoogleSheetsConfig;
}

const GoogleSheetsSetup = ({ onConfigSave, initialConfig }: GoogleSheetsSetupProps) => {
  const [config, setConfig] = useState<Partial<GoogleSheetsConfig>>({
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '',
    spreadsheetId: '',
    sheetName: 'WorkoutLogs',
    clientId: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '',
    ...initialConfig
  });
  
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [authMethod, setAuthMethod] = useState<'apikey' | 'oauth' | 'none'>('none');
  const [currentUrl, setCurrentUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Get current URL for OAuth setup instructions
    setCurrentUrl(window.location.origin);
  }, []);

  useEffect(() => {
    const validationErrors = validateGoogleSheetsConfig(config);
    setErrors(validationErrors);
    setIsValid(validationErrors.length === 0);
  }, [config]);

  useEffect(() => {
    // Determine authentication method
    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken && config.clientId) {
      setAuthMethod('oauth');
      setConfig(prev => ({ ...prev, accessToken: savedToken }));
    } else if (config.apiKey) {
      setAuthMethod('apikey');
    } else {
      setAuthMethod('none');
    }
  }, [config.apiKey, config.clientId]);

  const handleSpreadsheetUrlChange = (url: string) => {
    setSpreadsheetUrl(url);
    const extractedId = extractSpreadsheetId(url);
    if (extractedId) {
      setConfig(prev => ({ ...prev, spreadsheetId: extractedId }));
    }
  };

  const handleUseApiKeyOnly = () => {
    setAuthMethod('apikey');
    toast({
      title: "API Key Mode",
      description: "Using API key for read-only access. Workouts will be stored locally.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    });
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

  const openOAuthGuide = () => {
    window.open('https://developers.google.com/identity/protocols/oauth2/web-server', '_blank');
  };
  return (
    <Card className="bg-glass border-glass backdrop-blur-sm p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Google Sheets Integration</h3>
        <p className="text-muted-foreground">
          Connect your workout data to Google Sheets for progress tracking and data backup.
        </p>
      </div>

      {/* Setup Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Recommended Setup for Bolt Environment:</strong>
          <br />
          1. Create a Google Sheets API Key (read-only access)
          <br />
          2. Create a Google Spreadsheet with proper headers
          <br />
          3. Workouts will be stored locally with export functionality
          <br />
          4. For full write access, deploy to a permanent domain and use OAuth
          <br />
          <strong>OAuth is complex in Bolt due to changing URLs.</strong>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Authentication Method Selection */}
        <div className="space-y-2">
          <Label>Authentication Method</Label>
          <div className="flex gap-2">
            <Button
              variant={authMethod === 'apikey' ? 'default' : 'outline'}
              onClick={handleUseApiKeyOnly}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              API Key (Recommended)
            </Button>
            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2 opacity-50"
              title="OAuth requires permanent domain"
            >
              <LogIn className="w-4 h-4" />
              OAuth (Not available in Bolt)
            </Button>
          </div>
        </div>

        {/* Current Status */}
        {authMethod !== 'none' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              {authMethod === 'apikey' && "Using API Key mode - Read access to sheets, local workout storage"}
              {authMethod === 'oauth' && "OAuth authenticated - Full read/write access to sheets"}
            </AlertDescription>
          </Alert>
        )}

        {/* Environment Variables Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Environment Variables:</strong> Add your API key to <code>.env.local</code>:
            <br />
            <code>VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here</code>
            <br />
            This keeps your credentials secure and out of the code.
          </AlertDescription>
        </Alert>
        </div>

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
            placeholder={config.apiKey ? "API key loaded from environment" : "Enter your Google Sheets API key"}
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className="bg-muted/50"
          />
        </div>

        {/* Environment Variable Status */}
        {import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && (
          <p className="text-sm text-green-400">
            ✓ API key loaded from environment variables
          </p>
        )}

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
        <Alert className="border-primary/50 bg-primary/10">
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
        variant="default"
      >
        {isValid ? "Save Configuration" : "Complete Setup First"}
      </Button>
    </Card>
  );
};

export default GoogleSheetsSetup;