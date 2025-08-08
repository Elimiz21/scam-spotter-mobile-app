// Comprehensive Onboarding Flow Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Smartphone,
  Globe,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Bell,
  Eye,
  Lock,
  Settings,
  Star,
  Gift,
  PlayCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileGestures, SwipeableView, HapticFeedback } from '@/hooks/useMobileGestures';
import { animations, pageTransitions } from '@/lib/animations';

// Onboarding step types
export interface OnboardingStep {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'welcome' | 'feature' | 'permission' | 'setup' | 'complete';
  interactive?: boolean;
  required?: boolean;
  actions?: {
    primary: string;
    secondary?: string;
    skip?: string;
  };
  content?: React.ReactNode;
}

// Default onboarding steps
const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ScamShield',
    subtitle: 'Your Ultimate Protection',
    description: 'Join millions who trust ScamShield to protect them from scams, fraud, and suspicious communications.',
    icon: Shield,
    type: 'welcome',
    actions: {
      primary: 'Get Started',
      skip: 'Skip Tour'
    }
  },
  {
    id: 'features-overview',
    title: 'Powerful Protection Features',
    description: 'Discover how ScamShield keeps you safe with AI-powered detection and real-time alerts.',
    icon: Zap,
    type: 'feature',
    interactive: true,
    actions: {
      primary: 'Explore Features',
      secondary: 'Learn More'
    }
  },
  {
    id: 'phone-verification',
    title: 'Verify Your Phone',
    description: 'Add your phone number to enable SMS and call protection features.',
    icon: Phone,
    type: 'setup',
    required: true,
    actions: {
      primary: 'Verify Phone',
      secondary: 'Skip for Now'
    }
  },
  {
    id: 'notifications',
    title: 'Enable Notifications',
    description: 'Get instant alerts about potential scams and security updates.',
    icon: Bell,
    type: 'permission',
    required: false,
    actions: {
      primary: 'Enable Notifications',
      secondary: 'Maybe Later'
    }
  },
  {
    id: 'privacy-settings',
    title: 'Privacy & Security',
    description: 'Customize your privacy settings and choose what data to share.',
    icon: Lock,
    type: 'setup',
    actions: {
      primary: 'Configure Privacy',
      secondary: 'Use Defaults'
    }
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    subtitle: '🎉 Welcome to ScamShield',
    description: 'Your account is ready. Start protecting yourself from scams today!',
    icon: CheckCircle,
    type: 'complete',
    actions: {
      primary: 'Start Using ScamShield',
      secondary: 'Take a Tour'
    }
  }
];

// Feature showcase data
const features = [
  {
    icon: Shield,
    title: 'AI-Powered Detection',
    description: 'Advanced machine learning identifies scams in real-time'
  },
  {
    icon: Phone,
    title: 'Call Protection',
    description: 'Block spam calls and suspicious numbers automatically'
  },
  {
    icon: Mail,
    title: 'Email Scanning',
    description: 'Analyze emails for phishing attempts and fraud'
  },
  {
    icon: Globe,
    title: 'Web Protection',
    description: 'Browse safely with our URL scanning technology'
  }
];

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (completedSteps: string[]) => void;
  customSteps?: OnboardingStep[];
  autoStart?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
}

