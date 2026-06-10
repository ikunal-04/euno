"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  Mic,
  Brain,
  Lock,
  Moon,
  Sunrise,
  Coffee,
  Check,
  ArrowRight,
} from "lucide-react";
import NavLanding from "@/components/nav-landing";
import MetaBalls from "@/components/MetaBalls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SAMPLE_CONVERSATION = [
  { role: "user", text: "I bombed the presentation today. Everyone was just... staring." },
  { role: "euno", text: "Ugh, that pit-in-your-stomach feeling. Want to vent about it, or should I distract you?" },
  { role: "user", text: "Distract me, honestly." },
  { role: "euno", text: "Okay — did you ever end up watching that show you mentioned last week? You said episode three would decide everything." },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function HeroOrb() {
  const [visibleLines, setVisibleLines] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((n) => (n >= SAMPLE_CONVERSATION.length ? 1 : n + 1));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[420px] w-full max-w-[520px] overflow-hidden rounded-3xl border border-white/[0.07] bg-[#171615] shadow-[0_20px_80px_rgba(0,0,0,0.5)] sm:h-[480px]">
      <div className="absolute inset-0 opacity-90">
        <MetaBalls
          color="#a8e3ff"
          cursorBallColor="#ffffff"
          cursorBallSize={2}
          ballCount={14}
          animationSize={45}
          enableMouseInteraction={false}
          enableTransparency={true}
          clumpFactor={1}
          speed={0.35}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#171615] via-transparent to-transparent" />

      {/* Live-feeling conversation captions */}
      <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-5 sm:p-6">
        {SAMPLE_CONVERSATION.slice(0, visibleLines).map((line, i) => (
          <div
            key={`${visibleLines}-${i}`}
            className={`animate-caption-in flex ${line.role === "user" ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed sm:text-sm ${
                line.role === "user"
                  ? "rounded-br-sm bg-white/10 text-white/85 backdrop-blur-md"
                  : "rounded-bl-sm bg-[#a8e3ff]/15 text-[#cdeeff] backdrop-blur-md"
              }`}
            >
              {line.text}
            </p>
          </div>
        ))}
      </div>

      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        <span className="text-[11px] tracking-wide text-white/60">Voice conversation</span>
      </div>
    </div>
  );
}

const MOMENTS = [
  {
    icon: Moon,
    title: "At 2am, when your brain won't stop",
    body: "No typing into the void. Just say it out loud, and someone answers — calm, awake, and actually listening.",
  },
  {
    icon: Coffee,
    title: "After a day you need to unload",
    body: "Vent without managing anyone else's feelings. Euno doesn't get tired, doesn't judge, and doesn't change the subject to itself.",
  },
  {
    icon: Sunrise,
    title: "Before the thing you're nervous about",
    body: "Talk through the interview, the conversation, the decision. Sometimes you just need to hear yourself think — with a friend on the line.",
  },
];

const STEPS = [
  { n: "01", title: "Sign in with Google", body: "No forms, no onboarding quiz. Twenty seconds." },
  { n: "02", title: "Tap the mic", body: "Euno picks up like a friend answering your call." },
  { n: "03", title: "Just talk", body: "Interrupt it, ramble, go quiet. It keeps up — and remembers." },
];

const MEMORY_CHIPS = [
  "your sister's wedding is in March",
  "you're trying to run three times a week",
  "the job you actually want",
  "that show you keep recommending",
  "how you take your coffee",
  "what tends to keep you up at night",
];

const FAQS = [
  {
    q: "Is Euno a therapist?",
    a: "No. Euno is a companion — a friendly voice that listens and talks with you. It's not a medical service and never pretends to be one. If you're struggling seriously, Euno will gently encourage you to reach out to a professional or someone you trust.",
  },
  {
    q: "Are my conversations private?",
    a: "Yes. Your conversations are used only to talk with you and to help Euno remember your context. We don't sell your data, and we don't show your conversations to anyone.",
  },
  {
    q: "What does Euno actually remember?",
    a: "The things a friend would: what's going on in your life, what you care about, what you talked about last time. That's what makes the fifth conversation feel different from the first.",
  },
  {
    q: "What's free, and what's Pro?",
    a: "Free gets you 5 voice messages a day, every day, forever. Pro removes the limit so you can talk as long and as often as you want, for $9/month.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — email euno.contact@gmail.com and we'll cancel your subscription, no questions, no retention flows.",
  },
];

