// Comprehensive Mobile Gesture Hook with Haptic Feedback
import { useEffect, useRef, useState, useCallback } from 'react';
import { PanInfo, useAnimation, useMotionValue } from 'framer-motion';

// Gesture types
export type GestureType = 
  | 'swipe'
  | 'tap'
  | 'doubleTap'
  | 'longPress'
  | 'pinch'
  | 'rotate'
  | 'pan'
  | 'pull';

export interface GestureConfig {
  enabled?: boolean;
  threshold?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  haptic?: boolean;
  preventDefault?: boolean;
}

export interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onPan?: (info: PanInfo) => void;
  onPullToRefresh?: () => Promise<void>;
}

// Haptic feedback utility
class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;

  static light() {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  static medium() {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  static heavy() {
    if (this.isSupported) {
      navigator.vibrate(30);
    }
  }

  static success() {
    if (this.isSupported) {
      navigator.vibrate([10, 10, 10]);
    }
  }

  static warning() {
    if (this.isSupported) {
      navigator.vibrate([20, 10, 20]);
    }
  }

  static error() {
    if (this.isSupported) {
      navigator.vibrate([30, 10, 30, 10, 30]);
    }
  }

  static custom(pattern: number | number[]) {
    if (this.isSupported) {
      navigator.vibrate(pattern);
    }
  }
}

// Main gesture hook
export function useMobileGestures(
  handlers: GestureHandlers,
  config: GestureConfig = {}
) {
  const {
    enabled = true,
    threshold = 50,
    direction = 'both',
    haptic = true,
    preventDefault = true,
  } = config;

  const [isGesturing, setIsGesturing] = useState(false);
  const [gesture, setGesture] = useState<GestureType | null>(null);
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pinchStartRef = useRef<number | null>(null);
  const rotateStartRef = useRef<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);

  // Swipe detection
  const handleSwipe = useCallback((deltaX: number, deltaY: number) => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (direction === 'horizontal' || direction === 'both') {
      if (absX > threshold && absX > absY) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
          setGesture('swipe');
          if (haptic) HapticFeedback.light();
        } else {
          handlers.onSwipeLeft?.();
          setGesture('swipe');
          if (haptic) HapticFeedback.light();
        }
      }
    }

    if (direction === 'vertical' || direction === 'both') {
      if (absY > threshold && absY > absX) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
          setGesture('swipe');
          if (haptic) HapticFeedback.light();
        } else {
          handlers.onSwipeUp?.();
          setGesture('swipe');
          if (haptic) HapticFeedback.light();
        }
      }
    }
  }, [direction, threshold, handlers, haptic]);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    if (preventDefault) e.preventDefault();

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    setIsGesturing(true);

    // Long press detection
    if (handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handlers.onLongPress?.();
        setGesture('longPress');
        if (haptic) HapticFeedback.heavy();
      }, 500);
    }

    // Pinch detection
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartRef.current = distance;
    }
  }, [enabled, preventDefault, handlers, haptic]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;
    if (preventDefault) e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    x.set(deltaX);
    y.set(deltaY);

    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Pan handling
    if (handlers.onPan) {
      handlers.onPan({
        point: { x: touch.clientX, y: touch.clientY },
        delta: { x: deltaX, y: deltaY },
        offset: { x: deltaX, y: deltaY },
        velocity: { x: 0, y: 0 },
      });
      setGesture('pan');
    }

    // Pinch handling
    if (e.touches.length === 2 && pinchStartRef.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleValue = distance / pinchStartRef.current;
      scale.set(scaleValue);

      if (scaleValue > 1.1) {
        handlers.onPinchOut?.(scaleValue);
        setGesture('pinch');
      } else if (scaleValue < 0.9) {
        handlers.onPinchIn?.(scaleValue);
        setGesture('pinch');
      }
    }
  }, [enabled, preventDefault, handlers, x, y, scale]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Reset motion values
    x.set(0);
    y.set(0);
    scale.set(1);
    rotate.set(0);

    setIsGesturing(false);

    // Swipe detection
    if (deltaTime < 300) {
      handleSwipe(deltaX, deltaY);
    }

    // Tap detection
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < 10 && deltaTime < 200) {
      const now = Date.now();
      
      // Double tap detection
      if (now - lastTapRef.current < 300) {
        handlers.onDoubleTap?.();
        setGesture('doubleTap');
        if (haptic) HapticFeedback.medium();
        lastTapRef.current = 0;
      } else {
        // Single tap
        handlers.onTap?.();
        setGesture('tap');
        if (haptic) HapticFeedback.light();
        lastTapRef.current = now;
      }
    }

    touchStartRef.current = null;
    pinchStartRef.current = null;
    rotateStartRef.current = null;

    // Clear gesture after animation
    setTimeout(() => setGesture(null), 100);
  }, [enabled, handleSwipe, handlers, haptic, x, y, scale, rotate]);

  // Pull to refresh
  const handlePullToRefresh = useCallback(async () => {
    if (!handlers.onPullToRefresh) return;
    
    setGesture('pull');
    if (haptic) HapticFeedback.success();
    
    try {
      await handlers.onPullToRefresh();
    } finally {
      setGesture(null);
    }
  }, [handlers, haptic]);

  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;

    const element = document.documentElement;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isGesturing,
    gesture,
    x,
    y,
    scale,
    rotate,
    handlePullToRefresh,
    HapticFeedback,
  };
}

// Swipeable component wrapper
export function SwipeableView({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}) {
  const { isGesturing, gesture } = useMobileGestures(
    {
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    },
    {
      threshold,
      haptic: true,
    }
  );

  return (
    <div 
      className={className}
      data-gesturing={isGesturing}
      data-gesture={gesture}
    >
      {children}
    </div>
  );
}

// Pull to refresh component
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
}: {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    HapticFeedback.success();
    
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startY) return;
      
      currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
        
        if (distance > threshold / 2) {
          HapticFeedback.light();
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > threshold) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
      startY = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, handleRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-auto">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all"
        style={{
          height: pullDistance,
          opacity: Math.min(pullDistance / threshold, 1),
        }}
      >
        <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
          {pullDistance > threshold ? '↻' : '↓'}
        </div>
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Export utilities
export { HapticFeedback };