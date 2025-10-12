"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { PLAN_IDS } from "@/config/const";
import Script from "next/script";
import { createSubscription } from "@/lib/razorpay/client";
import { useUserStore } from "@/store/useUser";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useUserStore();
  const router = useRouter();

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
    <div className="min-h-screen bg-[#141413] text-white flex flex-col justify-center items-center px-6 font-sans relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Back button positioned absolutely at top */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white bg-[#141413] hover:bg-[#2a2a2a]/90 rounded-full px-3 py-1.5 transition-colors duration-200 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <span>Back</span>
      </motion.button>

      {/* Centered content container */}
      <div className="flex flex-col items-center justify-center w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        > 
          <h1 className="font-light text-5xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent pb-2">
            Upgrade Your Plan
          </h1>
          <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
            Whether you just want to talk or need a true companion, we've got you covered.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative rounded-2xl p-8 border transition-all duration-300 group border-[#2a2927] bg-[#1a1918]`}
            >

              <div className="flex gap-2 items-center">
                <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                {plan.highlight && (
                  <span className="bg-[#a8e3ff] text-black text-xs mb-2 px-3 py-1 rounded-xl font-semibold">
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
                    <Check className="text-[#a8e3ff] w-5 h-5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-full font-medium transition-all duration-300 ${
                  plan.id === PLAN_IDS.Free 
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : plan.id === PLAN_IDS.Pro && user?.plans === "PRO"
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : plan.highlight
                    ? "bg-[#a8e3ff] text-black hover:bg-[#9dd3ef]"
                    : "bg-[#2a2927] hover:bg-[#3a3937]"
                }`}
                onClick={() => {
                  if (plan.id === PLAN_IDS.Free || (plan.id === PLAN_IDS.Pro && user?.plans === "PRO")) {
                    return; // No action for Free plan or if user already has Pro
                  }
                  createSubscription(plan.id, user?.name || undefined, user?.email || undefined);
                }}
                disabled={plan.id === PLAN_IDS.Free || (plan.id === PLAN_IDS.Pro && user?.plans === "PRO")}
              >
                {plan.id === PLAN_IDS.Free 
                  ? "Current Plan" 
                  : plan.id === PLAN_IDS.Pro && user?.plans === "PRO"
                  ? "Current Plan"
                  : plan.button
                }
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Cancel anytime. No hidden fees. Secure payments powered by Razorpay.
        </p>
      </div>
    </div>
  );
}
