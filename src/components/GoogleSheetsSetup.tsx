import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, ExternalLink, LogIn, LogOut, Copy, Key, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateGoogleSheetsConfig, extractSpreadsheetId, type GoogleSheetsConfig } from '@/services/googleSheets';
import { useToast } from '@/hooks/use-toast';
import { apiLogger } from '@/lib/apiLogger';
import { GoogleSheetsService } from '@/services/googleSheets';

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
  const [authMethod, setAuthMethod] = useState<'apikey' | 'oauth' | 'none'>('oauth');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [googleSheetsService, setGoogleSheetsService] = useState<GoogleSheetsService | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current URL for OAuth setup instructions
    setCurrentUrl(window.location.origin);
  }, []);

  useEffect(() => {
    // Initialize Google Sheets service when config changes
    if (config.apiKey && config.clientId && config.spreadsheetId && config.sheetName) {
      const service = new GoogleSheetsService(config as GoogleSheetsConfig);
      setGoogleSheetsService(service);
      
      // Check if already signed in
      const token = localStorage.getItem('google_access_token');
      const expires = localStorage.getItem('google_token_expires');
      if (token && expires && Date.now() < parseInt(expires)) {
        setIsSignedIn(true);
        setConfig(prev => ({ ...prev, accessToken: token }));
      }
    }
  }, [config.apiKey, config.clientId, config.spreadsheetId, config.sheetName]);

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

  const handleGoogleSignIn = async () => {
    if (!googleSheetsService) {
      toast({
        title: "Configuration Required",
        description: "Please complete the configuration first",
        variant: "destructive"
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const success = await googleSheetsService.signIn();
      if (success) {
        setIsSignedIn(true);
        toast({
          title: "Signed In Successfully",
          description: "You can now log workouts directly to Google Sheets!"
        });
      } else {
        toast({
          title: "Sign In Failed",
          description: "Please check your OAuth configuration and try again",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || "Failed to sign in to Google",
        variant: "destructive"
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    if (!googleSheetsService) return;

    try {
      await googleSheetsService.signOut();
      setIsSignedIn(false);
      toast({
        title: "Signed Out",
        description: "You've been signed out from Google Sheets"
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const handleUseApiKeyOnly = () => {
    setAuthMethod('apikey');
    toast({
      title: "API Key Mode",
      description: "Using API key for read-only access. Workouts will be stored locally.",
    });
  };

  const handleUseOAuth = () => {
    setAuthMethod('oauth');
    toast({
      title: "OAuth Mode",
      description: "Using OAuth for full read/write access to Google Sheets.",
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
          <strong>OAuth Setup Instructions:</strong>
          <br />
          1. Go to Google Cloud Console and create OAuth 2.0 credentials
          <br />
          2. Add your current Bolt URL to authorized redirect URIs
          <br />
          3. Copy your Client ID and API Key to the form below
          <br />
          4. Sign in with Google to enable full read/write access
        </AlertDescription>
      </Alert>

      {/* Current Bolt URL */}
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-400">
          <strong>Current Bolt URL:</strong> {currentUrl}
          <br />
          Add this URL to your Google OAuth redirect URIs
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(currentUrl)}
            className="ml-2 text-blue-400 hover:text-blue-300"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Authentication Method Selection */}
        <div className="space-y-2">
          <Label>Authentication Method</Label>
          <div className="flex gap-2">
            <Button
              variant={authMethod === 'oauth' ? 'default' : 'outline'}
              onClick={handleUseOAuth}
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              OAuth (Full Access)
            </Button>
            <Button
              variant={authMethod === 'apikey' ? 'default' : 'outline'}
              onClick={handleUseApiKeyOnly}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              API Key (Read Only)
            </Button>
          </div>
        </div>

        {/* Current Status */}
        {authMethod === 'oauth' && (
          <Alert className={isSignedIn ? "border-green-500/50 bg-green-500/10" : "border-yellow-500/50 bg-yellow-500/10"}>
            {isSignedIn ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  <div className="flex items-center justify-between">
                    <span>✓ Signed in to Google - Full read/write access enabled</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGoogleSignOut}
                      className="text-green-400 hover:text-green-300"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  <div className="flex items-center justify-between">
                    <span>OAuth configured - Click "Sign in with Google" to enable full access</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn || !isValid}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      <User className="w-4 h-4 mr-1" />
                      {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                    </Button>
                  </div>
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {authMethod === 'apikey' && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Using API Key mode - Read access to sheets, local workout storage
            </AlertDescription>
          </Alert>
        )}

        {/* OAuth Client ID */}
        {authMethod === 'oauth' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId">Google OAuth Client ID</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={openOAuthGuide}
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Get Client ID
              </Button>
            </div>
            <Input
              id="clientId"
              placeholder={config.clientId ? "Client ID loaded from environment" : "Enter your Google OAuth Client ID"}
              value={config.clientId}
              onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
              className="bg-muted/50"
            />
          </div>
        )}

        {/* Environment Variables Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Environment Variables:</strong> Add your API key to <code>.env.local</code>:
            <br />
            <code>VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here</code>
            <br />
            <code>VITE_GOOGLE_OAUTH_CLIENT_ID=your_client_id_here</code>
            <br />
            This keeps your credentials secure and out of the code.
          </AlertDescription>
        </Alert>

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
        <div className="space-y-1">
          {import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && (
            <p className="text-sm text-green-400">
              ✓ API key loaded from environment variables
            </p>
          )}
          {import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID && (
            <p className="text-sm text-green-400">
              ✓ OAuth Client ID loaded from environment variables
            </p>
          )}
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