"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation/Navigation";
import { Footer } from "@/components/footer/Footer";
import "./coming-soon.css";

type Props = { params: { locale: string } };

export default function ComingSoonPage({ params: { locale } }: Props) {
  const launchDate = new Date("2025-11-21T00:00:00").getTime();
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
    <div className="flex flex-col min-h-screen text-gray-900 bg-black">
      <Navigation />

      <section className="min-h-[calc(100vh-80px)] relative overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-90"
          >
            <source src="/videos/video-espera.mp4" type="video/mp4" />
          </video>
          <div
            className="md:hidden absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/Herocelular.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <motion.div
          className="absolute md:top-1/2 md:-translate-y-1/2 left-0 right-0 z-10 h-px glow-line"
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
          className="absolute top-24 md:top-28 left-0 right-0 z-20 text-center px-4 md:px-6"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-wider title-gradient">
            GROWS SE ESTÁ PREPARANDO
          </h1>
        </motion.div>

        <div className="absolute bottom-10 md:bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 z-20">
          <div className="flex flex-col items-center gap-3">
            <p className="font-bold text-xl md:text-2xl uppercase tracking-wider title-gradient-small">
              FALTAN
            </p>
            <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 md:gap-4">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <motion.div
                  key={unit}
                  className="countdown-box bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center py-3 md:py-4 px-4 md:px-5 min-w-[72px] md:min-w-[80px]"
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
                >
                  <p className="text-3xl md:text-4xl font-black mb-1 md:mb-2 leading-tight number-gold">
                    {value.toString().padStart(2, "0")}
                  </p>
                  <p className="text-[10px] md:text-xs uppercase text-gray-300 font-semibold tracking-widest label-text">
                    {unit === "days"
                      ? "DÍAS"
                      : unit === "hours"
                      ? "HORAS"
                      : unit === "minutes"
                      ? "MIN"
                      : "SEG"}
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
