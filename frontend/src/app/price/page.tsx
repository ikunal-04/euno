"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { PLAN_IDS } from "@/config/const";
import Script from "next/script";
import { createSubscription } from "@/lib/razorpay/client";
import { useUserStore } from "@/store/useUser";
import { useRouter } from "next/navigation";
import NavLanding from "@/components/nav-landing";

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
    <div className="min-h-screen bg-[#141413] text-white flex flex-col items-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12 font-delius relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {!user && <NavLanding />}

      {/* Back button */}
      {user && (

        <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-400 hover:text-white bg-[#141413] hover:bg-[#2a2a2a]/90 rounded-full px-3 py-1.5 transition-colors duration-200 group sm:top-6 sm:left-6"
        >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="text-xs sm:text-sm md:text-base">Back</span>
        </motion.button>

      )}

      {/* Centered content */}
      <div
        className={`flex flex-col items-center w-full max-w-6xl ${
          !user ? "pt-20 sm:pt-24" : "pt-12 sm:pt-16 "
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center  mb-8 sm:mb-12 md:mb-16 lg:mb-20 px-2 sm:px-0"
        >
          <h1 className="font-light text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[#faf9f5] pb-2">
            Upgrade Your Plan
          </h1>
          <p className="text-gray-400 mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto">
            Whether you just want to talk or need a true companion, we've got you covered.
          </p>
        </motion.div>


        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-4xl">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border transition-all duration-300 group border-[#2a2927] bg-[#1a1918] flex flex-col justify-between 
                ${plan.id === PLAN_IDS.Free ? "min-h-[280px] sm:min-h-[320px] md:min-h-[350px]" : "min-h-[300px] sm:min-h-[340px] md:min-h-[380px]"}
                `}
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{plan.name}</h2>
                  {plan.highlight && (
                    <span className="bg-[#a8e3ff] text-black text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-semibold self-start sm:self-auto">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1.5 sm:mb-2">
                  ${isYearly ? plan.yearly : plan.monthly}
                  <span className="text-xs sm:text-sm md:text-base text-gray-400 ml-1">
                    /{isYearly ? "year" : "month"}
                  </span>
                </p>
                <p className="text-gray-400 mb-3 sm:mb-4 md:mb-5 text-xs sm:text-sm md:text-base">{plan.description}</p>

                <ul className="space-y-1.5 sm:space-y-2 md:space-y-3 mb-4 sm:mb-5 md:mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5 sm:gap-2 text-gray-300 text-[11px] sm:text-xs md:text-sm">
                      <Check className="text-[#a8e3ff] w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-2 sm:py-2.5 md:py-3 rounded-full font-medium transition-all duration-300 text-[11px] sm:text-xs md:text-sm ${
                  plan.id === PLAN_IDS.Free
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : plan.id === PLAN_IDS.Pro && user?.plans === "PRO"
                    ? "bg-[#a8e3ff]/10 text-white cursor-not-allowed"
                    : plan.highlight
                    ? "bg-[#a8e3ff] text-black hover:bg-[#9dd3ef]"
                    : "bg-[#2a2927] hover:bg-[#3a3937]"
                }`}
                onClick={() => {
                  if (plan.id === PLAN_IDS.Free || (plan.id === PLAN_IDS.Pro && user?.plans === "PRO")) return;
                  createSubscription(plan.id, user?.name || undefined, user?.email || undefined);
                }}
                disabled={plan.id === PLAN_IDS.Free || (plan.id === PLAN_IDS.Pro && user?.plans === "PRO")}
              >
                {plan.id === PLAN_IDS.Free
                  ? "Current Plan"
                  : plan.id === PLAN_IDS.Pro && user?.plans === "PRO"
                  ? "Current Plan"
                  : plan.button}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-4 sm:mt-6 md:mt-8 text-center max-w-md px-4">
          Cancel anytime. No hidden fees. Secure payments powered by Razorpay.
        </p>
      </div>
    </div>
  );
}