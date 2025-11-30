import { cookies, headers } from "next/headers";
import GlassPanel from "@/components/ui/GlassPanel";
import { AuroraLinkButton } from "@/components/ui/AuroraButton";
import RoomDetailClient from "./RoomDetailClient";
import type {
  PaginatedRoomMessagesResponse,
  Room,
  RoomOverviewInfo,
  RoomParticipantsResponse,
  RoomMessage,
} from "@/types/room";

const INITIAL_MESSAGES_PAGE_SIZE = 50;

type RequestContext =
  | { authenticated: false }
  | {
      authenticated: true;
      baseUrl: string;
      headers: Record<string, string>;
      currentRoomId: number | null;
      username: string;
    };

async function buildRequestContext(): Promise<RequestContext> {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("tg_access");

  if (!accessCookie) {
    return { authenticated: false };
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("host") ?? "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const defaultHeaders = {
    cookie: cookieHeader,
    authorization: `Bearer ${accessCookie.value}`,
    accept: "application/json",
  };

  const meResponse = await fetch(`${baseUrl}/api/me`, {
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (!meResponse.ok) {
    return { authenticated: false };
  }

  const me = await meResponse.json();

  return {
    authenticated: true,
    baseUrl,
    headers: defaultHeaders,
    currentRoomId: me?.current_room_id ?? null,
    username: me?.username ?? "",
  };
}

export default async function RoomDetailServer({ roomId }: { roomId: string }) {
  const context = await buildRequestContext();

  if (!context.authenticated) {
    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room</h1>
        <p className="mt-4 text-muted leading-relaxed">
          Please sign in to view room details and join the gathering.
        </p>
        <AuroraLinkButton href="/login" className="mt-6 mx-auto uppercase tracking-[0.3em] text-xs">
          Sign In
        </AuroraLinkButton>
      </GlassPanel>
    );
  }

  const { baseUrl, headers: defaultHeaders, currentRoomId, username } = context;
  const numericRoomId = Number.parseInt(roomId, 10);
  const canViewMessages = Number.isSafeInteger(numericRoomId) && currentRoomId === numericRoomId;

  const [roomResponse, participantsResponse, countResponse, healthResponse] = await Promise.all([
    fetch(`${baseUrl}/api/rooms/${roomId}`, { headers: defaultHeaders, cache: "no-store" }),
    fetch(`${baseUrl}/api/rooms/${roomId}/participants`, { headers: defaultHeaders, cache: "no-store" }),
    fetch(`${baseUrl}/api/rooms/count`, { headers: defaultHeaders, cache: "no-store" }),
    fetch(`${baseUrl}/api/rooms/health`, { headers: defaultHeaders, cache: "no-store" }),
  ]);

  if (!roomResponse.ok) {
    const error = await roomResponse.json().catch(() => null);
    const message =
      (error && (error.detail || error.error)) ??
      (roomResponse.status === 404 ? "Room not found." : "Unable to load room details.");

    return (
      <GlassPanel as="section" className="max-w-lg mx-auto px-7 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-[0.08em] text-white">Room</h1>
        <p className="mt-4 text-xs uppercase tracking-[0.32em] text-text-rose">{message}</p>
      </GlassPanel>
    );
  }

  const room: Room = await roomResponse.json();
  const participants: RoomParticipantsResponse | null = participantsResponse.ok
    ? await participantsResponse.json()
    : null;

  const roomsCount: RoomsCountResponse | null = countResponse.ok
    ? await countResponse.json()
    : null;

  const roomsHealth: RoomsHealthResponse | null = healthResponse.ok
    ? await healthResponse.json().catch(() => null)
    : null;

  let initialMessages: RoomMessage[] = [];
  let initialPagination = {
    page: 1,
    pageSize: INITIAL_MESSAGES_PAGE_SIZE,
    hasMore: false,
    total: 0,
    totalPages: 1,
  };
  let messagesError: string | null = null;

  if (canViewMessages) {
    const messagesResponse = await fetch(
      `${baseUrl}/api/rooms/${roomId}/messages?page=1&page_size=${INITIAL_MESSAGES_PAGE_SIZE}`,
      {
        headers: defaultHeaders,
        cache: "no-store",
      }
    );

    if (messagesResponse.ok) {
      const payload: PaginatedRoomMessagesResponse = await messagesResponse.json();
      initialMessages = payload.messages ?? [];
      const resolvedPageSize = payload.page_size || INITIAL_MESSAGES_PAGE_SIZE;
      const fallbackTotal = payload.total ?? initialMessages.length;
      const computedTotalPages =
        payload.total_pages ||
        (fallbackTotal > 0 && resolvedPageSize > 0 ? Math.max(1, Math.ceil(fallbackTotal / resolvedPageSize)) : 1);

      initialPagination = {
        page: payload.page || 1,
        pageSize: resolvedPageSize,
        hasMore: Boolean(payload.has_more),
        total: fallbackTotal,
        totalPages: computedTotalPages,
      };
    } else {
      const errorBody = await messagesResponse.json().catch(() => null);
      messagesError = resolveErrorMessage(
        errorBody,
        `Failed to load room messages (status ${messagesResponse.status}).`
      );
    }
  }

  const overview: RoomOverviewInfo = {
    activeRooms: roomsCount?.count ?? null,
    countMessage: roomsCount?.message ?? null,
    healthStatus: roomsHealth?.status ?? null,
    healthMessage: roomsHealth?.message ?? null,
  };

  return (
    <RoomDetailClient
      room={room}
      participants={participants}
      currentRoomId={currentRoomId}
      currentUsername={username}
      overview={overview}
      initialMessages={initialMessages}
      initialPagination={initialPagination}
      messagesError={messagesError}
    />
  );
}

type RoomsCountResponse = {
  count: number;
  message?: string;
};

type RoomsHealthResponse = {
  status?: string;
  message?: string;
  [key: string]: unknown;
};

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first && typeof first === "object" && "msg" in first) {
        const msg = (first as Record<string, unknown>).msg;
        if (typeof msg === "string") {
          return msg;
        }
      }
    }
    if (typeof record.error === "string") {
      return record.error;
    }
  }
  return fallback;
}
