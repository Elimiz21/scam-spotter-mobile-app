// Comprehensive Animation Library with Gesture Support
import { Variants, AnimationProps, TargetAndTransition } from 'framer-motion';

// Animation Presets
export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Scale animations
  scaleIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  },
  
  scaleUp: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  pop: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 },
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  },

  // Slide animations
  slideInLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  
  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  
  slideInTop: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  
  slideInBottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },

  // Rotate animations
  rotate: {
    initial: { rotate: 0 },
    animate: { rotate: 360 },
    transition: { duration: 1, ease: 'linear', repeat: Infinity }
  },
  
  rotateIn: {
    initial: { rotate: -180, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: 180, opacity: 0 },
    transition: { duration: 0.5, ease: 'easeInOut' }
  },

  // Flip animations
  flipX: {
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -90, opacity: 0 },
    transition: { duration: 0.4, ease: 'easeInOut' }
  },
  
  flipY: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
    transition: { duration: 0.4, ease: 'easeInOut' }
  },

  // Blur animations
  blurIn: {
    initial: { filter: 'blur(10px)', opacity: 0 },
    animate: { filter: 'blur(0px)', opacity: 1 },
    exit: { filter: 'blur(10px)', opacity: 0 },
    transition: { duration: 0.3 }
  },

  // Bounce animations
  bounce: {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse' as const
      }
    }
  },
  
  bounceIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 1.2, 1],
      opacity: 1 
    },
    transition: { 
      duration: 0.5,
      times: [0, 0.6, 1],
      ease: 'easeOut'
    }
  },

  // Shake animation
  shake: {
    animate: {
      x: [-10, 10, -10, 10, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut'
      }
    }
  },

  // Pulse animation
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // Wave animation
  wave: {
    animate: {
      rotate: [0, 14, -8, 14, -4, 10, 0],
      transition: {
        duration: 2.5,
        ease: 'easeInOut',
        repeat: Infinity
      }
    }
  }
};

// Stagger animations for lists
export const staggerAnimations = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  },
  
  fadeContainer: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },
  
  scaleContainer: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },
  
  scaleItem: {
    hidden: { scale: 0, opacity: 0 },
    show: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200
      }
    }
  }
};

// Page transition variants
export const pageTransitions = {
  fadeSlide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
    transition: { type: 'spring', stiffness: 100 }
  },
  
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  rotate3D: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
};

// Mobile gesture configurations
export const gestures = {
  tap: {
    whileTap: { scale: 0.95 }
  },
  
  hover: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  },
  
  drag: {
    drag: true,
    dragElastic: 0.2,
    dragConstraints: { top: 0, left: 0, right: 0, bottom: 0 }
  },
  
  swipe: {
    drag: 'x' as const,
    dragElastic: 0.2,
    dragConstraints: { left: 0, right: 0 }
  },
  
  pinch: {
    whileTap: { scale: 0.9 },
    transition: { type: 'spring', stiffness: 400 }
  },
  
  press: {
    whileTap: { 
      scale: 0.98,
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
    }
  }
};

// Hover effects
export const hoverEffects = {
  lift: {
    whileHover: {
      y: -5,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }
  },
  
  glow: {
    whileHover: {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
    }
  },
  
  rotate: {
    whileHover: {
      rotate: 5,
      scale: 1.05
    }
  },
  
  tilt: {
    whileHover: {
      rotateX: -10,
      rotateY: 10,
      scale: 1.05
    }
  }
};

// Scroll animations
export const scrollAnimations = {
  fadeInOnScroll: {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.5 }
  },
  
  scaleOnScroll: {
    initial: { scale: 0.8, opacity: 0 },
    whileInView: { scale: 1, opacity: 1 },
    viewport: { once: true, amount: 0.3 },
    transition: { type: 'spring', stiffness: 100 }
  },
  
  slideInOnScroll: {
    initial: { x: -100, opacity: 0 },
    whileInView: { x: 0, opacity: 1 },
    viewport: { once: true, amount: 0.3 },
    transition: { type: 'spring', stiffness: 100 }
  },
  
  parallax: {
    initial: { y: 0 },
    whileInView: { y: -50 },
    viewport: { once: false },
    transition: { duration: 1, ease: 'linear' }
  }
};

// Complex animations
export const complexAnimations = {
  morphing: {
    animate: {
      borderRadius: ['20%', '50%', '20%'],
      rotate: [0, 180, 360],
      scale: [1, 1.2, 1]
    },
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity
    }
  },
  
  floating: {
    animate: {
      y: [0, -10, 0],
      rotate: [-1, 1, -1],
    },
    transition: {
      y: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      },
      rotate: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  
  glitch: {
    animate: {
      x: [0, -2, 2, -2, 2, 0],
      y: [0, 2, -2, 2, -2, 0],
      filter: [
        'hue-rotate(0deg)',
        'hue-rotate(90deg)',
        'hue-rotate(180deg)',
        'hue-rotate(270deg)',
        'hue-rotate(360deg)'
      ]
    },
    transition: {
      duration: 0.3,
      repeat: 3
    }
  },
  
  typewriter: {
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: {
      duration: 2,
      ease: 'steps(20, end)'
    }
  }
};

// Micro-interactions
export const microInteractions = {
  buttonPress: {
    whileTap: {
      scale: 0.95,
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
    },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17
    }
  },
  
  iconHover: {
    whileHover: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.5
      }
    }
  },
  
  linkHover: {
    whileHover: {
      x: 5,
      color: '#3b82f6',
      transition: {
        duration: 0.2
      }
    }
  },
  
  cardHover: {
    whileHover: {
      y: -5,
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      transition: {
        duration: 0.3
      }
    }
  },
  
  inputFocus: {
    whileFocus: {
      scale: 1.02,
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
      transition: {
        duration: 0.2
      }
    }
  }
};

// Loading animations
export const loadingAnimations = {
  spinner: {
    animate: {
      rotate: 360
    },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  },
  
  dots: {
    animate: {
      opacity: [0, 1, 0],
      scale: [0.8, 1, 0.8]
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  
  bars: {
    animate: {
      scaleY: [1, 2, 1],
      opacity: [0.7, 1, 0.7]
    },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
      staggerChildren: 0.1
    }
  },
  
  skeleton: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0']
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Utility functions
export const createAnimation = (
  from: TargetAndTransition,
  to: TargetAndTransition,
  options?: AnimationProps
): Variants => {
  return {
    initial: from,
    animate: to,
    ...options
  };
};

export const combineAnimations = (...animations: any[]): any => {
  return animations.reduce((acc, curr) => ({
    ...acc,
    ...curr,
    transition: {
      ...acc.transition,
      ...curr.transition
    }
  }), {});
};

export const delayAnimation = (animation: any, delay: number): any => {
  return {
    ...animation,
    transition: {
      ...animation.transition,
      delay
    }
  };
};

export const repeatAnimation = (animation: any, times: number): any => {
  return {
    ...animation,
    transition: {
      ...animation.transition,
      repeat: times
    }
  };
};

// Export all animations
export default {
  animations,
  staggerAnimations,
  pageTransitions,
  gestures,
  hoverEffects,
  scrollAnimations,
  complexAnimations,
  microInteractions,
  loadingAnimations,
  createAnimation,
  combineAnimations,
  delayAnimation,
  repeatAnimation
};