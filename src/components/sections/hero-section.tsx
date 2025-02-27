"use client";

import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight";
import { GridBackground } from "@/components/ui/spotlight";

export function HeroSection() {
  return (
    <div className="relative w-full overflow-hidden bg-black min-h-screen">
      <GridBackground />
      <Spotlight />
      
      <div className="relative z-50">
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <div className="max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-8xl font-bold text-white mb-6"
            >
              14TH ST
            </motion.h1>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white/80 mb-8"
            >
             
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
            >
             
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
} 