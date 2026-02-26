import React from "react";
import { motion } from "framer-motion";

interface AnimatedBlogCardProps {
  title: string;
  description: string;
  date: string;
  url: string;
  index: number;
}

export default function AnimatedBlogCard({
  title,
  description,
  date,
  url,
  index,
}: AnimatedBlogCardProps) {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
        delay: index * 0.1,
      },
    },
    hover: {
      y: -8,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.a
      href={url}
      className="blog-card group block h-full rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300"
      variants={variants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, amount: 0.3 }}
    >
      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{date}</span>
        <motion.span
          className="text-blue-600 group-hover:translate-x-1 transition-transform"
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          →
        </motion.span>
      </div>
    </motion.a>
  );
}
