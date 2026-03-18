import Link from "next/link";
import GlassPanel from "../components/ui/GlassPanel";
import { AuroraLinkButton } from "../components/ui/AuroraButton";
import { buildRequestContext } from "@/lib/server/request-context";

const features = [
  {
    icon: "◎",
    title: "Rooms",
    description:
      "Public clearings where souls converge. Join the circle, find your voice beneath the open sky.",
    href: "/rooms",
    accentColor: "var(--color-accent-ai)",
    borderColor: "var(--color-border-aurora)",
  },
  {
    icon: "◈",
    title: "Conversations",
    description:
      "Intimate dialogues with chosen companions. Private, purposeful, and yours to keep.",
    href: "/conversations",
    accentColor: "var(--color-accent-gold)",
    borderColor: "var(--color-border-panel-strong)",
  },
  {
    icon: "✦",
    title: "AI Companions",
    description:
      "Each AI carries memories like constellations — ready to shimmer when you call upon them.",
    href: "/rooms",
    accentColor: "var(--color-accent-aurora-end)",
    borderColor: "var(--color-border-ai)",
  },
];

export default async function HomePage() {
  const ctx = await buildRequestContext({ fetchUser: true });
  const isAuthenticated = ctx.authenticated;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <GlassPanel className="relative overflow-hidden text-center px-8 py-20 md:py-28">
        {/* Atmospheric glow orbs */}
        <div
          aria-hidden
          className="absolute -top-24 left-1/3 w-96 h-96 rounded-full opacity-25 blur-[100px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(124,241,255,0.6), transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-16 right-1/4 w-72 h-72 rounded-full opacity-20 blur-[80px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(230,90,194,0.6), transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 -left-16 w-56 h-56 rounded-full opacity-15 blur-[60px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(42,122,255,0.5), transparent)",
          }}
        />

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-aurora bg-surface-soft uppercase tracking-[0.32em] text-[0.68rem] text-text-aurora">
          <span className="w-1.5 h-1.5 rounded-full bg-ai animate-pulse" />
          <span>Humans &amp; AI · Digital Clearing</span>
        </div>

        {/* Title */}
        <h1 className="relative mt-8 text-5xl md:text-[4.5rem] font-semibold tracking-[0.03em] text-white leading-[1.08]">
          Gather under
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #2a7aff 0%, #6f3cff 45%, #e65ac2 100%)",
            }}
          >
            a starlit sky
          </span>
        </h1>

        {/* Divider */}
        <div className="mt-8 star-divider max-w-[12rem] mx-auto" />

        {/* Subtitle */}
        <p className="relative mt-8 text-text-muted leading-relaxed text-base md:text-lg max-w-2xl mx-auto">
          Choose a room, invite travelling souls, or whisper in private circles.
          Our resident AI keep memories like constellations, ready to shimmer
          when you call upon them.
        </p>

        {/* CTAs */}
        <div className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
          {!isAuthenticated && (
            <AuroraLinkButton
              href="/login"
              className="text-sm uppercase tracking-[0.28em]"
            >
              Enter the Gathering
            </AuroraLinkButton>
          )}
          <Link
            href="/rooms"
            className="link-aurora text-xs uppercase tracking-[0.32em]"
          >
            Browse the clearings →
          </Link>
        </div>
      </GlassPanel>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map(({ icon, title, description, href, accentColor, borderColor }) => (
          <Link key={title} href={href} className="block group">
            <GlassPanel
              className="h-full p-7 rounded-2xl transition-all duration-200 hover:-translate-y-1"
              style={
                {
                  "--card-border": borderColor,
                } as React.CSSProperties
              }
            >
              <div
                className="text-3xl mb-5 transition-transform duration-300 group-hover:scale-110 inline-block"
                style={{ color: accentColor }}
              >
                {icon}
              </div>
              <h3
                className="text-base font-semibold tracking-[0.06em] text-white transition-colors duration-200"
                style={
                  {
                    "--hover-color": accentColor,
                  } as React.CSSProperties
                }
              >
                <span className="group-hover:text-[var(--hover-color)] transition-colors duration-200">
                  {title}
                </span>
              </h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                {description}
              </p>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
