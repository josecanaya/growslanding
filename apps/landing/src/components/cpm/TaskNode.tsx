import { motion } from 'framer-motion';

type Props = {
  p: { x: number; y: number; w: number; h: number };
  title: string;
  owner: string;
  duration: number;
  isCritical: boolean;
  meta: { ES: number; EF: number; LS: number; LF: number; slack: number };
  index: number;
};

export default function TaskNode({ p, title, owner, duration, isCritical, meta, index }: Props) {
  return (
    <motion.div
      className={`absolute rounded-lg bg-white border shadow-md hover:shadow-lg transition-shadow
        ${isCritical ? "border-yellow-400 shadow-yellow-200" : "border-neutral-200"}`}
      style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: "easeOut" 
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      <div className="flex flex-col items-center justify-center h-full p-3">
        <div className="font-bold text-[14px] text-gray-900 text-center">{title}</div>
        <div className="text-[12px] text-gray-600 mt-1">{duration}d</div>
      </div>
    </motion.div>
  );
}
