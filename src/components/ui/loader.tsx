import { motion } from "framer-motion";

export const LoaderOne = () => {
  return (
    <div className="flex items-center justify-center min-h-[150px]">
      <div className="relative flex items-center justify-center">
        {/* Outer Rotating Glowing Ring */}
        <motion.div
          className="w-16 h-16 rounded-full border-[3px] border-brand-orange/10 border-t-brand-orange-light"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ filter: "drop-shadow(0 0 4px rgba(249, 115, 22, 0.2))" }}
        />

        {/* Middle Pulse Ring */}
        <motion.div
          className="absolute w-12 h-12 rounded-full border-2 border-dashed border-brand-orange/30"
          animate={{ rotate: -360, scale: [1, 1.05, 1] }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Centered Glowing Core */}
        <motion.div
          className="absolute w-4 h-4 bg-brand-orange rounded-full"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ boxShadow: "0 0 12px var(--brand-orange, #f97316)" }}
        />
      </div>
    </div>
  );
};
