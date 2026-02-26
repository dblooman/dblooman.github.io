import React from "react";
import { motion } from "framer-motion";

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        ease: "easeInOut" as const,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.section
      className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <motion.h1
              className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-tight"
              variants={itemVariants}
            >
              Building systems at scale
            </motion.h1>
            <motion.p
              className="mt-6 text-xl text-gray-600 leading-relaxed"
              variants={itemVariants}
            >
              Exploring Golang, AI Agents, cloud architecture, and distributed
              systems. Sharing lessons learned from building and deploying
              production systems.
            </motion.p>
            <motion.div className="mt-8 flex gap-4" variants={itemVariants}>
              <motion.a
                href="/about"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                style={{ backgroundColor: "#2563eb", color: "white" }}
                whileHover={{ backgroundColor: "#1e40af", scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                About Me
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="white"
                  viewBox="0 0 24 24"
                  style={{ color: "white" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  ></path>
                </svg>
              </motion.a>
              <motion.a
                href="#posts"
                className="inline-flex items-center px-6 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Read Articles
              </motion.a>
            </motion.div>
          </div>
          <motion.div
            className="relative hidden lg:block"
            variants={itemVariants}
          >
            <motion.div
              className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700"
              animate="animate"
              variants={floatingVariants}
            >
              {/* Terminal decoration */}
              <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-400 text-sm ml-auto">bash</span>
              </div>

              {/* Terminal content */}
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="font-mono text-left w-full">
                  <div className="text-green-400 text-lg mb-4">
                    <span className="text-slate-400">$</span>{" "}
                    build-systems-at-scale
                  </div>
                  <motion.div
                    className="text-green-400 text-sm space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.5,
                      duration: 0.5,
                    }}
                  >
                    <div>
                      <span className="text-blue-300">→</span> Infrastructure &
                      Cloud
                    </div>
                    <div>
                      <span className="text-blue-300">→</span> Distributed
                      Systems
                    </div>
                    <div>
                      <span className="text-blue-300">→</span> Production Ready
                    </div>
                  </motion.div>

                  {/* Blinking cursor */}
                  <motion.span
                    className="inline-block w-2 h-6 bg-green-400 ml-1 mt-4"
                    animate={{ opacity: [1, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  ></motion.span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
