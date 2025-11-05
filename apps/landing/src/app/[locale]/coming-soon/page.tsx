"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation/Navigation";
import { Footer } from "@/components/footer/Footer";
import "./coming-soon.css";

type Props = { params: { locale: string } };

export default function ComingSoonPage({ params: { locale } }: Props) {
  const launchDate = new Date("2025-11-15T00:00:00").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      if (distance < 0) {
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((distance / (1000 * 60)) % 60),
          seconds: Math.floor((distance / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);

  return (
    <div className="flex flex-col min-h-screen text-gray-900">
      <Navigation />
      
      <section className="min-h-screen relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        >
          <source src="/videos/video-espera.mp4" type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-black/25" />

        <motion.div
          className="absolute top-1/2 left-0 right-0 z-10 h-px glow-line"
          animate={{
            opacity: [0.3, 1, 0.3],
            scaleX: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute top-32 left-0 right-0 z-10 text-center px-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold whitespace-nowrap uppercase tracking-wider title-gradient">
            GROWS SE ESTÁ PREPARANDO
          </h1>
        </motion.div>

        <div className="absolute bottom-2 right-6 z-20">
          <div className="flex flex-col items-center gap-3">
            <p className="font-bold text-2xl uppercase tracking-wider title-gradient-small">
              FALTAN
            </p>
            <div className="flex gap-4">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <motion.div
                  key={unit}
                  className="countdown-box bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center py-4 px-5 min-w-[80px]"
                  animate={{
                    boxShadow: [
                      "0 4px 12px rgba(255, 195, 0, 0)",
                      "0 4px 12px rgba(255, 195, 0, 0.4)",
                      "0 4px 12px rgba(255, 195, 0, 0)",
                    ],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transition: "all 0.3s ease" }}
                >
                  <p className="text-4xl font-black mb-2 leading-tight number-gold">
                    {value.toString().padStart(2, "0")}
                  </p>
                  <p className="text-xs uppercase text-gray-300 font-semibold tracking-widest label-text">
                    {unit === "days" ? "DÍAS" : unit === "hours" ? "HORAS" : unit === "minutes" ? "MIN" : "SEG"}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
