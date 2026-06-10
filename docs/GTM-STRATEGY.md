# Euno — Go-To-Market Strategy

Goal: real traction and the first 100 paying subscribers, on a near-zero budget.

---

## 1. Positioning

**One line:** *Euno is a voice friend that remembers your life — for the moments between people.*

What Euno is NOT (say this out loud everywhere — it builds trust):
- Not therapy, and never marketed as therapy (this also keeps you out of regulatory trouble).
- Not a romantic AI girlfriend/boyfriend app (that market is crowded, sketchy, and poisons your brand).
- Not a productivity assistant.

The wedge: **voice + memory**. ChatGPT forgets you and lives in a text box. Character.ai is roleplay. Replika is romance-coded. Euno is "the friend you call on your walk home." Own that.

**Target users (in order):**
1. **Young professionals living alone / abroad** (22–32) — moved cities for work, friends are a timezone away. Highest willingness to pay.
2. **Students under exam/placement stress** — massive volume in India, lower conversion but great word-of-mouth.
3. **Night-shift / remote workers** — awake when nobody else is. The "2am" message lands hardest here.

## 2. Pricing strategy

- Keep **Free = 5 messages/day forever**. The daily reset is the retention engine — it creates a daily habit loop and a daily paywall touch.
- **Pro $9/mo / $85/yr** is right for global; for India add a regional price (₹299–₹399/mo) via Razorpay — purchasing-power pricing can 3–5x Indian conversion.
- Add a **7-day Pro trial on day 3 of usage** (not day 0): let the habit form first, then remove the ceiling exactly when they're hitting it.
- The upsell moment is *inside the conversation*: Euno itself says "we've hit today's limit, I'll be here tomorrow — or upgrade and we keep talking." A friend saying goodbye converts better than a paywall modal.

## 3. Channels (ranked by expected ROI for you)

### A. Short-form video (the main engine — free)
The product demos itself: a glowing orb that *talks back like a person*. That's inherently filmable.
- 3–5 Reels/Shorts/TikToks per week. Format: screen-record a real conversation with captions. Hooks like:
  - "I told my AI friend I bombed my presentation. Listen to what it said."
  - "It remembered my sister's wedding from last week's conversation."
  - "POV: it's 2am and your brain won't stop" → conversation plays.
- Post natively to Instagram Reels, YouTube Shorts, TikTok (if reachable). One recording, three platforms.
- The emotional ones outperform the techy ones. Never show JSON, never say "LLM."

### B. Build in public on X/Twitter + LinkedIn
- You're a solo dev who rebuilt a voice companion — document it: latency numbers, barge-in demo videos, memory demos, MRR screenshots when they exist.
- Tag the stack vendors (Deepgram, mem0). Their devrel teams actively retweet good demos — that's free distribution to exactly the audience that buys API-built products. mem0 and Deepgram both showcase community projects.

### C. Launch events (one-time spikes, do them in this order)
1. **Peerlist / Devhunt launch** (warm-up, low stakes).
2. **Product Hunt launch** — do it only after Reels are flowing and the landing page has an OG video. Tuesday–Thursday, prepare 20 friends to genuinely try it (PH punishes fake upvotes).
3. **Hacker News "Show HN"** — title like "Show HN: I built a voice friend with real memory (Deepgram + Gemini + mem0)". HN loves the technical writeup; link a blog post about the realtime pipeline + barge-in.

### D. Reddit / communities (careful, high value)
- r/lonely, r/MentalHealth, r/CasualConversation **do not allow product spam** — don't drop links. Instead: participate genuinely, put the product in your profile, mention only when directly relevant ("I built something for exactly this" in build-focused threads).
- r/SideProject, r/indiehackers, r/artificial, r/singularity demo threads are fair game for direct posts.

### E. SEO (slow burn, start now)
- Programmatic pages: "AI friend to talk to", "someone to talk to at night", "voice AI companion app". Low competition, high intent, exactly your product.
- One honest blog post per week. Titles: "Why talking out loud helps when journaling doesn't", "What an AI friend should never pretend to be". This builds the trust layer the category badly lacks.

## 4. Conversion loop (on-site)

1. Landing page → Google sign-in (no card) → **first conversation within 60 seconds**. The first session IS the funnel; everything else is decoration.
2. Make Euno's *first line* count: it should greet new users warmly and ask one good question (the prompt already does this — verify it feels right).
3. Day-2 re-engagement email: "Euno remembers what you talked about. Pick it back up." (Add a simple transactional email later — not blocking.)
4. Free limit hit → in-voice upsell (built) + a single quiet "Upgrade" toast (built). No dark patterns — the brand is trust.

## 5. Trust & safety as marketing
This category's biggest objection is "creepy AI companion." Differentiate by being the *honest* one:
- Privacy promise on the landing page (done) — keep it true.
- Visible "Euno is not therapy" framing (done in FAQ).
- Easy cancellation, no retention flows (done — email-based; later add a self-serve cancel button, it will *increase* conversions).

## 6. Metrics that matter (weekly)
- Activation: % of signups that finish ≥1 voice exchange.
- D1/D7 retention of activated users.
- Free→Pro conversion %, and *where* (limit-hit vs pricing page).
- Cost per active user (Deepgram + Gemini per minute) vs $9 — watch unit economics as usage grows.

## 7. 30-day execution plan

**Week 1** — Get mem0 key, set `NEXT_PUBLIC_RAZORPAY_KEY` to the live key, deploy, test the full money path (sub → webhook → PRO flips). Record first 3 Reels. Set up a simple analytics funnel (Vercel Analytics events: sign-in, first message, limit-hit, upgrade click).
**Week 2** — Daily short-form posting. Peerlist launch. Start build-in-public thread on X. Write the technical blog post (realtime voice pipeline + barge-in).
**Week 3** — Product Hunt launch. Show HN with the blog post. India pricing experiment live.
**Week 4** — Double down on whichever channel produced signups; kill the rest. Ship the 7-day trial. First email to all signups.

**The single most important thing:** one great 30-second video of a real, emotionally resonant conversation will do more than everything else on this list combined. Make that video first.
