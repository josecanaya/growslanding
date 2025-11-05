import { Variants } from 'framer-motion';

// Fade in animations
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.8, delay: 0.2 }
  }
};

// Slide animations
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, delay: 0.3 }
  }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, delay: 0.4 }
  }
};

// Stagger children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.3 }
};

export const hoverScaleSmall = {
  scale: 1.02,
  transition: { duration: 0.3 }
};

export const hoverTranslateX = {
  x: 2,
  transition: { duration: 0.3 }
};

// Tap animations
export const tapScale = {
  scale: 0.95
};

// Viewport animations
export const viewport = {
  once: true,
  margin: "-100px"
};

export const viewportAll = {
  once: true
};

