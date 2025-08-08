import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Zap, Shield, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { localCache } from '@/lib/cache';

interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  className = ''
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [installationSteps, setInstallationSteps] = useState<string[]>([]);

  useEffect(() => {
    checkInstallationStatus();
    detectDeviceType();
    setupEventListeners();
    checkPromptEligibility();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkInstallationStatus = () => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as PWA
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }
  };

  const detectDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Set installation steps based on device
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      if (isMobile) {
        setInstallationSteps([
          'Tap the menu button (⋮) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Confirm the installation',
          'Find ScamShield on your home screen'
        ]);
      } else {
        setInstallationSteps([
          'Click the install button in the address bar',
          'Or use the menu (⋮) > "Install ScamShield..."',
          'Confirm the installation in the dialog',
          'Find ScamShield in your applications'
        ]);
      }
    } else if (userAgent.includes('safari') && userAgent.includes('iphone')) {
      setInstallationSteps([
        'Tap the Share button (□↑) at the bottom of the screen',
        'Scroll down and tap "Add to Home Screen"',
        'Customize the name if desired',
        'Tap "Add" to install ScamShield'
      ]);
    } else if (userAgent.includes('firefox')) {
      setInstallationSteps([
        'Look for the "Add to Home screen" option in the menu',
        'Or use the address bar install prompt if available',
        'Confirm the installation',
        'Access ScamShield from your home screen or apps'
      ]);
    } else {
      setInstallationSteps([
        'Look for an install or "Add to Home screen" option',
        'This may be in your browser menu or address bar',
        'Follow your browser\'s installation prompts',
        'Access ScamShield from your installed apps'
      ]);
    }
  };

  const checkPromptEligibility = async () => {
    try {
      // Check if user has previously dismissed the prompt
      const dismissed = await localCache.get('pwa_prompt_dismissed');
      const lastShown = await localCache.get('pwa_prompt_last_shown');
      
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return;
        }
      }

      if (lastShown) {
        const lastShownDate = new Date(lastShown);
        const now = new Date();
        const daysSinceShown = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Don't show more than once per day
        if (daysSinceShown < 1) {
          return;
        }
      }

      // Show prompt if not installed and conditions are met
      if (!isInstalled) {
        // Wait a bit before showing to let the user settle in
        setTimeout(() => setIsVisible(true), 3000);
        await localCache.set('pwa_prompt_last_shown', new Date().toISOString());
      }
    } catch (error) {
      logger.error('Error checking prompt eligibility', { error });
    }
  };

  const setupEventListeners = () => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      logger.info('Install prompt event captured');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      
      toast({
        title: "🎉 Installation Successful!",
        description: "ScamShield has been installed successfully. You can now access it from your home screen or apps menu.",
      });

      logger.info('PWA installed successfully');
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          logger.info('User accepted install prompt');
        } else {
          logger.info('User dismissed install prompt');
        }
        
        setDeferredPrompt(null);
        setIsVisible(false);
      } catch (error) {
        logger.error('Error during install prompt', { error });
        toast({
          title: "Installation Error",
          description: "There was an issue with the installation. Please try again or install manually through your browser menu.",
          variant: "destructive",
        });
      }
    } else {
      // Show manual installation instructions
      setIsVisible(true);
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    await localCache.set('pwa_prompt_dismissed', new Date().toISOString());
    
    toast({
      title: "Reminder Set",
      description: "We'll remind you about installing ScamShield in a week.",
    });

    logger.info('PWA install prompt dismissed');
    onDismiss?.();
  };

  const handleRemindLater = async () => {
    setIsVisible(false);
    // Don't set dismissed flag, just hide for this session
    
    toast({
      title: "Reminder Set",
      description: "We'll show this reminder again next time you visit.",
    });
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  const getDeviceIcon = () => {
    return deviceType === 'mobile' ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />;
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      title: "Instant Access",
      description: "Quick launch from your home screen or apps menu"
    },
    {
      icon: <Wifi className="w-5 h-5 text-blue-600" />,
      title: "Works Offline",
      description: "Analyze cached data even without internet connection"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-600" />,
      title: "Enhanced Security",
      description: "Isolated environment for better protection"
    }
  ];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getDeviceIcon()}
              <div>
                <CardTitle className="text-lg font-semibold">
                  Install ScamShield
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Get the best experience with our app
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                {feature.icon}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Installation Steps */}
          {!deferredPrompt && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" />
                How to Install:
              </h4>
              <ol className="space-y-2 text-xs text-gray-600">
                {installationSteps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {deferredPrompt ? 'Install Now' : 'Show Instructions'}
            </Button>
            <Button
              onClick={handleRemindLater}
              variant="outline"
              size="sm"
            >
              Later
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center">
            Installing ScamShield as an app provides a better experience and allows offline functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;