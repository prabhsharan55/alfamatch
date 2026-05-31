import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/auth";
import type { InquiryStatus } from "@/lib/database.types";

type EscrowStatus = "pending" | "held" | "released" | "refunded" | "disputed";

type EscrowPayment = {
  id: string;
  amount_inr: number;
  platform_fee_inr: number;
  status: EscrowStatus;
  brand_paid_at: string | null;
  released_at: string | null;
  disputed_at: string | null;
};

export const Route = createFileRoute("/inbox")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login", search: { redirect: "/inbox" } });
  },
  loader: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { threads: [] };

    // Use the active role to decide which inbox to show (respects dual-role switching)
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    const activeRole = (profileRow as { role: string } | null)?.role ?? "creator";
    const isBrand = activeRole === "brand";

    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id, display_name, slug")
      .eq("user_id", session.user.id)
      .maybeSingle();

    let inquiryIds: string[] = [];

    if (isBrand && brandProfile) {
      const { data } = await supabase
        .from("inquiries")
        .select("id")
        .eq("brand_id", brandProfile.id);
      inquiryIds = (data ?? []).map((r) => r.id);
    } else if (!isBrand && creatorProfile) {
      const { data } = await supabase
        .from("inquiries")
        .select("id")
        .eq("creator_id", creatorProfile.id);
      inquiryIds = (data ?? []).map((r) => r.id);
    }

    if (!inquiryIds.length) return { threads: [], isBrand };

    const { data: threads } = await supabase
      .from("message_threads")
      .select(`
        id, created_at, inquiry_id,
        inquiries(
          id, status, offer_inr, created_at,
          brand_profiles(company_name, city),
          creator_profiles(slug, display_name, avatar_url, categories)
        ),
        messages(id, body, sent_at, sender_user_id)
      `)
      .in("inquiry_id", inquiryIds)
      .order("created_at", { ascending: false })
      .order("sent_at", { referencedTable: "messages", ascending: true });

    // Load escrow payments for all inquiry IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: escrows } = await (supabase as any)
      .from("escrow_payments")
      .select("id, inquiry_id, amount_inr, platform_fee_inr, status, brand_paid_at, released_at, disputed_at")
      .in("inquiry_id", inquiryIds);

    const escrowByInquiry: Record<string, EscrowPayment> = {};
    for (const e of (escrows ?? []) as unknown as (EscrowPayment & { inquiry_id: string })[]) {
      escrowByInquiry[e.inquiry_id] = e;
    }

    return { threads: threads ?? [], isBrand, escrowByInquiry };
  },
  component: InboxPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Thread = {
  id: string;
  inquiry_id: string;
  created_at: string;
  inquiries: {
    id: string; status: string; offer_inr: number | null; created_at: string;
    brand_profiles: { company_name: string; city: string | null } | null;
    creator_profiles: { slug: string; display_name: string; avatar_url: string | null; categories: string[] | null } | null;
  } | null;
  messages: { id: string; body: string; sent_at: string; sender_user_id: string | null }[];
};

const STATUS_COLORS: Record<string, string> = {
  new:          "bg-primary text-primary-foreground",
  replied:      "bg-blue-500/20 text-blue-300",
  negotiating:  "bg-amber-500/20 text-amber-300",
  accepted:     "bg-emerald-500/20 text-emerald-300",
  declined:     "bg-red-500/20 text-red-400",
  completed:    "bg-muted text-muted-foreground",
};

// ── Component ─────────────────────────────────────────────────────────────────

