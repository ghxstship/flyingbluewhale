"use client";

import { KIcon } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";

/**
 * Share the holder's COMPVSS profile via the native share sheet (Web Share API
 * on the Capacitor WebView / mobile browsers), falling back to copying the link
 * to the clipboard. Client-only — `navigator.share`/`clipboard` are browser APIs.
 */
export function ShareProfileButton({ url, name, label }: { url: string; name: string; label: string }) {
  const toast = useToast();

  const share = async () => {
    const shareData = { title: name, text: `${name} · COMPVSS`, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied", { description: url });
        return;
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="ps-btn ps-btn--secondary ps-btn--lg"
      style={{ width: "100%", justifyContent: "center", margin: "10px 0 4px" }}
    >
      <KIcon name="Share2" size={15} /> {label}
    </button>
  );
}