export function OnboardingFlow({
  isOpen,
  onClose,
  onComplete,
  customSteps = defaultSteps,
  autoStart = true,
  showProgress = true,
  allowSkip = true
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<{
    notifications: 'granted' | 'denied' | 'default';
  }>({ notifications: 'default' });

  const steps = customSteps;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Handle gesture navigation
  const gestures = useMobileGestures({
    onSwipeLeft: () => nextStep(),
    onSwipeRight: () => previousStep(),
  }, {
    enabled: isOpen && !isAnimating,
    threshold: 100,
    direction: 'horizontal'
  });

  useEffect(() => {
    // Check notification permission status
    if ('Notification' in window) {
      setPermissionStatus(prev => ({
        ...prev,
        notifications: Notification.permission
      }));
    }
  }, []);

  const nextStep = async () => {
    if (isAnimating || currentStep >= steps.length - 1) return;
    
    setIsAnimating(true);
    HapticFeedback.light();
    
    // Mark current step as completed
    const currentStepId = steps[currentStep].id;
    setCompletedSteps(prev => [...prev, currentStepId]);
    
    // Move to next step
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const previousStep = () => {
    if (isAnimating || currentStep <= 0) return;
    
    setIsAnimating(true);
    HapticFeedback.light();
    
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  const skipStep = () => {
    if (steps[currentStep].required) return;
    nextStep();
  };

  const handleComplete = () => {
    HapticFeedback.success();
    const allCompletedSteps = [...completedSteps, steps[currentStep].id];
    onComplete?.(allCompletedSteps);
    onClose();
  };

  const handlePermissionRequest = async (type: 'notifications') => {
    if (type === 'notifications' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(prev => ({ ...prev, notifications: permission }));
        
        if (permission === 'granted') {
          HapticFeedback.success();
        } else {
          HapticFeedback.warning();
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        HapticFeedback.error();
      }
    }
  };

  const renderStepContent = (step: OnboardingStep) => {
    const Icon = step.icon;

    switch (step.type) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center"
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{step.title}</h1>
              {step.subtitle && (
                <p className="text-lg text-muted-foreground">{step.subtitle}</p>
              )}
            </div>
            
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              {step.description}
            </p>
            
            <div className="flex flex-col gap-2 pt-4">
              <Badge variant="secondary" className="mx-auto">
                <Users className="w-4 h-4 mr-1" />
                Trusted by 10M+ users
              </Badge>
              <Badge variant="secondary" className="mx-auto">
                <Star className="w-4 h-4 mr-1" />
                4.8/5 App Store Rating
              </Badge>
            </div>
          </div>
        );

      case 'feature':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
              >
                <Icon className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 rounded-lg bg-muted/50 text-center"
                  >
                    <FeatureIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 'permission':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center"
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            
            {step.id === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    permissionStatus.notifications === 'granted' ? 'bg-green-500' :
                    permissionStatus.notifications === 'denied' ? 'bg-red-500' : 'bg-gray-400'
                  )} />
                  <span className="text-sm">
                    Status: {permissionStatus.notifications === 'granted' ? 'Enabled' : 
                            permissionStatus.notifications === 'denied' ? 'Blocked' : 'Not Set'}
                  </span>
                </div>
                
                {permissionStatus.notifications === 'granted' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700">Great! Notifications are enabled.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'setup':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center"
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            
            {step.required && (
              <Badge variant="destructive">Required</Badge>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{step.title}</h1>
              {step.subtitle && (
                <p className="text-xl">{step.subtitle}</p>
              )}
            </div>
            
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              {step.description}
            </p>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="mx-auto">
                <Gift className="w-4 h-4 mr-1" />
                Free Premium Trial
              </Badge>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          <span className="font-semibold">ScamShield</span>
        </div>
        
        {allowSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <SwipeableView
          onSwipeLeft={nextStep}
          onSwipeRight={previousStep}
          className="flex-1 p-6 flex items-center justify-center"
        >
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  {...pageTransitions.fadeSlide}
                >
                  {renderStepContent(currentStepData)}
                </motion.div>
              </AnimatePresence>
            </CardHeader>
            
            <CardFooter className="pt-4 space-y-3">
              {/* Primary Action */}
              <Button
                className="w-full"
                onClick={isLastStep ? handleComplete : 
                         currentStepData.id === 'notifications' ? 
                         () => handlePermissionRequest('notifications') : nextStep}
                disabled={isAnimating}
              >
                {currentStepData.actions?.primary || 'Continue'}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              
              {/* Secondary Actions */}
              <div className="flex w-full gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={previousStep}
                    disabled={isAnimating}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                {currentStepData.actions?.secondary && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={nextStep}
                    disabled={isAnimating}
                  >
                    {currentStepData.actions.secondary}
                  </Button>
                )}
                
                {currentStepData.actions?.skip && !currentStepData.required && (
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={skipStep}
                    disabled={isAnimating}
                  >
                    {currentStepData.actions.skip}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </SwipeableView>
      </div>

      {/* Tutorial hint */}
      {currentStep < 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-4 right-4 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Swipe left/right to navigate • Tap buttons to continue
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Onboarding trigger hook
export function useOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    localStorage.getItem('scamshield-onboarding-completed') === 'true'
  );

  const startOnboarding = () => {
    setIsOpen(true);
    HapticFeedback.light();
  };

  const completeOnboarding = (completedSteps: string[]) => {
    setIsOpen(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('scamshield-onboarding-completed', 'true');
    localStorage.setItem('scamshield-onboarding-steps', JSON.stringify(completedSteps));
    HapticFeedback.success();
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem('scamshield-onboarding-completed');
    localStorage.removeItem('scamshield-onboarding-steps');
  };

  return {
    isOpen,
    hasCompletedOnboarding,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    closeOnboarding: () => setIsOpen(false)
  };
}

// Quick onboarding component for existing users
export function QuickOnboarding({
  onComplete
}: {
  onComplete?: () => void;
}) {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      icon: Eye,
      title: 'New Dashboard',
      description: 'Check out the redesigned dashboard with drag-and-drop widgets'
    },
    {
      icon: Smartphone,
      title: 'Mobile Gestures',
      description: 'Swipe, pinch, and tap your way through the app'
    },
    {
      icon: Settings,
      title: 'Theme Options',
      description: 'Switch between light, dark, and auto themes'
    }
  ];

  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader className="text-center">
        <h3 className="text-lg font-semibold">What's New</h3>
        <Badge variant="secondary">Update v2.0</Badge>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            {...animations.fadeInUp}
            className="text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <tips[currentTip].icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">{tips[currentTip].title}</h4>
              <p className="text-sm text-muted-foreground">{tips[currentTip].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
      
      <CardFooter className="space-y-2">
        <div className="flex justify-center gap-1">
          {tips.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentTip ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
        
        <div className="flex w-full gap-2">
          {currentTip > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentTip(prev => prev - 1)}
            >
              Previous
            </Button>
          )}
          
          <Button
            className="flex-1"
            size="sm"
            onClick={() => {
              if (currentTip < tips.length - 1) {
                setCurrentTip(prev => prev + 1);
              } else {
                onComplete?.();
              }
            }}
          >
            {currentTip < tips.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}