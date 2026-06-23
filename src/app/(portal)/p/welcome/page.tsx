import { TasteOnboarding } from "@/components/gvteway/TasteOnboarding";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Welcome — taste/genre onboarding (design_handoff §2/§4). The
 * consumer entry point: it COMPOSES THE SAME auth primitives as the operator
 * `(auth)` flow (`AuthShell` / `OAuthButtons` / `PasswordField`, via
 * `TasteOnboarding`) and layers a genre picker that seeds Discover. One
 * composition, no forked auth UI.
 */
export default function WelcomePage() {
  return <TasteOnboarding />;
}
