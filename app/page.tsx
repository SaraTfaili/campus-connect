"use client";

import {
  BadgeCheck,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Visibility = "email" | "phone" | "academic" | "linkedin";
type Community = {
  id: string;
  name: string;
  description: string;
  category: string;
};
const steps = [
  "Verify USC email",
  "Build your profile",
  "Choose privacy settings",
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [privacy, setPrivacy] = useState<Record<Visibility, boolean>>({
    email: true,
    phone: false,
    academic: true,
    linkedin: true,
  });
  const [alerts, setAlerts] = useState({
    requests: true,
    updates: true,
    messages: true,
  });
  const [finished, setFinished] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [showCommunities, setShowCommunities] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<
    Record<string, string>
  >({});
  const [communityNotice, setCommunityNotice] = useState("");
  const [insideMena, setInsideMena] = useState(false);
  const [communityTab, setCommunityTab] = useState<
    "updates" | "people" | "messages"
  >("updates");
  const [demoMessage, setDemoMessage] = useState("");
  const [demoMessages, setDemoMessages] = useState([
    {
      sender: "Maya Hassan",
      text: "Welcome everyone! Excited to build this community together.",
    },
    {
      sender: "Omar Khalil",
      text: "Does anyone want to meet before the cultural social?",
    },
  ]);
  const [directMessageTo, setDirectMessageTo] = useState<string | null>(null);
  const [demoDirectMessages, setDemoDirectMessages] = useState<
    Record<string, { sender: string; text: string }[]>
  >({
    "Maya Hassan": [
      {
        sender: "Maya Hassan",
        text: "Hi! I saw you were interested in the cultural social — happy to help.",
      },
    ],
    "Omar Khalil": [
      { sender: "Omar Khalil", text: "See you at the next event!" },
    ],
  });
  const [recentContacts, setRecentContacts] = useState<string[]>([
    "Maya Hassan",
    "Omar Khalil",
  ]);
  const [showMessageRequests, setShowMessageRequests] = useState(false);
  const [messageRequests, setMessageRequests] = useState([
    { name: "Leila Nasser", preview: "Hi! I saw we are both in MENA." },
  ]);
  const [showBoardDashboard, setShowBoardDashboard] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([
    { name: "Noor Rahman", major: "International Relations", year: "2028" },
    { name: "Daniel Haddad", major: "Business Administration", year: "2027" },
  ]);
  const [boardNotice, setBoardNotice] = useState("");
  const [newUpdate, setNewUpdate] = useState("");
  const [boardUpdates, setBoardUpdates] = useState<string[]>([]);
  const [approvedDemoMembers, setApprovedDemoMembers] = useState<
    { name: string; major: string; year: string }[]
  >([]);
  const temporaryTestEmail = "sara.tfaili@gmail.com";
  const normalizedEmail = email.trim().toLowerCase();
  const emailIsUSC = normalizedEmail.endsWith("@usc.edu");
  const emailIsAllowed = emailIsUSC || normalizedEmail === temporaryTestEmail;
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key
      ? createClient(url, key, { auth: { flowType: "implicit" } })
      : null;
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const useSession = (
      session: { user: { id: string; email?: string | null } } | null,
    ) => {
      const verifiedEmail = session?.user.email?.toLowerCase();
      if (
        !session ||
        (!verifiedEmail?.endsWith("@usc.edu") &&
          verifiedEmail !== temporaryTestEmail)
      )
        return;
      setAuthUserId(session.user.id);
      setEmail(verifiedEmail);
      setStep((currentStep) => Math.max(currentStep, 2));
      setAuthNotice("");
      setShowCommunities(true);
    };
    supabase.auth.getSession().then(({ data }) => useSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => useSession(session),
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !authUserId) return;
    const loadCommunities = async () => {
      const [{ data: communityRows }, { data: memberRows }] = await Promise.all(
        [
          supabase
            .from("communities")
            .select("id,name,description,category")
            .eq("slug", "mena-at-usc"),
          supabase
            .from("community_members")
            .select("community_id,status")
            .eq("user_id", authUserId),
        ],
      );
      setCommunities((communityRows ?? []) as Community[]);
      setMembershipStatus(
        Object.fromEntries(
          (memberRows ?? []).map((row) => [row.community_id, row.status]),
        ),
      );
    };
    loadCommunities();
  }, [supabase, authUserId]);

  const requestToJoin = async (communityId: string) => {
    if (!supabase || !authUserId) {
      setCommunityNotice(
        "Demo preview only. Verify your USC email to send a real join request.",
      );
      return;
    }
    setCommunityNotice("");
    const { error } = await supabase.from("community_members").insert({
      community_id: communityId,
      user_id: authUserId,
      role: "member",
      status: "pending",
    });
    if (error) {
      setCommunityNotice(
        error.code === "23505"
          ? "You already have a request for this community."
          : error.message,
      );
      return;
    }
    setMembershipStatus({ ...membershipStatus, [communityId]: "pending" });
    setCommunityNotice(
      "Request sent. The MENA board will review it before you can access the community.",
    );
  };

  const enterDemoPreview = () => {
    setDemoMode(true);
    setCommunities([
      {
        id: "demo-mena",
        name: "MENA at USC",
        description:
          "A home for USC students connected to Middle Eastern and North African cultures.",
        category: "Cultural community",
      },
    ]);
    setShowCommunities(true);
  };
  const sendDemoMessage = () => {
    const message = demoMessage.trim();
    if (!message) return;
    if (directMessageTo) {
      setDemoDirectMessages({
        ...demoDirectMessages,
        [directMessageTo]: [
          ...(demoDirectMessages[directMessageTo] ?? []),
          { sender: "You", text: message },
        ],
      });
      setRecentContacts([
        directMessageTo,
        ...recentContacts.filter((person) => person !== directMessageTo),
      ]);
    } else setDemoMessages([...demoMessages, { sender: "You", text: message }]);
    setDemoMessage("");
  };

  const openDirectMessage = (person: string) => {
    setDirectMessageTo(person);
    setDemoMessage("");
    setCommunityTab("messages");
  };
  const acceptMessageRequest = (person: string) => {
    const request = messageRequests.find((item) => item.name === person);
    setMessageRequests(
      messageRequests.filter((request) => request.name !== person),
    );
    setRecentContacts([
      person,
      ...recentContacts.filter((contact) => contact !== person),
    ]);
    if (request)
      setDemoDirectMessages({
        ...demoDirectMessages,
        [person]: [{ sender: person, text: request.preview }],
      });
    setDirectMessageTo(person);
  };
  const reviewDemoRequest = (
    name: string,
    decision: "approved" | "declined",
  ) => {
    const request = pendingRequests.find((item) => item.name === name);
    setPendingRequests(
      pendingRequests.filter((request) => request.name !== name),
    );
    if (decision === "approved" && request)
      setApprovedDemoMembers([...approvedDemoMembers, request]);
    setBoardNotice(`${name} was ${decision}.`);
  };
  const publishDemoUpdate = () => {
    if (!newUpdate.trim()) return;
    setBoardUpdates([newUpdate.trim(), ...boardUpdates]);
    setNewUpdate("");
    setBoardNotice("Update published to MENA.");
  };
  const visibleDemoPeople = [
    { name: "Maya Hassan", major: "Computer Science", year: "2027" },
    { name: "Omar Khalil", major: "Business", year: "2026" },
    { name: "Leila Nasser", major: "Political Science", year: "2028" },
    ...approvedDemoMembers,
  ];
  const getConversationPreview = (person: string) => {
    const latest =
      demoDirectMessages[person]?.[demoDirectMessages[person].length - 1];
    return latest
      ? `${latest.sender === "You" ? "You" : person}: ${latest.text}`
      : "Start a conversation";
  };

  if (showCommunities && (authUserId || demoMode))
    return (
      <main className="min-h-screen bg-[#f7f8fc] text-[#15213b]">
        <header className="border-b border-[#e3e7f0] bg-white px-5 py-4 sm:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3 font-bold tracking-tight">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7667e8] text-white">
                C
              </span>
              Campus Connect
            </div>
            <span className="text-sm font-medium text-[#748097]">
              Communities · USC {demoMode && "· Demo preview"}
            </span>
          </div>
        </header>
        {insideMena ? (
          <section className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
            <button
              onClick={() => setInsideMena(false)}
              className="text-sm font-semibold text-[#6255c9]"
            >
              ← Back to communities
            </button>
            <div className="mt-5 rounded-3xl bg-[#1f3260] p-8 text-white">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                Official USC community
              </span>
              <h1 className="mt-5 text-4xl font-semibold">MENA at USC</h1>
              <p className="mt-3 max-w-2xl text-[#d7dff8]">
                Connect, celebrate culture, and find opportunities with the
                Middle Eastern and North African community at USC.
              </p>
            </div>
            {demoMode && (
              <button
                onClick={() => setShowBoardDashboard(!showBoardDashboard)}
                className="mt-5 rounded-xl bg-[#7667e8] px-4 py-3 text-sm font-semibold text-white"
              >
                {showBoardDashboard
                  ? "Back to MENA community"
                  : "Open board dashboard"}
              </button>
            )}
            {showBoardDashboard ? (
              <section className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-[#6255c9]">
                      MENA board
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Membership requests
                    </h2>
                    <p className="mt-2 text-sm text-[#68758d]">
                      Review official club members before they unlock the MENA
                      directory and messaging.
                    </p>
                    <div className="mt-5 space-y-3">
                      {pendingRequests.length ? (
                        pendingRequests.map((request) => (
                          <div
                            key={request.name}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e3e7f0] p-4"
                          >
                            <div>
                              <p className="font-semibold">{request.name}</p>
                              <p className="mt-1 text-sm text-[#748097]">
                                {request.major} · {request.year}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  reviewDemoRequest(request.name, "declined")
                                }
                                className="rounded-lg border border-[#d7ddea] px-3 py-2 text-sm font-semibold text-[#68758d]"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() =>
                                  reviewDemoRequest(request.name, "approved")
                                }
                                className="rounded-lg bg-[#7667e8] px-3 py-2 text-sm font-semibold text-white"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl bg-[#f7f8fc] p-4 text-sm text-[#68758d]">
                          No pending requests right now.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold">Post an update</h2>
                    <textarea
                      value={newUpdate}
                      onChange={(event) => setNewUpdate(event.target.value)}
                      placeholder="Share an event, opportunity, or announcement…"
                      className="mt-4 min-h-28 w-full rounded-xl border border-[#d7ddea] p-4 outline-none focus:ring-2 focus:ring-[#7667e8]"
                    />
                    <button
                      onClick={publishDemoUpdate}
                      className="mt-3 rounded-xl bg-[#1f3260] px-4 py-3 text-sm font-semibold text-white"
                    >
                      Publish update
                    </button>
                    {boardUpdates.map((update, index) => (
                      <p
                        key={index}
                        className="mt-4 rounded-xl bg-[#eef0ff] p-4 text-sm text-[#34456d]"
                      >
                        {update}
                      </p>
                    ))}
                  </div>
                </div>
                <aside className="h-fit rounded-2xl border border-[#e3e7f0] bg-white p-6">
                  <h2 className="text-xl font-semibold">Community overview</h2>
                  <div className="mt-5 space-y-4 text-sm">
                    <p>
                      <span className="font-semibold">Active members</span>
                      <br />
                      <span className="text-[#748097]">24 approved</span>
                    </p>
                    <p>
                      <span className="font-semibold">Board admins</span>
                      <br />
                      <span className="text-[#748097]">
                        Maya Hassan · Omar Khalil
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Private messages</span>
                      <br />
                      <span className="text-[#748097]">
                        Not visible to board admins
                      </span>
                    </p>
                  </div>
                  {boardNotice && (
                    <p className="mt-5 rounded-xl bg-[#edf9f3] p-3 text-sm font-medium text-[#287454]">
                      {boardNotice}
                    </p>
                  )}
                </aside>
              </section>
            ) : (
              <>
                <div className="mt-7 flex gap-3 border-b border-[#dfe4ee]">
                  {(["updates", "people", "messages"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCommunityTab(tab)}
                      className={
                        "border-b-2 px-4 py-3 text-sm font-semibold capitalize " +
                        (communityTab === tab
                          ? "border-[#7667e8] text-[#6255c9]"
                          : "border-transparent text-[#748097]")
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {communityTab === "updates" && (
                  <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-4">
                      <article className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm font-semibold text-[#6255c9]">
                          MENA Board · Today
                        </p>
                        <h2 className="mt-3 text-xl font-semibold">
                          Welcome to the MENA community
                        </h2>
                        <p className="mt-2 leading-7 text-[#68758d]">
                          Our first member gathering is coming soon. Updates,
                          events, and opportunities will live here.
                        </p>
                      </article>
                      {boardUpdates.map((update, index) => (
                        <article
                          key={index}
                          className="rounded-2xl bg-white p-6 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-[#6255c9]">
                            MENA Board · New update
                          </p>
                          <p className="mt-3 leading-7 text-[#34456d]">
                            {update}
                          </p>
                        </article>
                      ))}
                      <article className="rounded-2xl bg-white p-6 shadow-sm">
                        <p className="text-sm font-semibold text-[#6255c9]">
                          Opportunity
                        </p>
                        <h2 className="mt-3 text-xl font-semibold">
                          Alumni mentorship sign-ups
                        </h2>
                        <p className="mt-2 leading-7 text-[#68758d]">
                          Meet USC MENA alumni working across technology,
                          consulting, healthcare, and more.
                        </p>
                      </article>
                    </div>
                    <aside className="rounded-2xl border border-[#e3e7f0] bg-white p-5">
                      <h3 className="font-semibold">Coming up</h3>
                      <p className="mt-3 text-sm text-[#68758d]">
                        Board meeting · October 8
                      </p>
                      <p className="mt-2 text-sm text-[#68758d]">
                        Cultural social · October 17
                      </p>
                    </aside>
                  </div>
                )}
                {communityTab === "people" && (
                  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleDemoPeople.map((person) => (
                      <article
                        key={person.name}
                        className="rounded-2xl bg-white p-5 shadow-sm"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef0ff] font-bold text-[#6255c9]">
                          {person.name[0]}
                        </span>
                        <h2 className="mt-4 font-semibold">{person.name}</h2>
                        <p className="mt-1 text-sm text-[#748097]">
                          {person.major} · {person.year}
                        </p>
                        <button
                          onClick={() => openDirectMessage(person.name)}
                          className="mt-4 text-sm font-semibold text-[#6255c9]"
                        >
                          Message
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                {communityTab === "messages" && (
                  <div className="mt-7 grid overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-[230px_1fr]">
                    <aside className="border-b border-[#e7ebf3] p-4 md:border-b-0 md:border-r">
                      <h2 className="px-2 text-xl font-semibold">Messages</h2>
                      <button
                        onClick={() =>
                          setShowMessageRequests(!showMessageRequests)
                        }
                        className="mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#6255c9] hover:bg-[#f7f8fc]"
                      >
                        <span>Message requests</span>
                        <span className="rounded-full bg-[#7667e8] px-2 py-0.5 text-xs text-white">
                          {messageRequests.length}
                        </span>
                      </button>
                      {showMessageRequests && (
                        <div className="mt-2 rounded-xl bg-[#f7f8fc] p-3">
                          {messageRequests.length ? (
                            messageRequests.map((request) => (
                              <div key={request.name}>
                                <p className="text-sm font-semibold">
                                  {request.name}
                                </p>
                                <p className="mt-1 text-xs text-[#748097]">
                                  {request.preview}
                                </p>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() =>
                                      setMessageRequests(
                                        messageRequests.filter(
                                          (item) => item.name !== request.name,
                                        ),
                                      )
                                    }
                                    className="rounded-lg border border-[#d7ddea] px-3 py-1.5 text-xs font-semibold text-[#68758d]"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() =>
                                      acceptMessageRequest(request.name)
                                    }
                                    className="rounded-lg bg-[#7667e8] px-3 py-1.5 text-xs font-semibold text-white"
                                  >
                                    Accept
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[#748097]">
                              No message requests.
                            </p>
                          )}
                        </div>
                      )}
                      <div className="mt-4 space-y-1">
                        <button
                          onClick={() => setDirectMessageTo(null)}
                          className={
                            "flex w-full items-center gap-3 rounded-xl p-3 text-left " +
                            (!directMessageTo
                              ? "bg-[#eef0ff]"
                              : "hover:bg-[#f7f8fc]")
                          }
                        >
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1f3260] text-sm font-bold text-white">
                            M
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                              MENA group chat
                            </span>
                            <span className="block truncate text-xs text-[#748097]">
                              Omar: Does anyone want to meet…
                            </span>
                          </span>
                        </button>
                        {recentContacts.map((person) => (
                          <button
                            key={person}
                            onClick={() => openDirectMessage(person)}
                            className={
                              "flex w-full items-center gap-3 rounded-xl p-3 text-left " +
                              (directMessageTo === person
                                ? "bg-[#eef0ff]"
                                : "hover:bg-[#f7f8fc]")
                            }
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f2efff] text-sm font-bold text-[#6255c9]">
                              {person[0]}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">
                                {person}
                              </span>
                              <span className="block truncate text-xs text-[#748097]">
                                {getConversationPreview(person)}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </aside>
                    <section className="p-5 sm:p-6">
                      <div>
                        <h2 className="text-xl font-semibold">
                          {directMessageTo
                            ? directMessageTo
                            : "MENA group chat"}
                        </h2>
                        <p className="mt-2 text-sm text-[#68758d]">
                          {directMessageTo
                            ? "Private MENA conversation · Demo preview"
                            : "Approved members can chat here · Demo preview"}
                        </p>
                      </div>
                      <div className="mt-6 space-y-4 rounded-xl bg-[#f7f8fc] p-4">
                        {(directMessageTo
                          ? (demoDirectMessages[directMessageTo] ?? [])
                          : demoMessages
                        ).map((message, index) => (
                          <div
                            key={index}
                            className={
                              message.sender === "You"
                                ? "ml-10 rounded-2xl bg-[#7667e8] p-3 text-sm text-white"
                                : "mr-10 rounded-2xl bg-white p-3 text-sm text-[#34456d] shadow-sm"
                            }
                          >
                            <p
                              className={
                                message.sender === "You"
                                  ? "text-xs font-bold text-[#e8e5ff]"
                                  : "text-xs font-bold text-[#6255c9]"
                              }
                            >
                              {message.sender}
                            </p>
                            <p className="mt-1">{message.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <input
                          value={demoMessage}
                          onChange={(event) =>
                            setDemoMessage(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") sendDemoMessage();
                          }}
                          placeholder={
                            directMessageTo
                              ? `Message ${directMessageTo}…`
                              : "Write a message…"
                          }
                          className="min-w-0 flex-1 rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]"
                        />
                        <button
                          onClick={sendDemoMessage}
                          className="rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white"
                        >
                          Send
                        </button>
                      </div>
                    </section>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <section className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#6255c9]">
                Your communities
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Find your USC people.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#68758d]">
                Start with official USC clubs. Request access first; the board
                approves members before private updates, people, and messaging
                become available.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {communities.map((community) => {
                const status = membershipStatus[community.id];
                return (
                  <article
                    key={community.id}
                    className="rounded-3xl border border-[#e3e7f0] bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#6255c9]">
                          {community.category}
                        </span>
                        <h2 className="mt-5 text-2xl font-semibold">
                          {community.name}
                        </h2>
                      </div>
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1f3260] text-lg font-bold text-white">
                        M
                      </span>
                    </div>
                    <p className="mt-4 leading-7 text-[#68758d]">
                      {community.description}
                    </p>
                    <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#e7ebf3] pt-5">
                      <span className="text-sm text-[#748097]">
                        {status === "approved"
                          ? "Member access approved"
                          : status === "pending"
                            ? "Request pending review"
                            : "Official USC community"}
                      </span>
                      {demoMode || status === "approved" ? (
                        <button
                          onClick={() => setInsideMena(true)}
                          className="rounded-xl bg-[#1f3260] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Open community
                        </button>
                      ) : status === "pending" ? (
                        <span className="rounded-xl bg-[#fff7e8] px-4 py-2 text-sm font-semibold text-[#986b17]">
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => requestToJoin(community.id)}
                          className="rounded-xl bg-[#7667e8] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Request to join
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {communities.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-[#cfd6e4] bg-white p-8 text-center text-[#68758d]">
                The MENA community is being prepared. Check back soon.
              </div>
            )}
            {communityNotice && (
              <p className="mt-5 rounded-xl bg-[#eef0ff] px-4 py-3 text-sm font-medium text-[#6255c9]">
                {communityNotice}
              </p>
            )}
          </section>
        )}
      </main>
    );

  const sendVerification = async () => {
    if (!emailIsAllowed) return;
    if (!supabase) {
      setAuthNotice(
        "Add your Supabase URL and anonymous key to activate USC email verification.",
      );
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    setAuthNotice(
      error
        ? error.message
        : "Verification link sent. Check your USC inbox and open the link to return here.",
    );
  };

  const saveProfile = async () => {
    if (!supabase || !authUserId) {
      setProfileNotice(
        "Please verify your USC email before saving your profile.",
      );
      return;
    }
    setSavingProfile(true);
    setProfileNotice("");
    const { error } = await supabase.from("profiles").upsert(
      {
        id: authUserId,
        usc_email: email.trim().toLowerCase(),
        full_name: name.trim(),
        major: major.trim(),
        graduation_year: Number(year),
        show_usc_email: privacy.email,
        show_phone: privacy.phone,
        show_academic_details: privacy.academic,
        show_linkedin: privacy.linkedin,
        notify_membership_requests: alerts.requests,
        notify_updates_events: alerts.updates,
        notify_messages: alerts.messages,
      },
      { onConflict: "id" },
    );
    setSavingProfile(false);
    if (error) {
      setProfileNotice(error.message);
      return;
    }
    setFinished(true);
    setShowCommunities(true);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#15213b]">
      <header className="border-b border-[#e3e7f0] bg-white px-5 py-4 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3 font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7667e8] text-white">
              C
            </span>
            Campus Connect
          </div>
          <span className="text-sm font-medium text-[#748097]">USC pilot</span>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[280px_1fr] lg:px-10">
        <aside className="rounded-3xl bg-[#1f3260] p-7 text-white">
          <p className="text-sm font-semibold text-[#c9d4ff]">Student setup</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Join trusted USC communities.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#d7dff8]">
            Your USC email verifies your student identity before you request
            access to an official club.
          </p>
          <ol className="mt-10 space-y-5 text-sm">
            {steps.map((label, index) => {
              const number = index + 1;
              const dot =
                step === number
                  ? "grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-bold text-[#1f3260]"
                  : step > number
                    ? "grid h-7 w-7 place-items-center rounded-full bg-[#7667e8] text-xs font-bold text-white"
                    : "grid h-7 w-7 place-items-center rounded-full bg-[#334878] text-xs font-bold text-[#c9d4ff]";
              return (
                <li className="flex items-center gap-3" key={label}>
                  <span className={dot}>{step > number ? "✓" : number}</span>
                  <span
                    className={
                      step === number ? "font-semibold" : "text-[#c9d4ff]"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>
        <section className="rounded-3xl border border-[#e3e7f0] bg-white p-7 shadow-sm sm:p-10">
          {step === 1 && (
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#6255c9]">
                <ShieldCheck className="h-4 w-4" />
                USC only
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                Verify your USC email
              </h2>
              <p className="mt-3 leading-7 text-[#68758d]">
                Use your <strong>@usc.edu</strong> address. You will receive a
                confirmation link before your account becomes active.
              </p>
              <label className="mt-8 block text-sm font-semibold">
                USC email address
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@usc.edu"
                  className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 text-base outline-none ring-[#7667e8] transition focus:ring-2"
                />
              </label>
              {email && !emailIsAllowed && (
                <p className="mt-2 text-sm text-[#b34d62]">
                  Please enter a valid USC email ending in @usc.edu.
                </p>
              )}
              <button
                onClick={sendVerification}
                disabled={!emailIsAllowed || sending}
                className="mt-7 rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6658d7] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sending ? "Sending..." : "Send verification link"}
              </button>
              {authNotice && (
                <p className="mt-3 text-sm text-[#6255c9]">{authNotice}</p>
              )}
              <button
                onClick={enterDemoPreview}
                className="mt-5 rounded-xl border border-[#cfd6e4] px-5 py-3 text-sm font-semibold text-[#34456d]"
              >
                Preview MENA without signing in
              </button>
              <p className="mt-3 text-xs leading-5 text-[#8a95a8]">
                Demo preview only. USC verification is still required for real
                accounts and join requests.
              </p>
              <p className="mt-5 flex gap-2 text-sm text-[#768299]">
                <LockKeyhole className="mt-0.5 h-4 w-4" />
                Your email is only visible to members if you choose to share it.
              </p>
            </div>
          )}
          {step === 2 && (
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#edf9f3] px-3 py-1 text-xs font-bold text-[#287454]">
                <BadgeCheck className="h-4 w-4" />
                USC email verified
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                Build your profile
              </h2>
              <p className="mt-3 leading-7 text-[#68758d]">
                These details help approved club members understand who they are
                connecting with.
              </p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Full name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Major
                  <input
                    value={major}
                    onChange={(event) => setMajor(event.target.value)}
                    placeholder="Computer Science"
                    className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Graduation year
                  <input
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    placeholder="2027"
                    className="mt-2 block w-full rounded-xl border border-[#d7ddea] px-4 py-3 outline-none focus:ring-2 focus:ring-[#7667e8]"
                  />
                </label>
              </div>
              <button
                disabled={!name || !major || !year}
                onClick={() => setStep(3)}
                className="mt-7 rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continue
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#6255c9]">
                <GraduationCap className="h-4 w-4" />
                Your settings
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                Control your visibility
              </h2>
              <p className="mt-3 leading-7 text-[#68758d]">
                Only approved members in a shared community can see the details
                you choose to share.
              </p>
              <div className="mt-8 border-t border-[#e7ebf3] pt-7">
                <h3 className="text-base font-semibold">
                  Directory information
                </h3>
                <Toggle
                  label="USC email"
                  description="Lets members contact you professionally."
                  checked={privacy.email}
                  onChange={() =>
                    setPrivacy({ ...privacy, email: !privacy.email })
                  }
                />
                <Toggle
                  label="Phone number"
                  description="Hidden by default."
                  checked={privacy.phone}
                  onChange={() =>
                    setPrivacy({ ...privacy, phone: !privacy.phone })
                  }
                />
                <Toggle
                  label="Major and graduation year"
                  description="Helps peers find people on similar paths."
                  checked={privacy.academic}
                  onChange={() =>
                    setPrivacy({ ...privacy, academic: !privacy.academic })
                  }
                />
                <Toggle
                  label="LinkedIn"
                  description="Optional professional profile link."
                  checked={privacy.linkedin}
                  onChange={() =>
                    setPrivacy({ ...privacy, linkedin: !privacy.linkedin })
                  }
                />
              </div>
              <div className="mt-7 border-t border-[#e7ebf3] pt-7">
                <h3 className="text-base font-semibold">Notifications</h3>
                <p className="mt-1 text-sm text-[#748097]">
                  You can update these anytime from Profile.
                </p>
                <Toggle
                  label="Community requests"
                  description="Approvals, declines, and request updates."
                  checked={alerts.requests}
                  onChange={() =>
                    setAlerts({ ...alerts, requests: !alerts.requests })
                  }
                />
                <Toggle
                  label="Updates and events"
                  description="Posts from communities you are approved to join."
                  checked={alerts.updates}
                  onChange={() =>
                    setAlerts({ ...alerts, updates: !alerts.updates })
                  }
                />
                <Toggle
                  label="Message requests and DMs"
                  description="Private messages require your acceptance first."
                  checked={alerts.messages}
                  onChange={() =>
                    setAlerts({ ...alerts, messages: !alerts.messages })
                  }
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="mt-8 rounded-xl bg-[#7667e8] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Finish setup"}
              </button>
              {profileNotice && (
                <p className="mt-4 text-sm font-medium text-[#b34d62]">
                  {profileNotice}
                </p>
              )}
              {finished && (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#287454]">
                  <BadgeCheck className="h-4 w-4" />
                  Profile saved. You can now explore official USC communities.
                </p>
              )}
            </div>
          )}
        </section>
      </section>
      <footer className="px-5 pb-8 text-center text-xs text-[#8a95a8]">
        Campus Connect is an independent student platform and is not affiliated
        with USC.
      </footer>
    </main>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="mt-5 flex cursor-pointer items-center justify-between gap-5">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-sm text-[#748097]">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-10 accent-[#7667e8]"
      />
    </label>
  );
}
