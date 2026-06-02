"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-muted/40 border border-border" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-muted/20 dark:bg-muted/40 border border-border hover:bg-muted transition-colors shadow-sm cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ y: -20, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 20, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-teal-400"
          >
            <Sun className="w-[18px] h-[18px]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 20, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-teal-600 dark:text-teal-400"
          >
            <Moon className="w-[18px] h-[18px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