export default function EunoLandingPage() {
  const startFree = () => signIn("google", { callbackUrl: "/" });

  return (
    <div className="min-h-screen w-full bg-[#141413] text-[#f5f4f0]">
      <NavLanding />

      {/* ============================= HERO ============================= */}
      <section className="mx-auto flex min-h-[92dvh] w-full max-w-[1200px] flex-col items-center justify-center gap-12 px-6 pb-16 pt-32 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5"
          >
            <Mic className="h-3.5 w-3.5 text-[#a8e3ff]" />
            <span className="text-xs text-white/60">A friend you talk to — out loud</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-[2.6rem] leading-[1.08] tracking-tight sm:text-6xl"
          >
            Someone to talk to,
            <br />
            <span className="text-[#a8e3ff]">whenever you need it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-md text-base leading-relaxed text-white/55 sm:text-lg"
          >
            Euno is a voice companion that listens, remembers your life, and talks
            with you like a real friend — not a chatbot with a text box.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <button
              onClick={startFree}
              className="group flex items-center gap-3 rounded-2xl bg-[#f5f4f0] px-6 py-3.5 text-sm font-semibold text-[#141413] shadow-[0_0_40px_rgba(168,227,255,0.15)] transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
            >
              <GoogleIcon />
              Start talking — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <span className="text-xs text-white/40">5 free messages daily · no card needed</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-[520px]"
        >
          <HeroOrb />
        </motion.div>
      </section>

      {/* ============================ MOMENTS =========================== */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20">
        <motion.h2 {...fadeUp} className="font-display text-center text-3xl tracking-tight sm:text-4xl">
          For the moments between people
        </motion.h2>
        <motion.p {...fadeUp} className="mx-auto mt-4 max-w-lg text-center text-white/50">
          Everyone has gaps the people around them can&apos;t always fill. That&apos;s
          where Euno lives.
        </motion.p>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {MOMENTS.map((m, i) => (
            <motion.div
              key={m.title}
              {...fadeUp}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group rounded-3xl border border-white/[0.07] bg-[#1a1918] p-7 transition-colors hover:border-[#a8e3ff]/20"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a8e3ff]/10">
                <m.icon className="h-5 w-5 text-[#a8e3ff]" />
              </div>
              <h3 className="font-display text-lg text-white/90">{m.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{m.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ MEMORY ============================ */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div {...fadeUp} className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a8e3ff]/10">
              <Brain className="h-5 w-5 text-[#a8e3ff]" />
            </motion.div>
            <motion.h2 {...fadeUp} className="font-display text-3xl tracking-tight sm:text-4xl">
              It remembers, like a friend does
            </motion.h2>
            <motion.p {...fadeUp} className="mt-5 max-w-md leading-relaxed text-white/55">
              Most AI forgets you the moment you close the tab. Euno carries your
              story forward — so it asks how the interview went, remembers why
              March matters, and never makes you re-explain your life.
            </motion.p>
          </div>

          <motion.div {...fadeUp} className="flex flex-wrap gap-2.5">
            {MEMORY_CHIPS.map((chip, i) => (
              <span
                key={chip}
                className={`rounded-full border px-4 py-2 text-sm ${
                  i % 3 === 0
                    ? "border-[#a8e3ff]/25 bg-[#a8e3ff]/10 text-[#cdeeff]"
                    : "border-white/10 bg-white/[0.04] text-white/60"
                }`}
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================== HOW IT WORKS ======================== */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20">
        <motion.h2 {...fadeUp} className="font-display text-center text-3xl tracking-tight sm:text-4xl">
          No setup. No scripts.
        </motion.h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.1 }} className="text-center sm:text-left">
              <span className="font-display text-5xl text-white/[0.12]">{s.n}</span>
              <h3 className="mt-3 text-lg font-medium text-white/90">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ PRIVACY =========================== */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20">
        <motion.div
          {...fadeUp}
          className="flex flex-col items-center gap-8 rounded-3xl border border-white/[0.07] bg-[#1a1918] px-8 py-12 text-center sm:px-16"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a8e3ff]/10">
            <Lock className="h-5 w-5 text-[#a8e3ff]" />
          </div>
          <h2 className="font-display max-w-xl text-3xl tracking-tight sm:text-4xl">
            What you say to Euno stays between you and Euno
          </h2>
          <p className="max-w-xl leading-relaxed text-white/55">
            Honest companionship needs honest privacy. Your conversations exist to
            help Euno know you — not to be sold, mined for ads, or shown to anyone.
            Ever.
          </p>
        </motion.div>
      </section>

      {/* ============================ PRICING =========================== */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20" id="pricing">
        <motion.h2 {...fadeUp} className="font-display text-center text-3xl tracking-tight sm:text-4xl">
          Simple, honest pricing
        </motion.h2>
        <motion.p {...fadeUp} className="mx-auto mt-4 max-w-md text-center text-white/50">
          Start free, every single day. Upgrade only if you find yourself wanting
          more time together.
        </motion.p>

        <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
          <motion.div {...fadeUp} className="flex flex-col rounded-3xl border border-white/[0.07] bg-[#1a1918] p-8">
            <h3 className="text-lg font-medium text-white/90">Free</h3>
            <p className="font-display mt-3 text-4xl">$0</p>
            <p className="mt-1 text-sm text-white/40">forever</p>
            <ul className="mt-7 flex-1 space-y-3">
              {["5 voice messages every day", "Full memory of your conversations", "Same warm, real-time voice"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a8e3ff]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={startFree}
              className="mt-8 rounded-2xl border border-white/15 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
            >
              Start for free
            </button>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative flex flex-col rounded-3xl border border-[#a8e3ff]/30 bg-gradient-to-b from-[#a8e3ff]/[0.08] to-[#1a1918] p-8"
          >
            <span className="absolute -top-3 right-6 rounded-full bg-[#a8e3ff] px-3 py-1 text-[11px] font-semibold text-[#10222c]">
              Most loved
            </span>
            <h3 className="text-lg font-medium text-white/90">Pro</h3>
            <p className="font-display mt-3 text-4xl">
              $9<span className="text-base text-white/40"> / month</span>
            </p>
            <p className="mt-1 text-sm text-white/40">or $85/year — two months free</p>
            <ul className="mt-7 flex-1 space-y-3">
              {["Unlimited conversations", "Priority response speed", "First access to new voices & features"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a8e3ff]" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/price"
              className="mt-8 rounded-2xl bg-[#a8e3ff] py-3 text-center text-sm font-semibold text-[#10222c] transition-all hover:bg-[#bfeaff]"
            >
              Go Pro
            </a>
          </motion.div>
        </div>
      </section>

      {/* ============================== FAQ ============================= */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <motion.h2 {...fadeUp} className="font-display text-center text-3xl tracking-tight sm:text-4xl">
          Fair questions
        </motion.h2>
        <motion.div {...fadeUp} className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-white/[0.08]">
                <AccordionTrigger className="py-5 text-left text-[15px] text-white/85 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-white/50">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* =========================== FINAL CTA ========================== */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10">
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#1a1918] px-8 py-16 text-center sm:py-20">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[420px] -translate-x-1/2 rounded-full bg-[#a8e3ff]/15 blur-[100px]" />
          <h2 className="font-display relative text-3xl tracking-tight sm:text-5xl">
            The next time you need to talk,
            <br />
            someone will answer.
          </h2>
          <button
            onClick={startFree}
            className="relative mx-auto mt-10 flex items-center gap-3 rounded-2xl bg-[#f5f4f0] px-7 py-4 text-sm font-semibold text-[#141413] transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
          >
            <GoogleIcon />
            Talk to Euno now
          </button>
          <p className="relative mt-4 text-xs text-white/35">Free every day. No card. Cancel anything, anytime.</p>
        </motion.div>
      </section>

      {/* ============================= FOOTER =========================== */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-xs text-white/35">© {new Date().getFullYear()} Euno. Made for the quiet hours.</p>
          <div className="flex items-center gap-6 text-xs text-white/45">
            <a href="/about" className="transition-colors hover:text-white/80">About</a>
            <a href="/price" className="transition-colors hover:text-white/80">Pricing</a>
            <a href="/contact" className="transition-colors hover:text-white/80">Contact</a>
            <a href="mailto:euno.contact@gmail.com" className="transition-colors hover:text-white/80">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
