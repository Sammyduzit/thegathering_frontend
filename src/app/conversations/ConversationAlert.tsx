"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AlertStrip from "@/components/ui/AlertStrip";

type Props = {
  message: string;
};

export default function ConversationAlert({ message }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Clear URL params after showing message
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace('/conversations/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!visible) return null;

  return (
    <div className="mb-6">
      <AlertStrip variant="notice">{message}</AlertStrip>
    </div>
  );
}
