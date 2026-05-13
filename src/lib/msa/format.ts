import { urlFor } from "@/lib/urls";

export function msaPublicUrl(token: string): string {
  return urlFor("marketing", `/msa/${token}`);
}
