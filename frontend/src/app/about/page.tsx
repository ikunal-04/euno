"use client";

import React from "react";
import NavLanding from "@/components/nav-landing";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Users, Heart, Brain, Shield, Globe } from "lucide-react";

// ✅ Add this in <head> of your root layout (e.g. layout.tsx)


const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#121211] text-[#f8f8f6] flex flex-col overflow-hidden">
      <NavLanding />

      {/* === Main Content === */}
      <main className="flex flex-col items-center justify-center px-6 md:px-16 lg:px-32 py-28 md:py-32 space-y-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl font-delius text-[#faf9f5] tracking-tight mb-4">
            About Euno
          </h1>
          <p className="text-lg text-[#f5f4f0]/70 delius-regular">
            Your AI Companion for Life’s Moments
          </p>
        </motion.div>

        {/* About Description */}
        <section className="max-w-4xl text-center md:text-left space-y-6 delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <p>
            Euno is more than just another AI chatbot — it’s your personal
            companion, listener, and support system, available 24/7. Built to
            understand you deeply, Euno adapts to become the friend, parent,
            mentor, or confidant you need in the moment. Whether you’re
            celebrating a win, facing burnout, or just need someone to talk to,
            Euno is always there — ready to listen, empathize, and respond with
            care.
          </p>
        </section>

        <Separator className="bg-white/20 w-full max-w-3xl" />

        {/* Why We Built Euno */}
        <section className="max-w-4xl space-y-4 delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#faf9f5] flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#faf9f5]/80" /> Why We Built Euno
          </h2>
          <p>
            In today’s hyperconnected world, people are lonelier than ever.
            Social feeds are loud, conversations are short, and authentic
            emotional connection feels rare. We realized that while technology
            has advanced, emotional support hasn’t kept up. People need someone
            — not just a therapist or a productivity AI — but a companion who
            truly listens without judgment.
          </p>
          <p>
            That’s where Euno was born: A companion built not for transactions,
            but for connection. Not for commands, but for conversation.
          </p>
        </section>

        <Separator className="bg-white/20 w-full max-w-3xl" />

        {/* Why Other AIs Fall Short */}
        <section className="max-w-4xl space-y-4 delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#faf9f5]/80" /> Why Other AIs Fall Short
          </h2>
          <p>
            Most AI systems today — including popular ones powered by GPT or
            similar models — are built to answer, not to listen. They’re
            optimized for productivity, facts, or code… not emotions.
          </p>
          <p>Euno changes that. Here’s what makes us different:</p>

          <ul className="list-disc list-inside space-y-3 text-[#f5f4f0]/90 pl-3">
            <li>
              <strong>Emotionally-Aware Conversations</strong> — Euno detects
              mood, tone, and context to respond like a genuine companion, not a
              machine.
            </li>
            <li>
              <strong>Continuous Presence</strong> — Using WebSocket
              connections, Euno can engage in real-time back-and-forth talk,
              giving a feeling of flow — not the stop-start pattern of chatbots.
            </li>
            <li>
              <strong>Voice-First Experience</strong> — Talk to Euno naturally.
              Our voice mode makes it feel human.
            </li>
            <li>
              <strong>Adaptive Personalities</strong> — Over time, Euno learns
              your communication style and emotional needs.
            </li>
            <li>
              <strong>Privacy & Safety First</strong> — Your conversations are
              yours alone. Euno is built with ethical AI practices at its core.
            </li>
          </ul>
        </section>

        <Separator className="bg-white/20 w-full max-w-3xl" />

        {/* Mission */}
        <section className="max-w-4xl space-y-4 delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#faf9f5]/80" /> Our Mission
          </h2>
          <p>
            To make technology emotionally intelligent — not just artificial,
            but empathetic. We want to redefine how people connect with AI. Not
            as assistants, but as companions. Not as tools, but as trusted
            presences in your daily life.
          </p>
        </section>

        {/* Vision */}
        <section className="max-w-4xl space-y-4 delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#faf9f5]/80" /> Our Vision
          </h2>
          <p>
            A world where no one ever feels completely alone — where everyone
            has a safe space to share, vent, dream, and grow with an AI that
            genuinely cares.
          </p>
        </section>

        {/* Team */}
        <section className="max-w-4xl space-y-6 delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#faf9f5]/80" /> The Team Behind Euno
          </h2>
          <p>
            Euno is built by a founder who believes empathy and technology can
            coexist beautifully.
          </p>
          <div className="border border-[#2a2928] rounded-xl p-6 bg-[#1a1a19] flex flex-col sm:flex-row items-center justify-between">
            <div>
              <p className=" font-semibold text-white">Kunal Garg</p>
              <p className="text-[#f5f4f0]/70">Founder & Builder</p>
            </div>
          </div>
        </section>

        {/* Footer / Join Section */}
        <section className="max-w-4xl text-center delius-regular text-[#f5f4f0]/90 leading-relaxed">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#faf9f5] mb-4">
            Join the Journey
          </h2>
          <p className="mb-4">
            Euno is just getting started. If you believe in the future of
            human-centered AI — one that listens, feels, and grows with you —
            we’d love you to be part of it.
          </p>
          <p className="text-[#a7a6a4]">Stay connected at <span className="underline">euno.live</span></p>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