function InboxPage() {
  const { threads, isBrand, escrowByInquiry } = Route.useLoaderData() as {
    threads: Thread[];
    isBrand: boolean;
    escrowByInquiry: Record<string, EscrowPayment>;
  };
  const [activeId, setActiveId]   = useState<string | null>(threads[0]?.id ?? null);
  const [escrows, setEscrows]     = useState<Record<string, EscrowPayment>>(escrowByInquiry ?? {});
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");
  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  function selectThread(id: string) {
    setActiveId(id);
    setMobilePane("thread");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-bold text-base tracking-tight">{BRAND.name}</Link>
            <span className="text-sm text-foreground/50 hidden sm:block">Inbox</span>
          </div>
          <Link
            to={isBrand ? "/dashboard/brand" : "/dashboard/creator"}
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {threads.length === 0 ? (
        <EmptyInbox isBrand={isBrand} />
      ) : (
        <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
          {/* Thread list — full width on mobile when pane=list, hidden when pane=thread */}
          <aside className={`${mobilePane === "thread" ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 shrink-0 border-r border-border overflow-y-auto`}>
            {threads.map((t) => {
              const inq = t.inquiries;
              const label = isBrand
                ? inq?.creator_profiles?.display_name ?? "Creator"
                : inq?.brand_profiles?.company_name ?? "Brand";
              const lastMsg = t.messages.at(-1);
              const isActive = t.id === activeId;

              return (
                <button
                  key={t.id}
                  onClick={() => selectThread(t.id)}
                  className={`w-full text-left px-5 py-4 border-b border-border transition-colors
                    ${isActive ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/40"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0 ${STATUS_COLORS[inq?.status ?? "new"]}`}>
                      {inq?.status ?? "new"}
                    </span>
                  </div>
                  {inq?.offer_inr && (
                    <p className="text-xs text-primary font-mono mb-1">₹{inq.offer_inr.toLocaleString("en-IN")}</p>
                  )}
                  {lastMsg && (
                    <p className="text-xs text-muted-foreground truncate">{lastMsg.body}</p>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Thread detail — full width on mobile when pane=thread, hidden when pane=list */}
          <main className={`${mobilePane === "list" ? "hidden" : "flex"} lg:flex flex-1 flex-col min-w-0`}>
            {activeThread
              ? (
                <ThreadView
                  key={activeThread.id}
                  thread={activeThread}
                  isBrand={isBrand}
                  escrow={activeThread.inquiries ? escrows[activeThread.inquiries.id] : undefined}
                  onEscrowUpdate={(updated) =>
                    setEscrows((prev) => ({ ...prev, [activeThread.inquiries!.id]: updated }))
                  }
                  onBack={() => setMobilePane("list")}
                />
              )
              : <div className="flex-1 grid place-items-center text-muted-foreground text-sm">Select a conversation</div>
            }
          </main>
        </div>
      )}
    </div>
  );
}

// ── Thread View ───────────────────────────────────────────────────────────────

function ThreadView({
  thread,
  isBrand,
  escrow,
  onEscrowUpdate,
  onBack,
}: {
  thread: Thread;
  isBrand: boolean;
  escrow?: EscrowPayment;
  onEscrowUpdate: (e: EscrowPayment) => void;
  onBack?: () => void;
}) {
  const { session } = useAuth();
  const [body,         setBody]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [messages,     setMessages]     = useState(thread.messages);
  const [status,       setStatus]       = useState<InquiryStatus>((thread.inquiries?.status ?? "new") as InquiryStatus);
  const [suggesting,   setSuggesting]   = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const inq   = thread.inquiries;
  const other = isBrand
    ? inq?.creator_profiles?.display_name ?? "Creator"
    : inq?.brand_profiles?.company_name ?? "Brand";

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function suggestReply() {
    setSuggesting(true);
    try {
      const { data } = await supabase.functions.invoke("suggest-reply", {
        body: {
          isBrand,
          status,
          otherName: other,
          offerInr: inq?.offer_inr,
          messages: messages.map((m) => ({
            body: m.body,
            isMine: m.sender_user_id === session?.user.id,
          })),
        },
      });
      if (data?.reply) setBody(data.reply);
    } finally {
      setSuggesting(false);
    }
  }

  async function updateStatus(newStatus: InquiryStatus) {
    if (!inq) return;
    await supabase.from("inquiries").update({ status: newStatus }).eq("id", inq.id);
    setStatus(newStatus);
  }

  async function releaseEscrow() {
    if (!escrow || !inq) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("escrow_payments")
      .update({ status: "released", released_at: new Date().toISOString() })
      .eq("id", escrow.id)
      .select()
      .single();
    if (!error && data) onEscrowUpdate(data as EscrowPayment);
  }

  async function disputeEscrow(reason: string) {
    if (!escrow || !inq) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("escrow_payments")
      .update({ status: "disputed", disputed_at: new Date().toISOString(), dispute_reason: reason })
      .eq("id", escrow.id)
      .select()
      .single();
    if (!error && data) onEscrowUpdate(data as EscrowPayment);
  }

  async function sendReply(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!body.trim() || !session) return;
    setSending(true);

    const { data: msg } = await supabase
      .from("messages")
      .insert({ thread_id: thread.id, sender_user_id: session.user.id, body: body.trim() })
      .select("id, body, sent_at, sender_user_id")
      .single();

    if (msg) setMessages((prev) => [...prev, msg]);

    // Advance status: new → replied
    if (status === "new") await updateStatus("replied");

    setBody("");
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="lg:hidden shrink-0 size-8 grid place-items-center rounded hover:bg-muted transition-colors text-foreground/60" aria-label="Back">
              ←
            </button>
          )}
          <div className="min-w-0">
          <h2 className="font-semibold truncate">{other}</h2>
          {inq?.offer_inr && (
            <p className="text-xs text-primary font-mono">₹{inq.offer_inr.toLocaleString("en-IN")}</p>
          )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className={`text-[10px] font-mono px-2 py-1 rounded uppercase ${STATUS_COLORS[status]}`}>
            {status}
          </span>

          {/* Creator actions — accept or decline */}
          {!isBrand && (status === "new" || status === "replied" || status === "negotiating") && (
            <>
              <button
                onClick={() => updateStatus("accepted")}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => updateStatus("declined")}
                className="px-3 py-1.5 text-xs font-bold border border-red-500/50 text-red-400 rounded hover:bg-red-500/10 transition-colors"
              >
                Decline
              </button>
            </>
          )}

          {/* Brand actions — mark negotiating */}
          {isBrand && status === "replied" && (
            <button
              onClick={() => updateStatus("negotiating")}
              className="px-3 py-1.5 text-xs font-bold border border-amber-500/50 text-amber-400 rounded hover:bg-amber-500/10 transition-colors"
            >
              Negotiating
            </button>
          )}

          {/* Brand: pay into escrow when accepted and no held payment */}
          {isBrand && status === "accepted" && (!escrow || escrow.status === "pending") && (
            <button
              onClick={() => setShowPayModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              🔒 Pay into Escrow
            </button>
          )}

          {/* Brand: release payment when held */}
          {isBrand && escrow?.status === "held" && (
            <button
              onClick={releaseEscrow}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
            >
              ✓ Release Payment
            </button>
          )}

          {/* Dispute button for both when held */}
          {escrow?.status === "held" && (
            <button
              onClick={() => {
                const reason = prompt("Briefly describe the issue:");
                if (reason) disputeEscrow(reason);
              }}
              className="px-3 py-1.5 text-xs font-bold border border-red-500/50 text-red-400 rounded hover:bg-red-500/10 transition-colors"
            >
              Dispute
            </button>
          )}

          {/* Mark complete — only after payment released */}
          {status === "accepted" && escrow?.status === "released" && (
            <button
              onClick={() => updateStatus("completed")}
              className="px-3 py-1.5 text-xs font-bold border border-border rounded hover:bg-muted transition-colors text-muted-foreground"
            >
              Mark Complete
            </button>
          )}

          {isBrand && inq?.creator_profiles && (
            <Link
              to="/creator/$creatorId"
              params={{ creatorId: inq.creator_profiles.slug }}
              className="text-xs text-primary hover:underline"
            >
              View Profile →
            </Link>
          )}
        </div>
      </div>

      {/* Escrow status banner */}
      {escrow && (
        <EscrowBanner escrow={escrow} isBrand={isBrand} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((m) => {
          const isMine = m.sender_user_id === session?.user.id;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm
                ${isMine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"}`}>
                <p>{m.body}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.sent_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box — disabled once declined or completed */}
      {status !== "declined" && status !== "completed" ? (
        <div className="border-t border-border px-6 pt-3 pb-4">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={suggestReply}
              disabled={suggesting}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {suggesting ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  Thinking…
                </>
              ) : "✦ Suggest reply"}
            </button>
          </div>
          <form onSubmit={sendReply} className="flex gap-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 px-4 py-2.5 bg-background border border-border rounded-full text-sm focus:outline-none focus:border-primary/60 transition-all"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sending ? "…" : "Send"}
            </button>
          </form>
        </div>
      ) : (
        <div className="px-6 py-4 border-t border-border text-center text-sm text-muted-foreground">
          {status === "declined" ? "This inquiry was declined." : "This collaboration is marked complete."}
        </div>
      )}

      {/* Escrow payment modal */}
      {showPayModal && inq && (
        <EscrowPayModal
          inquiryId={inq.id}
          offerInr={inq.offer_inr ?? 0}
          creatorName={other}
          onClose={() => setShowPayModal(false)}
          onPaid={(payment) => {
            onEscrowUpdate(payment);
            setShowPayModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Escrow Banner ─────────────────────────────────────────────────────────────

function EscrowBanner({ escrow, isBrand }: { escrow: EscrowPayment; isBrand: boolean }) {
  const statusConfig: Record<EscrowStatus, { bg: string; text: string; icon: string; label: string }> = {
    pending:  { bg: "bg-amber-500/10 border-amber-500/30",   text: "text-amber-400",   icon: "⏳", label: "Awaiting payment" },
    held:     { bg: "bg-primary/10 border-primary/30",       text: "text-primary",     icon: "🔒", label: "Funds held in escrow" },
    released: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", icon: "✓", label: "Payment released" },
    refunded: { bg: "bg-muted border-border",                text: "text-muted-foreground", icon: "↩", label: "Payment refunded" },
    disputed: { bg: "bg-red-500/10 border-red-500/30",       text: "text-red-400",     icon: "⚠", label: "Dispute raised — AlfaMatch reviewing" },
  };

  const cfg = statusConfig[escrow.status];

  return (
    <div className={`mx-6 mt-4 px-4 py-3 rounded-xl border ${cfg.bg} flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{cfg.icon}</span>
        <div>
          <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
          <p className="text-[11px] text-muted-foreground">
            ₹{escrow.amount_inr.toLocaleString("en-IN")} + ₹{escrow.platform_fee_inr.toLocaleString("en-IN")} platform fee
            {escrow.status === "held" && !isBrand && " · Waiting for brand to release after content delivery"}
            {escrow.status === "held" && isBrand && " · Release after creator delivers content"}
            {escrow.status === "released" && escrow.released_at &&
              ` · ${new Date(escrow.released_at).toLocaleDateString("en-IN")}`}
          </p>
        </div>
      </div>
      <div className={`text-xs font-mono font-bold ${cfg.text}`}>
        ₹{escrow.amount_inr.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

// ── Escrow Pay Modal ──────────────────────────────────────────────────────────

function EscrowPayModal({
  inquiryId,
  offerInr,
  creatorName,
  onClose,
  onPaid,
}: {
  inquiryId: string;
  offerInr: number;
  creatorName: string;
  onClose: () => void;
  onPaid: (payment: EscrowPayment) => void;
}) {
  const [amount, setAmount]   = useState(String(offerInr || ""));
  const [step,   setStep]     = useState<"confirm" | "processing" | "done">("confirm");
  const [error,  setError]    = useState("");

  const fee       = Math.round(Number(amount) * 0.05);
  const total     = Number(amount) + fee;

  async function handlePay() {
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
    setStep("processing");
    setError("");

    try {
      // Create escrow order (mock for now)
      const { data: orderData, error: orderErr } = await supabase.functions.invoke("create-escrow-order", {
        body: { inquiry_id: inquiryId, amount_inr: Number(amount) },
      });

      if (orderErr || orderData?.error) throw new Error(orderData?.error ?? "Failed to create order");

      // Simulate payment confirmation (in real app: open Razorpay checkout here)
      await new Promise((r) => setTimeout(r, 1500));

      // Mark as held
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: escrow, error: escrowErr } = await db
        .from("escrow_payments")
        .update({
          status: "held",
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          brand_paid_at: new Date().toISOString(),
        })
        .eq("inquiry_id", inquiryId)
        .select()
        .single();

      if (escrowErr || !escrow) throw new Error("Payment confirmation failed");

      onPaid(escrow as EscrowPayment);
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
      setStep("confirm");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        {step === "confirm" && (
          <>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-xl">🔒</div>
                <div>
                  <h3 className="font-bold text-base">Pay into Escrow</h3>
                  <p className="text-xs text-muted-foreground">Funds held safely until you release</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Payment to {creatorName}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-7 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary/60"
                    />
                  </div>
                </div>

                {Number(amount) > 0 && (
                  <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creator payment</span>
                      <span className="font-mono">₹{Number(amount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee (5%)</span>
                      <span className="font-mono">₹{fee.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary font-mono">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-primary/5 rounded-lg px-3 py-2">
                  <span className="mt-0.5">ℹ</span>
                  <span>Funds are held securely. You release them only after the creator delivers the agreed content. AlfaMatch mediates any disputes.</span>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>

              <button
                onClick={handlePay}
                disabled={!amount || Number(amount) <= 0}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Pay ₹{total > 0 ? total.toLocaleString("en-IN") : "—"} Securely
              </button>
            </div>
            <button onClick={onClose} className="w-full py-3 text-sm text-muted-foreground hover:text-foreground border-t border-border transition-colors">
              Cancel
            </button>
          </>
        )}

        {step === "processing" && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold">Processing payment…</p>
            <p className="text-sm text-muted-foreground mt-1">Do not close this window</p>
          </div>
        )}

        {step === "done" && (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
            <h3 className="font-bold text-lg mb-1">Funds Secured!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ₹{Number(amount).toLocaleString("en-IN")} is now held in escrow. Release it once {creatorName} delivers the content.
            </p>
            <button onClick={onClose} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyInbox({ isBrand }: { isBrand: boolean }) {
  return (
    <div className="flex-1 grid place-items-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">✉</div>
        <h2 className="text-xl font-bold mb-2">No messages yet</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          {isBrand
            ? "Browse creators and send your first inquiry to get started."
            : "Complete your profile and share your link to start getting brand inquiries."}
        </p>
        <Link
          to={isBrand ? "/browse" : "/dashboard/creator"}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          {isBrand ? "Browse Creators" : "Go to Dashboard"}
        </Link>
      </div>
    </div>
  );
}

import React from "react";
