"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check } from "lucide-react";
import { PLAN_IDS } from "@/config/const";
import Script from "next/script";
import { createSubscription } from "@/lib/razorpay/client";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      id: PLAN_IDS.Free,
      name: "Free",
      monthly: 0,
      yearly: 0,
      description: "For casual users exploring the basics.",
      features: [
        "Basic AI conversations",
        "Limited daily messages",
        "Standard response speed",
        "Community support",
      ],
      button: "Start for Free",
      highlight: false,
    },
    {
      id: PLAN_IDS.Pro,
      name: "Pro",
      monthly: 9,
      yearly: 85,
      description: "For deeper, faster, and smarter conversations.",
      features: [
        "Priority access to new AI models",
        "Unlimited messages",
        "Voice & emotion detection",
        "Early feature access",
      ],
      button: "Upgrade to Pro",
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#141413] text-white flex flex-col items-center px-6 py-16 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      > 
        {/** TODO ADD THE BACK BUTTON */}
        <h1 className="font-light text-5xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent pb-2">
          Upgrade Your Plan
        </h1>
        <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
          Whether you just want to talk or need a true companion, we’ve got you covered.
        </p>
      </motion.div>

      {/* Toggle */}
      <div className="flex items-center space-x-4 mb-12">
        <span className={`text-sm ${!isYearly ? "text-white" : "text-gray-400"}`}>
          Monthly
        </span>
        <div
          onClick={() => setIsYearly(!isYearly)}
          className="w-14 h-7 flex items-center bg-gray-700 rounded-full cursor-pointer transition-all duration-300"
        >
          <motion.div
            layout
            className="w-5 h-5 bg-indigo-500 rounded-full mx-1"
            animate={{ x: isYearly ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </div>
        <span className={`text-sm ${isYearly ? "text-white" : "text-gray-400"}`}>
          Yearly <span className="text-indigo-400">(Save 20%)</span>
        </span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`relative rounded-2xl p-8 border transition-all duration-300 group ${plan.highlight
                ? "border-indigo-500 bg-[#1d1c1b]"
                : "border-[#2a2927] bg-[#1a1918]"
              } hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10`}
          >

            <div className="flex gap-2 items-center">
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
              {plan.highlight && (
                <span className="bg-indigo-500 text-xs mb-2 px-3 py-1 rounded-xl font-semibold">
                  Popular
                </span>
              )}
            </div>
            <p className="text-4xl font-bold mb-3">
              ${isYearly ? plan.yearly : plan.monthly}
              <span className="text-base text-gray-400 ml-1">
                /{isYearly ? "year" : "month"}
              </span>
            </p>
            <p className="text-gray-400 mb-6">{plan.description}</p>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-gray-300">
                  <Check className="text-indigo-400 w-5 h-5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-full font-medium transition-all duration-300 ${plan.highlight
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "bg-[#2a2927] hover:bg-[#3a3937]"
                }`}
              onClick={() => createSubscription(plan.id)}
            >
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-12">
        Cancel anytime. No hidden fees. Secure payments powered by Razorpay.
      </p>
    </div>
  );
}
