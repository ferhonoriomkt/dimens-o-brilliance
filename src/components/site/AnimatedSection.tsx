import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "section" | "div" | "header" | "footer" | "article";
  id?: string;
}

export function AnimatedSection({ children, className, delay = 0, as = "section", id }: Props) {
  const MotionTag = motion[as] as typeof motion.section;
  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}