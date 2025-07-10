import { useState } from "react";
import { ArrowLeft, Upload, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const GroupAnalysis = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    platform: "",
    groupName: "",
    members: "",
    chatText: "",
    assetSymbol: ""
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
      navigate('/results', { state: { analysisData: formData } });
    }, 3000);
  };

  const platforms = [
    "WhatsApp",
    "Telegram", 
    "Discord",
    "Signal",
    "WeChat",
    "Facebook Messenger",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Group Analysis</h1>
                <p className="text-sm text-muted-foreground">Analyze investment group for scam indicators</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        
        {/* Warning Notice */}
        <Card className="mb-8 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Security Notice
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  All data is processed securely and deleted after analysis. We do not store personal information or group content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Form */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Group Information</span>
            </CardTitle>
            <CardDescription>
              Provide details about the investment group you want to analyze
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-sm font-medium">
                Platform *
              </Label>
              <Select value={formData.platform} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, platform: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select the messaging platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-sm font-medium">
                Group Name *
              </Label>
              <Input
                id="groupName"
                placeholder="Enter the investment group name"
                value={formData.groupName}
                onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
              />
            </div>

            {/* Members */}
            <div className="space-y-2">
              <Label htmlFor="members" className="text-sm font-medium">
                Group Members
              </Label>
              <Textarea
                id="members"
                placeholder="Enter member names (comma-separated)&#10;Example: John Smith, Maria Garcia, @crypto_expert123"
                value={formData.members}
                onChange={(e) => setFormData(prev => ({ ...prev, members: e.target.value }))}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Include usernames, display names, or phone numbers if available
              </p>
            </div>

            {/* Chat Content */}
            <div className="space-y-2">
              <Label htmlFor="chatText" className="text-sm font-medium">
                Group Chat Messages *
              </Label>
              <Textarea
                id="chatText"
                placeholder="Paste recent group chat messages here...&#10;&#10;Example:&#10;[10:30] @expert_trader: Big announcement coming! 🚀&#10;[10:31] @expert_trader: This coin will 10x next week guaranteed!&#10;[10:32] Member1: How do you know?&#10;[10:33] @expert_trader: Inside information, but act fast!"
                value={formData.chatText}
                onChange={(e) => setFormData(prev => ({ ...prev, chatText: e.target.value }))}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Include timestamps and usernames if possible. More content = better analysis.
              </p>
            </div>

            {/* Asset Symbol */}
            <div className="space-y-2">
              <Label htmlFor="assetSymbol" className="text-sm font-medium">
                Asset/Stock Symbol
              </Label>
              <Input
                id="assetSymbol"
                placeholder="e.g., BTC, AAPL, SAFEMOON, etc."
                value={formData.assetSymbol}
                onChange={(e) => setFormData(prev => ({ ...prev, assetSymbol: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                The cryptocurrency, stock, or asset being promoted in the group
              </p>
            </div>

            {/* Analyze Button */}
            <Button 
              onClick={handleAnalyze}
              disabled={!formData.platform || !formData.groupName || !formData.chatText || isAnalyzing}
              className="w-full btn-financial mt-8"
              size="lg"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Group...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Analyze for Scam Indicators</span>
                </div>
              )}
            </Button>

          </CardContent>
        </Card>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card className="mt-6 card-financial">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-medium text-center">Analysis in Progress</h3>
                <div className="space-y-3">
                  {[
                    "Checking members against scammer databases...",
                    "Analyzing language patterns for manipulation...",
                    "Verifying asset information...",
                    "Detecting price manipulation signals...",
                    "Generating risk assessment report..."
                  ].map((step, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default GroupAnalysis;