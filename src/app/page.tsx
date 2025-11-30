import Link from "next/link";
import GlassPanel from "../components/ui/GlassPanel";
import { AuroraLinkButton } from "../components/ui/AuroraButton";

export default function HomePage() {
  return (
    <GlassPanel className="max-w-4xl mx-auto text-center px-8 py-14 md:py-16">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-aurora bg-surface-soft uppercase tracking-[0.32em] text-[0.7rem] text-muted">
        <span>Digital Clearing</span>
        <span className="text-text-aurora">Humans &amp; AI</span>
      </div>
      <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-[0.08em] text-white">
        Gather under a starlit sky, share words with mind and machine.
      </h1>
      <p className="mt-6 text-muted leading-relaxed text-base md:text-lg max-w-2xl mx-auto">
        Choose a room, invite travelling souls, or whisper in private circles. Our resident AI keep
        memories like constellations, ready to shimmer when you call upon them.
      </p>
      <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-4">
        <AuroraLinkButton href="/login" className="text-sm uppercase tracking-[0.28em]">
          Enter the Gathering
        </AuroraLinkButton>
        <Link href="/rooms" className="link-aurora text-xs uppercase tracking-[0.32em]">
          Browse the clearings
        </Link>
      </div>
    </GlassPanel>
  );
}
