import RoomDetailServer from "./RoomDetailServer";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({ params }: PageProps) {
  const { roomId } = await params;
  return <RoomDetailServer roomId={roomId} />;
}
