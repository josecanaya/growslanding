"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation/Navigation";
import { Footer } from "@/components/footer/Footer";
import "./coming-soon.css";

const LAUNCH_DATE = new Date("2025-11-21T00:00:00");

type Props = { params: { locale: string } };

export default function ComingSoonPage({ params: { locale } }: Props) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE.getTime() - now;

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
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-gray-900 bg-black">
      <Navigation />

      <section className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        >
          <source src="/videos/video-espera.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/40" />

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
          className="relative z-10 px-6 pt-24 md:pt-32"
        >
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-wider title-gradient">
              GROWS SE ESTÁ PREPARANDO
            </h1>
            <p className="text-lg md:text-xl text-gray-200">
              Nos vemos el 21 de noviembre de 2025. Estamos terminando los últimos detalles para lanzar la experiencia completa.
            </p>
          </div>
        </motion.div>

        <div className="absolute bottom-6 left-0 right-0 z-20">
          <div className="flex flex-wrap justify-center gap-4 px-6">
            {[
              { label: "DÍAS", value: timeLeft.days },
              { label: "HORAS", value: timeLeft.hours },
              { label: "MIN", value: timeLeft.minutes },
              { label: "SEG", value: timeLeft.seconds },
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                className="countdown-box bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center py-4 px-5 min-w-[70px] md:min-w-[80px]"
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
                <p className="text-3xl md:text-4xl font-black mb-2 number-gold">
                  {String(value).padStart(2, "0")}
                </p>
                <p className="text-xs uppercase text-gray-300 font-semibold tracking-widest label-text">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
