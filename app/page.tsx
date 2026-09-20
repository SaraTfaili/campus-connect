"use client";

import { BadgeCheck, GraduationCap, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Visibility = "email" | "phone" | "academic" | "linkedin";
const steps = ["Verify USC email", "Build your profile", "Choose privacy settings"];

export default function Home() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [privacy, setPrivacy] = useState<Record<Visibility, boolean>>({ email: true, phone: false, academic: true, linkedin: true });
  const [alerts, setAlerts] = useState({ requests: true, updates: true, messages: true });
  const [finished, setFinished] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [sending, setSending] = useState(false);
  const emailIsUSC = email.trim().toLowerCase().endsWith("@usc.edu");
  const sendVerification = async () => {
    if (!emailIsUSC) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setAuthNotice("Add your Supabase URL and anonymous key to activate USC email verification.");
      return;
    }
    setSending(true);
    const supabase = createClient(url, key);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setSending(false);
    setAuthNotice(error ? error.message : "Verification link sent. Check your USC inbox, then return here to continue.");
  };

  return <main className="min-h-screen bg-[#f7f8fc] text-[#15213b]">
    <header className="border-b border-[#e3e7f0] bg-white px-5 py-4 sm:px-10"><div className="mx-auto flex max-w-6xl items-center justify-between"><div className="flex items-center gap-3 font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7667e8] text-white">C</span>Campus Connect</div><span className="text-sm font-medium text-[#748097]">USC pilot</span></div></header>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[280px_1fr] lg:px-10">
      <aside className="rounded-3xl bg-[#1f3260] p-7 text-white"><p className="text-sm font-semibold text-[#c9d4ff]">Student setup</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Join trusted USC communities.</h1><p className="mt-3 text-sm leading-6 text-[#d7dff8]">Your USC email verifies your student identity before you request access to an official club.</p><ol className="mt-10 space-y-5 text-sm">{steps.map((label, index) => { const number = index + 1; const dot = step === number ? "grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-bold text-[#1f3260]" : step > number ? "grid h-7 w-7 place-items-center rounded-full bg-[#7667e8] text-xs font-bold text-white" : "grid h-7 w-7 place-items-center rounded-full bg-[#334878] text-xs font-bold text-[#c9d4ff]"; return <li className="flex items-center gap-3" key={label}><span className={dot}>{step > number ? "✓" : number}</span><span className={step === number ? "font-semibold" : "text-[#c9d4ff]"}>{label}</span></li>; })}</ol></aside>
      <section className="rounded-3xl border border-[#e3e7f0] bg-white p-7 shadow-sm sm:p-10">
        {step === 1 && <div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#6255c9]"><ShieldCheck className="h-4 w-4" />USC only</span><h2 className="mt-5 text-3xl font-semibold tracking-tight">Verify your USC email</h2><p className="mt-3 leading-7 text-[#68758d]">Use your <strong>@usc.edu</strong> address. You will receive a confirmation link before your account becomes active.</p><label className="mt-8 block text-sm font-semibold">USC email address<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@usc.edu" className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 text-base outline-none ring-[#7667e8] transition focus:ring-2" /></label>{email && !emailIsUSC && <p className="mt-2 text-sm text-[#b34d62]">Please enter a valid USC email ending in @usc.edu.</p>}<button onClick={sendVerification} disabled={!emailIsUSC || sending} className="mt-7 rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6658d7] disabled:cursor-not-allowed disabled:opacity-45">{sending ? "Sending..." : "Send verification link"}</button>{authNotice && <p className="mt-3 text-sm text-[#6255c9]">{authNotice}</p>}<p className="mt-5 flex gap-2 text-sm text-[#768299]"><LockKeyhole className="mt-0.5 h-4 w-4" />Your email is only visible to members if you choose to share it.</p></div>}
        {step === 2 && <div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-[#edf9f3] px-3 py-1 text-xs font-bold text-[#287454]"><BadgeCheck className="h-4 w-4" />USC email verified</span><h2 className="mt-5 text-3xl font-semibold tracking-tight">Build your profile</h2><p className="mt-3 leading-7 text-[#68758d]">These details help approved club members understand who they are connecting with.</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold sm:col-span-2">Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]" /></label><label className="text-sm font-semibold">Major<input value={major} onChange={(event) => setMajor(event.target.value)} placeholder="Computer Science" className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]" /></label><label className="text-sm font-semibold">Graduation year<input value={year} onChange={(event) => setYear(event.target.value)} placeholder="2027" className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]" /></label></div><button disabled={!name || !major || !year} onClick={() => setStep(3)} className="mt-7 rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">Continue</button></div>}
        {step === 3 && <div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#6255c9]"><GraduationCap className="h-4 w-4" />Your settings</span><h2 className="mt-5 text-3xl font-semibold tracking-tight">Control your visibility</h2><p className="mt-3 leading-7 text-[#68758d]">Only approved members in a shared community can see the details you choose to share.</p><div className="mt-8 border-t border-[#e7ebf3] pt-7"><h3 className="text-base font-semibold">Directory information</h3><Toggle label="USC email" description="Lets members contact you professionally." checked={privacy.email} onChange={() => setPrivacy({ ...privacy, email: !privacy.email })} /><Toggle label="Phone number" description="Hidden by default." checked={privacy.phone} onChange={() => setPrivacy({ ...privacy, phone: !privacy.phone })} /><Toggle label="Major and graduation year" description="Helps peers find people on similar paths." checked={privacy.academic} onChange={() => setPrivacy({ ...privacy, academic: !privacy.academic })} /><Toggle label="LinkedIn" description="Optional professional profile link." checked={privacy.linkedin} onChange={() => setPrivacy({ ...privacy, linkedin: !privacy.linkedin })} /></div><div className="mt-7 border-t border-[#e7ebf3] pt-7"><h3 className="text-base font-semibold">Notifications</h3><p className="mt-1 text-sm text-[#748097]">You can update these anytime from Profile.</p><Toggle label="Community requests" description="Approvals, declines, and request updates." checked={alerts.requests} onChange={() => setAlerts({ ...alerts, requests: !alerts.requests })} /><Toggle label="Updates and events" description="Posts from communities you are approved to join." checked={alerts.updates} onChange={() => setAlerts({ ...alerts, updates: !alerts.updates })} /><Toggle label="Message requests and DMs" description="Private messages require your acceptance first." checked={alerts.messages} onChange={() => setAlerts({ ...alerts, messages: !alerts.messages })} /></div><button onClick={() => setFinished(true)} className="mt-8 rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white">Finish setup</button>{finished && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#287454]"><BadgeCheck className="h-4 w-4" />Profile saved. You can now explore official USC communities.</p>}</div>}
      </section>
    </section>
    <footer className="px-5 pb-8 text-center text-xs text-[#8a95a8]">Campus Connect is an independent student platform and is not affiliated with USC.</footer>
  </main>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return <label className="mt-5 flex cursor-pointer items-center justify-between gap-5"><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-sm text-[#748097]">{description}</span></span><input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-10 accent-[#7667e8]" /></label>;
}
