"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { getErrorMessage } from "@/types/api-error";
import type { UserQuotaResponse, UserResponse } from "@/types/user";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraButton } from "@/components/ui/AuroraButton";
import { AuroraInput } from "@/components/ui/AuroraInput";
import AlertStrip from "@/components/ui/AlertStrip";
import Image from "next/image";

type Props = {
  initialProfile: UserResponse;
  initialQuota: UserQuotaResponse | null;
  supportedLanguages: string[];
};

export default function MeClient({ initialProfile, initialQuota, supportedLanguages }: Props) {
  const [profile, setProfile] = useState<UserResponse>(initialProfile);
  const [username, setUsername] = useState(initialProfile.username);
  const [preferredLanguage, setPreferredLanguage] = useState(initialProfile.preferred_language ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile.is_admin;

  const quota = initialQuota;
  const unlimitedQuota = quota?.weekly_limit === -1;
  const showQuotaProgress = Boolean(quota && quota.weekly_limit > 0);
  const rawQuotaPercentage = quota?.percentage_used ?? 0;
  const quotaPercentage = showQuotaProgress ? Math.min(rawQuotaPercentage, 100) : 0;
  const quotaLabel = !quota
    ? "N/A"
    : unlimitedQuota
    ? `${quota.used} / Unlimited`
    : `${quota.used} / ${quota.weekly_limit}`;
  const quotaHelperText = !quota
    ? "Quota information unavailable"
    : unlimitedQuota
    ? "You have unlimited weekly messages"
    : quotaPercentage >= 100
    ? "You have reached your weekly limit"
    : quotaPercentage >= 80
    ? "You are approaching your weekly limit"
    : quotaPercentage > 0
    ? `${(100 - quotaPercentage).toFixed(0)}% of your quota remaining`
    : "No messages sent yet";
  let resetDate = "Not available";
  if (quota) {
    if (unlimitedQuota) {
      resetDate = "Not required";
    } else {
      const resetSource = quota.next_reset_date ?? quota.last_reset_date;
      if (resetSource) {
        resetDate = new Date(resetSource).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setError(null);

    const payload: Record<string, unknown> = {};
    if (username && username !== profile.username) {
      payload.username = username;
    }

    if (preferredLanguage.trim() === "") {
      if (profile.preferred_language !== null) {
        payload.preferred_language = null;
      }
    } else if (preferredLanguage !== profile.preferred_language) {
      payload.preferred_language = preferredLanguage;
    }

    if (Object.keys(payload).length === 0) {
      setFeedback("No changes to update.");
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await apiFetch<UserResponse>("/api/me", {
        method: "PATCH",
        body: payload,
      });

      setProfile(data);
      setFeedback("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Avatar & Header Section */}
      <GlassPanel className="px-8 py-8 rounded-3xl">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border-aurora shadow-[0_0_24px_rgba(124,241,255,0.35)]">
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.username}'s avatar`}
                  width={128}
                  height={128}
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(124,241,255,0.45),rgba(111,60,255,0.3))] border-4 border-border-aurora shadow-[0_0_24px_rgba(124,241,255,0.35)] flex items-center justify-center">
                <span className="text-4xl font-bold text-white uppercase">
                  {profile.username.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold tracking-[0.08em] text-white mb-2">
              {profile.username}
            </h1>
            <p className="text-base text-text-soft mb-3">{profile.email}</p>
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aurora-haze border border-border-aurora">
                <span className="text-xs uppercase tracking-[0.28em] text-text-aurora font-semibold">
                  Administrator
                </span>
              </div>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : "lg:grid-cols-1"}`}>
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Settings Card */}
          <GlassPanel className="px-6 py-6 rounded-3xl space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Profile Settings</h2>
              <p className="mt-2 text-text-muted text-sm">
                Update your display name and language preferences
              </p>
            </div>

            {feedback && <AlertStrip>{feedback}</AlertStrip>}
            {error && <AlertStrip variant="danger">{error}</AlertStrip>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuroraInput
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />

              <div className="space-y-2">
                <AuroraInput
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  className="bg-surface-deep border-border-panel opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-text-faint">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-text-soft" htmlFor="preferred-language">
                  Preferred Language
                </label>
                <select
                  id="preferred-language"
                  className="input-field"
                  value={preferredLanguage}
                  onChange={(event) => setPreferredLanguage(event.target.value)}
                >
                  <option value="">No preference</option>
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <AuroraButton type="submit" disabled={submitting} className="w-full justify-center">
                {submitting ? "Saving..." : "Save Changes"}
              </AuroraButton>
            </form>
          </GlassPanel>

          {/* Quota Card */}
          <GlassPanel className="px-6 py-6 rounded-3xl space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Message Quota</h2>
              <p className="mt-2 text-text-muted text-sm">
                Your weekly message usage and limits
              </p>
            </div>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-soft">Messages sent this week</span>
                  <span className="text-sm font-semibold text-white">{quotaLabel}</span>
                </div>
                {showQuotaProgress ? (
                  <>
                    <div className="h-3 rounded-full bg-surface-deep border border-border-panel overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-aurora-cyan to-aurora-violet transition-all duration-500"
                        style={{ width: `${quotaPercentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-faint">{quotaHelperText}</p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-text-faint">{quotaHelperText}</p>
                )}
              </div>

              <div className="star-divider" />

              {/* Reset Info */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.28em] text-text-subtle">Quota resets</span>
                <span className="text-sm text-white">{resetDate}</span>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column - Admin Only */}
        {isAdmin && (
          <GlassPanel className="px-6 py-6 rounded-3xl space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Developer Data</h2>
              <p className="text-xs text-text-subtle uppercase tracking-[0.32em] mt-1">
                Mirror of /api/me
              </p>
            </div>
            <pre className="max-h-[600px] overflow-auto rounded-2xl border border-border-panel bg-surface-deep p-4 text-xs text-text-soft">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
