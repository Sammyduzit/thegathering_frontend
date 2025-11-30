"use client";

import { useState, useEffect } from "react";
import GlassPanel from "./ui/GlassPanel";

type QuotaExceededBannerProps = {
  resetDate: string;
};

export default function QuotaExceededBanner({ resetDate }: QuotaExceededBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const dismissedUntil = localStorage.getItem("quota_banner_dismissed");
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      const now = new Date();
      if (now < dismissedDate) {
        setDismissed(true);
      } else {
        // Cleanup expired dismissal
        localStorage.removeItem("quota_banner_dismissed");
      }
    }
  }, []);

  const handleDismiss = () => {
    // Store dismissal until reset date
    localStorage.setItem("quota_banner_dismissed", resetDate);
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  const formattedDate = new Date(resetDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="sticky top-[120px] z-40 px-4 pb-4">
      <GlassPanel className="rounded-[16px] px-6 py-4 border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-950/30 via-orange-950/20 to-yellow-950/30 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-yellow-400/60 hover:text-yellow-400 transition-colors"
          aria-label="Dismiss banner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pr-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              You&apos;ve reached your weekly message limit!
            </h3>
            <div className="space-y-2 text-sm text-gray-200 leading-relaxed">
              <p>
                Thanks for being such an active member of The Gathering! We&apos;re working hard to
                enhance the app, and our admins have been notified that you clearly love what
                we&apos;re building. They&apos;ll be doing some overtime to keep up!
              </p>
              <p>
                Your weekly limit will reset on{" "}
                <span className="font-semibold text-yellow-400">{formattedDate}</span>.
              </p>
              <p className="italic text-gray-300">
                In the meantime, step into the sunlight and find your tribe in person. Digital
                connections rest, human bonds grow. See you soon!
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
