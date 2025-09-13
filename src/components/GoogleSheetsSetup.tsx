import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, ExternalLink, LogIn, LogOut, Copy } from 'lucide-react';
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
    apiKey: '',
    spreadsheetId: '',
    sheetName: 'WorkoutLogs',
    clientId: '',
    ...initialConfig
  });
  
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
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
    // Check if already signed in
    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) {
      setConfig(prev => ({ ...prev, accessToken: savedToken }));
      setIsSignedIn(true);
    }

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      toast({
        title: "OAuth Error",
        description: `Authentication failed: ${error}`,
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code && config.clientId) {
      handleOAuthCallback(code);
    }
  }, [config.clientId]);

  const handleSpreadsheetUrlChange = (url: string) => {
    setSpreadsheetUrl(url);
    const extractedId = extractSpreadsheetId(url);
    if (extractedId) {
      setConfig(prev => ({ ...prev, spreadsheetId: extractedId }));
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      // Exchange the authorization code for an access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: config.clientId!,
          client_secret: '', // Note: For security, this should be handled server-side
          grant_type: 'authorization_code',
          redirect_uri: window.location.origin,
          scope: 'https://www.googleapis.com/auth/spreadsheets'
        })
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        localStorage.setItem('google_access_token', accessToken);
        setConfig(prev => ({ ...prev, accessToken }));
        setIsSignedIn(true);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        apiLogger.log({
          status: 'success',
          source: 'GoogleOAuth',
          action: 'signin',
          message: 'Successfully authenticated with Google'
        });
        
        toast({
          title: "Google OAuth Success",
          description: "You can now write to Google Sheets!",
        });
      } else {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error_description || 'Token exchange failed');
      }
    } catch (error: any) {
      apiLogger.log({
        status: 'error',
        source: 'GoogleOAuth',
        action: 'signin',
        message: error?.message || 'OAuth authentication failed',
        meta: { error }
      });
      
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive"
      });
    }
  };

  const handleGoogleSignIn = () => {
    if (!config.clientId) {
      toast({
        title: "Client ID Required",
        description: "Please enter your Google OAuth Client ID first.",
        variant: "destructive"
      });
      return;
    }

    // Redirect to Google OAuth
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: window.location.origin, // This needs to be configured in Google Console
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent'
    });

    window.location.href = `${oauth2Endpoint}?${params}`;
  };

  const handleSignOut = () => {
    localStorage.removeItem('google_access_token');
    setConfig(prev => ({ ...prev, accessToken: undefined }));
    setIsSignedIn(false);
    
    apiLogger.log({
      status: 'info',
      source: 'GoogleOAuth',
      action: 'signout',
      message: 'Signed out from Google'
    });
    
    toast({
      title: "Signed Out",
      description: "You have been signed out of Google.",
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
          Connect your workout data to Google Sheets for automatic logging and progress tracking.
        </p>
      </div>

      {/* OAuth Setup Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Simplified Setup (Recommended for Bolt):</strong>
          <br />
          1. Create a Google Sheets API Key (easier than OAuth)
          <br />
          2. Create a Google Spreadsheet and make it publicly readable
          <br />
          3. Workouts will be stored locally and can be exported to sheets manually
          <br />
          4. Add headers: Date, Exercise Name, Muscle Group, Set Number, Reps, Weight (kg), Difficulty Level, Notes
          <br />
          <strong>For full OAuth integration, use a permanent domain instead of Bolt.</strong>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* OAuth Client ID */}
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
              Setup Guide
            </Button>
          </div>
          <Input
            id="clientId"
            placeholder="Enter your Google OAuth Client ID"
            value={config.clientId}
            onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
            className="bg-muted/50"
          />
        </div>

        {/* Google Sign In */}
        <div className="space-y-2">
          <Label>Google Authentication</Label>
          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <Button
                onClick={handleGoogleSignIn}
                disabled={!config.clientId}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-sm text-green-400">✓ Signed in to Google</div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
          {isSignedIn && (
            <p className="text-sm text-muted-foreground">
              You now have write access to Google Sheets. Workouts will be automatically logged!
            </p>
          )}
          {!isSignedIn && config.clientId && (
            <p className="text-sm text-muted-foreground">
              Make sure to add <code>{currentUrl}</code> to your OAuth redirect URIs in Google Console.
            </p>
          )}
        </div>

        {/* API Key (backup) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="apiKey">Google Sheets API Key (for reading)</Label>
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
            placeholder="Enter your Google Sheets API key (optional)"
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