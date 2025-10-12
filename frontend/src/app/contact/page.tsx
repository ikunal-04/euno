"use client";

import React from "react";
import NavLanding from "@/components/nav-landing";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Mail, Handshake, Briefcase, MessageCircle } from "lucide-react";
import { MapPin, Globe, Twitter } from "lucide-react"

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-[#121211] text-[#f8f8f6] flex flex-col overflow-hidden">
      <NavLanding />

      <main className="flex flex-col items-center justify-center px-6 md:px-16 lg:px-32 py-28 md:py-32 space-y-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl font-delius text-[#faf9f5] tracking-tight mb-4">
            Let’s Talk — We’re Always Listening
          </h1>
          <p className="text-lg text-[#f5f4f0]/70 delius-regular">
            Whether you have feedback, partnership ideas, or just want to share your story — we’d love to hear from you.
            At Euno, every conversation matters.
          </p>
        </motion.div>

        <Separator className="bg-white/20 w-full max-w-3xl" />

        {/* Contact Options */}
        <section className="max-w-4xl text-center md:text-left space-y-8 delius-regular text-[#f5f4f0]/90">
          <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
            <Mail className="w-5 h-5 text-[#a8e3ff]" />
            <h2 className="text-2xl md:text-3xl font-semibold">General Inquiries</h2>
          </div>
          <p>Have questions about Euno, media requests, or collaboration ideas?</p>
          <p className="mt-1 font-medium">euno.contact@gmail.com</p>

          <div className="flex items-center gap-2 mb-1 justify-center md:justify-start mt-6">
            <Handshake className="w-5 h-5 text-[#a8e3ff]" />
            <h2 className="text-2xl md:text-3xl font-semibold">Partnerships & Collaborations</h2>
          </div>
          <p>If you’re building in AI, wellness, or voice tech and want to collaborate — we’re open to creative partnerships.</p>
          <p className="mt-1 font-medium">euno.contact@gmail.com</p>
        </section>

        <Separator className="bg-white/20 w-full max-w-3xl" />

        {/* Team Message */}
        <section className="max-w-4xl text-center delius-regular text-[#f5f4f0]/90 space-y-2">
          <p>
            “We built Euno to make people feel heard — and that includes you.
            Every suggestion, message, or story you share helps us improve.
            Thanks for being part of this journey.”
          </p>
          <p className="font-semibold mt-2">— The Euno Team 💙</p>
        </section>

        {/* Footer Info */}
        <section className="max-w-4xl text-center delius-regular text-[#f5f4f0]/70 space-y-2 text-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#a8e3ff]" />
            <span>Based in: New Delhi, India</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#a8e3ff]" />
            <a href="https://euno.live" className="underline">https://euno.live</a>
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="w-4 h-4 text-[#a8e3ff]" />
            <a href="https://twitter.com/euno_live" className="underline">@euno_live</a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#a8e3ff]" />
            <span>euno.contact@gmail.com</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;
