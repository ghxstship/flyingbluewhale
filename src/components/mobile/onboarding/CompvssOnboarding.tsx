"use client";

import {
  useEffect,
  useState,
  useTransition,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { KIcon, QR } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  requestPermission,
  checkPermissionsSupport,
  type PermissionKind,
} from "@/lib/native/permissions";
import {
  signUpAction,
  verifyOtpAction,
  resendOtpAction,
  signInAction,
  forgotAction,
  oauthUrlAction,
  saveProfileAction,
  joinOrgAction,
  savePermissionsAction,
  completeOnboardingAction,
} from "./actions";

/**
 * COMPVSS field — Auth & Onboarding flow. A faithful port of the kit prototype
 * `App()` (compvss-mobile/auth.jsx): splash → sign up / in → verify → profile →
 * join org → permissions → welcome → Rose → assignment, plus forgot-password.
 *
 * This is the mobile app's OWN flow — it does not reuse the web `(auth)`
 * screens. Account / pause / archive are intentionally omitted (they already
 * live at /m/settings/account). The root element is `.compvss-onboarding`,
 * which scopes the kit-onboarding.css component layer.
 *
 * The shell (status bar / device frame / flow navigator) from the prototype is
 * dropped — this renders inside the real `.mobile-shell`. The orchestrator
 * mounts this component; sign-in / completion call `router.refresh()` to enter
 * the app.
 */

type Screen =
  | "splash"
  | "signin"
  | "signup"
  | "verify"
  | "forgot"
  | "profile"
  | "join"
  | "permissions"
  | "welcome"
  | "pass"
  | "assignment";

type Perms = { location: boolean; notifications: boolean; camera: boolean; bluetooth: boolean };

export type AssignmentOffer = {
  initials: string;
  project: string;
  org: string;
  venue: string;
  role: string;
  dates: string;
  rate: string;
  firstCall: string;
  reportsTo: string;
};

export type CompvssOnboardingProps = {
  /** The viewer's most-recent pending assignment, if any. Falls back to the
   *  kit demo content when absent. */
  offer?: AssignmentOffer | null;
  /** Display name / initials seed for the avatar + Rose card. */
  memberName?: string;
};

// ── brand mark + logos (ported inline) ───────────────────────────────────────
const Mark = ({ size = 64 }: { size?: number }) => (
  <svg viewBox="0 0 128 128" style={{ width: size, height: size }}>
    <rect width="128" height="128" rx="28" fill="var(--p-accent)" />
    <g transform="translate(28 28) scale(1.125)">
      <path d="M32 5 L37 27 L59 32 L37 37 L32 59 L27 37 L5 32 L27 27 Z" fill="#fff" />
      <circle cx="32" cy="32" r="4.2" fill="var(--p-accent)" />
    </g>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" width="17" height="17" style={{ flex: "none" }}>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </svg>
);
const BlueskyLogo = () => (
  <svg viewBox="0 0 568 501" width="17" height="17" style={{ flex: "none" }}>
    <path fill="#1185fe" d="M123 34c65 49 135 148 160 202 25-54 95-153 160-202 47-35 123-62 123 25 0 18-10 146-16 167-21 73-95 91-161 80 115 20 144 84 81 149-120 124-173-31-187-66-3-7-4-10-4-7-1-3-2 0-4 7-14 35-67 190-187 66-63-65-34-129 81-149-66 11-140-7-161-80-6-21-16-149-16-167 0-87 76-60 123-25z" />
  </svg>
);
const soonRibbon: CSSProperties = {
  position: "absolute",
  top: 8,
  right: -30,
  transform: "rotate(45deg)",
  fontFamily: "var(--p-mono)",
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "2px 32px",
  background: "#3fae29",
  color: "#fff",
};

// Deterministic QR-style matrix; value seeds the pattern (single-use token).
// Backed by the kit's pure `QR` primitive (same FNV-1a + LCG algorithm as the
// prototype's inline `QRCode`, extracted module-level to satisfy immutability).
const QRCode = ({ value, size = 116 }: { value: string; size?: number }) => (
  <QR value={value} size={size} fg="#0c0e12" bg="#fff" />
);

// ── small inputs (ported inline) ─────────────────────────────────────────────
type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; lead?: string };
const Field = ({ label, lead, ...p }: FieldProps) => (
  <div className="field">
    <label>{label}</label>
    <div className="inwrap">
      {lead && (
        <span className="lead">
          <KIcon name={lead} size={17} />
        </span>
      )}
      <input {...p} />
    </div>
  </div>
);

type PasswordFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
};
const PasswordField = ({ label, placeholder, value, onChange }: PasswordFieldProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="inwrap">
        <span className="lead">
          <KIcon name="Lock" size={17} />
        </span>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide" : "Show"}
          style={{
            position: "absolute",
            right: 11,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--p-text-3)",
            display: "flex",
            padding: 2,
          }}
        >
          <KIcon name={show ? "EyeOff" : "Eye"} size={17} />
        </button>
      </div>
    </div>
  );
};

const Steps = ({ n, of }: { n: number; of: number }) => (
  <div className="pill-step">
    {Array.from({ length: of }).map((_, i) => (
      <i key={i} className={i < n ? "on" : ""} />
    ))}
  </div>
);

const Toggle = ({ on, set, disabled }: { on: boolean; set: (v: boolean) => void; disabled?: boolean }) => (
  <div
    className="sw"
    data-on={on ? "1" : undefined}
    onClick={disabled ? undefined : () => set(!on)}
    style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
  >
    <span className="knob" />
  </div>
);

const ErrLine = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="muted" role="alert" style={{ color: "var(--p-danger)", marginTop: 8, textAlign: "center" }}>
      {msg}
    </p>
  ) : null;

const DEMO_OFFER: AssignmentOffer = {
  initials: "GX",
  project: "Miami Music Week",
  org: "GHXSTSHIP",
  venue: "Wynwood Main",
  role: "Gate & Access · Lead",
  dates: "Jun 18 – 22, 2026",
  rate: "$32/hr · W-9",
  firstCall: "Thu Jun 18 · 15:30",
  reportsTo: "Mara Voss · Ops Manager",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function CompvssOnboarding({ offer, memberName }: CompvssOnboardingProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [screen, setScreen] = useState<Screen>("splash");
  const [err, setErr] = useState<string | undefined>();
  const [toast, setToast] = useState<string | undefined>();

  // signup / signin form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // verify
  const [otp, setOtp] = useState("");

  // forgot
  const [forgotEmail, setForgotEmail] = useState("");

  // permissions
  const [language, setLanguage] = useState("en");
  const [perms, setPerms] = useState<Perms>({
    location: false,
    notifications: false,
    camera: false,
    bluetooth: false,
  });
  // Feature-detected availability (set on first render in the browser) — drives
  // the "Unavailable on this device" hint. Empty (all true-ish) on the server.
  const [permsSupport, setPermsSupport] = useState<Record<PermissionKind, boolean>>({
    location: true,
    notifications: true,
    camera: true,
    bluetooth: true,
  });
  // Which permission is mid-request (disables its toggle while the OS prompt is up).
  const [permsBusy, setPermsBusy] = useState<PermissionKind | null>(null);

  useEffect(() => {
    setPermsSupport(checkPermissionsSupport());
  }, []);

  // Toggle a permission. Turning ON fires the real platform request and only
  // sticks if granted; turning OFF just clears the local flag.
  const onTogglePerm = (kind: PermissionKind, next: boolean) => {
    if (!next) {
      setPerms((p) => ({ ...p, [kind]: false }));
      return;
    }
    if (!permsSupport[kind]) return; // unavailable — no-op
    setPermsBusy(kind);
    void requestPermission(kind)
      .then((res) => {
        if (res.unavailable) {
          setPermsSupport((s) => ({ ...s, [kind]: false }));
          setPerms((p) => ({ ...p, [kind]: false }));
        } else {
          setPerms((p) => ({ ...p, [kind]: res.granted }));
        }
      })
      .finally(() => setPermsBusy(null));
  };

  // profile
  const [fullProfile, setFullProfile] = useState(false);

  // join
  const [joinCode, setJoinCode] = useState("");

  // pass card flip + single-use token
  const [flip, setFlip] = useState(false);
  const [passToken, setPassToken] = useState("INIT");
  const toggleFlip = () =>
    setFlip((f) => {
      const next = !f;
      if (next) {
        setPassToken(Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).toUpperCase());
      }
      return next;
    });

  const resolvedOffer = offer ?? DEMO_OFFER;
  const displayName = (memberName ?? name).trim() || "Rio Tovar";
  const initials = initialsOf((memberName ?? name) || "Rio Tovar");

  const go = (s: Screen) => {
    setErr(undefined);
    setToast(undefined);
    setScreen(s);
  };

  // ── action runners ──────────────────────────────────────────────────────────
  const onSignUp = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await signUpAction({ name, email, phone: phone || undefined, password });
      if (res.error) {
        setErr(res.error);
        return;
      }
      go(res.needsVerify ? "verify" : "profile");
    });

  const onSignIn = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await signInAction({ email, password });
      if (res.error) {
        setErr(res.error);
        return;
      }
      // Sign-in skips onboarding steps — refresh to enter the app.
      router.refresh();
    });

  const onOAuth = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await oauthUrlAction("google");
      if (res.error || !res.url) {
        setErr(res.error ?? "Couldn't start single sign-on.");
        return;
      }
      window.location.assign(res.url);
    });

  const onVerify = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await verifyOtpAction({ email, token: otp });
      if (res.error) {
        setErr(res.error);
        return;
      }
      go("profile");
    });

  const onResend = () =>
    startTransition(async () => {
      const res = await resendOtpAction({ email });
      setToast(res.error ? res.error : t("m.onboarding.verify.resent", undefined, "Code Sent"));
    });

  const onForgot = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await forgotAction({ email: forgotEmail });
      if (res.error) {
        setErr(res.error);
        return;
      }
      setToast(t("m.onboarding.forgot.sent", undefined, "Check Your Email"));
      setTimeout(() => go("signin"), 900);
    });

  const onSaveProfile = (fd: FormData) =>
    startTransition(async () => {
      setErr(undefined);
      const res = await saveProfileAction(fd);
      if (res.error) {
        setErr(res.error);
        return;
      }
      go("join");
    });

  const onJoin = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await joinOrgAction({ code: joinCode });
      if (res.error) {
        setErr(res.error);
        return;
      }
      go("permissions");
    });

  const onSavePermissions = () =>
    startTransition(async () => {
      setErr(undefined);
      // `perms` already reflects real, OS-granted booleans (see onTogglePerm).
      const res = await savePermissionsAction({ language, perms });
      if (res.error) {
        setErr(res.error);
        return;
      }
      go("welcome");
    });

  const onComplete = () =>
    startTransition(async () => {
      setErr(undefined);
      const res = await completeOnboardingAction();
      if (res.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });

  return (
    <div className="compvss-onboarding">
      <div key={screen}>{renderScreen()}</div>
    </div>
  );

  function cta(label: string, onClick: () => void, extra?: CSSProperties): ReactNode {
    return (
      <button
        type="button"
        className="ps-btn ps-btn--cta"
        disabled={pending}
        onClick={onClick}
        style={{ width: "100%", justifyContent: "center", ...extra }}
      >
        {pending ? t("m.onboarding.common.working", undefined, "Working…") : label}
      </button>
    );
  }

  function ssoBlock(): ReactNode {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" className="sso" disabled={pending} onClick={onOAuth}>
          <GoogleLogo /> {t("m.onboarding.sso.google", undefined, "Continue With Google")}
        </button>
        <button type="button" className="sso" disabled style={{ position: "relative", overflow: "hidden", opacity: 0.85 }}>
          <BlueskyLogo /> {t("m.onboarding.sso.bluesky", undefined, "Continue With Bluesky")}
          <span style={soonRibbon}>{t("m.onboarding.common.soon", undefined, "Soon")}</span>
        </button>
      </div>
    );
  }

  function passkeyBtn(): ReactNode {
    return (
      <button type="button" className="sso" disabled style={{ borderStyle: "dashed", position: "relative", overflow: "hidden", opacity: 0.85, marginTop: 10 }}>
        <KIcon name="Fingerprint" size={17} /> {t("m.onboarding.common.passkey", undefined, "Use a Passkey")}
        <span style={soonRibbon}>{t("m.onboarding.common.soon", undefined, "Soon")}</span>
      </button>
    );
  }

  function renderScreen(): ReactNode {
    switch (screen) {
      case "splash":
        return (
          <div className="scr center" style={{ textAlign: "center", alignItems: "center" }}>
            <div className="spacer" />
            <Mark size={84} />
            <div className="wm" style={{ marginTop: 24, fontSize: 30 }}>
              COMPVSS
            </div>
            <div className="spacer" />
            {cta(t("m.onboarding.splash.start", undefined, "Get Started"), () => go("signup"))}
            <button type="button" className="sso" style={{ marginTop: 10 }} onClick={() => go("signin")}>
              {t("m.onboarding.splash.haveAccount", undefined, "I Already Have an Account")}
            </button>
            <p className="muted" style={{ marginTop: 18 }}>
              {t("m.onboarding.splash.terms", undefined, "By continuing you agree to the")}{" "}
              <span className="link">{t("m.onboarding.splash.termsLink", undefined, "Terms")}</span> &{" "}
              <span className="link">{t("m.onboarding.splash.privacyLink", undefined, "Privacy Policy")}</span>.
            </p>
          </div>
        );

      case "signup":
        return (
          <div className="scr">
            <button type="button" className="backbtn" onClick={() => go("splash")}>
              <KIcon name="ChevronLeft" size={18} /> {t("m.onboarding.common.back", undefined, "Back")}
            </button>
            <Steps n={1} of={5} />
            <h1 className="h1">{t("m.onboarding.signup.title", undefined, "Sign Up")}</h1>
            <p className="sub" style={{ marginBottom: 20 }}>
              {t("m.onboarding.signup.sub", undefined, "Use your work email or mobile number.")}
            </p>
            <Field label={t("m.onboarding.signup.name", undefined, "Full Name")} lead="User" placeholder="Rio Tovar" value={name} onChange={(e) => setName(e.target.value)} />
            <Field label={t("m.onboarding.signup.email", undefined, "Work Email")} lead="Mail" placeholder="rio@ghxstship.pro" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label={t("m.onboarding.signup.mobile", undefined, "Mobile")} lead="Phone" placeholder="+1 (305) 555-0199" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <PasswordField label={t("m.onboarding.signup.password", undefined, "Password")} placeholder="Create a password" value={password} onChange={setPassword} />
            <ErrLine msg={err} />
            {cta(t("m.onboarding.signup.continue", undefined, "Continue"), onSignUp, { marginTop: 4 })}
            {passkeyBtn()}
            <div className="divider">{t("m.onboarding.signup.orWith", undefined, "Or Sign Up With")}</div>
            {ssoBlock()}
            <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
              {t("m.onboarding.signup.haveAccount", undefined, "Have an account?")}{" "}
              <span className="link" onClick={() => go("signin")}>
                {t("m.onboarding.signup.signin", undefined, "Sign In")}
              </span>
            </p>
          </div>
        );

      case "signin":
        return (
          <div className="scr">
            <button type="button" className="backbtn" onClick={() => go("splash")}>
              <KIcon name="ChevronLeft" size={18} /> {t("m.onboarding.common.back", undefined, "Back")}
            </button>
            <div style={{ marginBottom: 18 }}>
              <Mark size={52} />
            </div>
            <h1 className="h1">{t("m.onboarding.signin.title", undefined, "Welcome Back")}</h1>
            <p className="sub" style={{ marginBottom: 20 }}>
              {t("m.onboarding.signin.sub", undefined, "Sign in to your crew account.")}
            </p>
            <Field label={t("m.onboarding.signin.email", undefined, "Email or Mobile")} lead="User" placeholder="rio@ghxstship.pro" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <PasswordField label={t("m.onboarding.signin.password", undefined, "Password")} placeholder="Your password" value={password} onChange={setPassword} />
            <div style={{ textAlign: "right", marginTop: -4, marginBottom: 14 }}>
              <span className="link" onClick={() => go("forgot")}>
                {t("m.onboarding.signin.forgot", undefined, "Forgot Password?")}
              </span>
            </div>
            <ErrLine msg={err} />
            {cta(t("m.onboarding.signin.cta", undefined, "Dive In"), onSignIn)}
            {passkeyBtn()}
            <div className="divider">{t("m.onboarding.signin.or", undefined, "Or")}</div>
            {ssoBlock()}
            <div className="spacer" />
            <p className="muted" style={{ textAlign: "center" }}>
              {t("m.onboarding.signin.new", undefined, "New here?")}{" "}
              <span className="link" onClick={() => go("signup")}>
                {t("m.onboarding.signin.create", undefined, "Create an Account")}
              </span>
            </p>
          </div>
        );

      case "verify":
        return (
          <div className="scr">
            <button type="button" className="backbtn" onClick={() => go("signup")}>
              <KIcon name="ChevronLeft" size={18} /> {t("m.onboarding.common.back", undefined, "Back")}
            </button>
            <Steps n={2} of={5} />
            <h1 className="h1">{t("m.onboarding.verify.title", undefined, "Verify It's You")}</h1>
            <p className="sub" style={{ marginBottom: 22 }}>
              {t("m.onboarding.verify.sub", undefined, "Enter the 6-digit code we sent to")} <strong>{email || "your email"}</strong>.
            </p>
            <label style={{ position: "relative", display: "block" }}>
              <div className="otp">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`cell ${otp.length > i ? "on" : ""} ${otp.length === i ? "cur" : ""}`}>
                    {otp[i] || ""}
                  </div>
                ))}
              </div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", fontSize: 16 }}
              />
            </label>
            <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
              {t("m.onboarding.verify.didnt", undefined, "Didn't get it?")}{" "}
              <span className="link" onClick={onResend}>
                {t("m.onboarding.verify.resend", undefined, "Resend")}
              </span>
            </p>
            {toast ? (
              <p className="muted" style={{ textAlign: "center", color: "var(--p-success)" }}>
                {toast}
              </p>
            ) : null}
            <ErrLine msg={err} />
            <div className="spacer" />
            {cta(
              t("m.onboarding.verify.cta", undefined, "Verify"),
              () => otp.length === 6 && onVerify(),
              { opacity: otp.length === 6 ? 1 : 0.5 },
            )}
          </div>
        );

      case "forgot":
        return (
          <div className="scr">
            <button type="button" className="backbtn" onClick={() => go("signin")}>
              <KIcon name="ChevronLeft" size={18} /> {t("m.onboarding.common.back", undefined, "Back")}
            </button>
            <h1 className="h1" style={{ marginTop: 8 }}>
              {t("m.onboarding.forgot.title", undefined, "Reset Password")}
            </h1>
            <p className="sub" style={{ marginBottom: 20 }}>
              {t("m.onboarding.forgot.sub", undefined, "We'll send a reset link to your email.")}
            </p>
            <Field label={t("m.onboarding.forgot.email", undefined, "Email")} lead="User" placeholder="rio@ghxstship.pro" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            <ErrLine msg={err} />
            {toast ? (
              <p className="muted" style={{ textAlign: "center", color: "var(--p-success)", marginBottom: 8 }}>
                {toast}
              </p>
            ) : null}
            {cta(t("m.onboarding.forgot.cta", undefined, "Send Reset Link"), onForgot)}
            <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
              {t("m.onboarding.forgot.remembered", undefined, "Remembered it?")}{" "}
              <span className="link" onClick={() => go("signin")}>
                {t("m.onboarding.forgot.back", undefined, "Back to Sign In")}
              </span>
            </p>
          </div>
        );

      case "profile":
        return (
          <form
            className="scr"
            action={onSaveProfile}
          >
            <Steps n={3} of={5} />
            <h1 className="h1">{t("m.onboarding.profile.title", undefined, "Set Up Profile")}</h1>
            <p className="sub" style={{ marginBottom: 18 }}>
              {t("m.onboarding.profile.sub", undefined, "This is your portable crew identity across every project. Start with the basics — you can complete the rest anytime.")}
            </p>
            <div className="avatar-pick">
              {initials}
              <span className="cam">
                <KIcon name="Camera" size={15} />
              </span>
            </div>
            <p className="muted" style={{ textAlign: "center", marginBottom: 18 }}>
              {t("m.onboarding.profile.addPhoto", undefined, "Add a Photo")}
            </p>
            <Field label={t("m.onboarding.profile.displayName", undefined, "Display Name")} name="display_name" lead="User" placeholder="Rio Tovar" defaultValue={memberName ?? name} />
            <Field label={t("m.onboarding.profile.username", undefined, "Username")} name="username" lead="AtSign" placeholder="riotovar" />
            <div className="row">
              <div style={{ flex: 1 }}>
                <Field label={t("m.onboarding.profile.email", undefined, "Email")} name="email" lead="Mail" placeholder="rio@ghxstship.pro" type="email" defaultValue={email} />
              </div>
              <div style={{ flex: 1 }}>
                <Field label={t("m.onboarding.profile.phone", undefined, "Phone")} name="phone" lead="Phone" placeholder="+1 (305) 555-0199" type="tel" defaultValue={phone} />
              </div>
            </div>
            <Field label={t("m.onboarding.profile.linkedin", undefined, "LinkedIn")} name="linkedin" lead="Linkedin" placeholder="linkedin.com/in/riotovar" />
            <Field label={t("m.onboarding.profile.spotify", undefined, "Spotify")} name="spotify" lead="Music" placeholder="open.spotify.com/user/…" />

            <button
              type="button"
              onClick={() => setFullProfile((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                padding: "10px 0 6px",
                cursor: "pointer",
                color: "var(--p-text-2)",
                fontWeight: 600,
                fontSize: 13.5,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <KIcon name="IdCard" size={16} /> {t("m.onboarding.profile.completeFull", undefined, "Complete Full Profile Now")}
              </span>
              <KIcon name={fullProfile ? "ChevronUp" : "ChevronDown"} size={16} style={{ color: "var(--p-text-3)" }} />
            </button>
            {fullProfile ? (
              <div style={{ borderTop: "1px solid var(--p-border)", paddingTop: 12 }}>
                {(() => {
                  const GH = ({ children }: { children: ReactNode }) => (
                    <div style={{ fontFamily: "var(--p-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-text-3)", margin: "14px 0 8px" }}>
                      {children}
                    </div>
                  );
                  const half = (a: ReactNode, b: ReactNode) => (
                    <div className="row">
                      <div style={{ flex: 1 }}>{a}</div>
                      <div style={{ flex: 1 }}>{b}</div>
                    </div>
                  );
                  return (
                    <>
                      <GH>{t("m.onboarding.profile.gh.identity", undefined, "Identity")}</GH>
                      <Field label={t("m.onboarding.profile.pronouns", undefined, "Pronouns")} name="pronouns" placeholder="they/them" />
                      <Field label={t("m.onboarding.profile.role", undefined, "Role / Title")} name="title" lead="Briefcase" placeholder="Gate & Access · Lead" />
                      <div className="field">
                        <label>{t("m.onboarding.profile.bio", undefined, "Bio")}</label>
                        <textarea name="bio" placeholder="A line about your work…" style={{ minHeight: 60 }} />
                      </div>

                      <GH>{t("m.onboarding.profile.gh.contact", undefined, "Contact")}</GH>
                      <Field label={t("m.onboarding.profile.address", undefined, "Address")} name="address" lead="MapPin" placeholder="Street address" />
                      {half(
                        <Field label={t("m.onboarding.profile.city", undefined, "City")} name="city" placeholder="Miami, FL" />,
                        <Field label={t("m.onboarding.profile.zip", undefined, "ZIP")} name="zip" placeholder="33127" />,
                      )}

                      <GH>{t("m.onboarding.profile.gh.emergency", undefined, "Emergency Contacts")}</GH>
                      {half(
                        <Field label={t("m.onboarding.profile.contact1", undefined, "Contact 1")} name="emergency_1" placeholder="Name · relation" />,
                        <Field label={t("m.onboarding.profile.phone", undefined, "Phone")} name="emergency_1_phone" placeholder="+1 (305) …" type="tel" />,
                      )}
                      {half(
                        <Field label={t("m.onboarding.profile.contact2", undefined, "Contact 2")} name="emergency_2" placeholder="Name · relation" />,
                        <Field label={t("m.onboarding.profile.phone", undefined, "Phone")} name="emergency_2_phone" placeholder="+1 (305) …" type="tel" />,
                      )}

                      <GH>{t("m.onboarding.profile.gh.social", undefined, "Social")}</GH>
                      <Field label={t("m.onboarding.profile.instagram", undefined, "Instagram")} name="instagram" lead="Instagram" placeholder="@riotovar" />
                      <Field label={t("m.onboarding.profile.website", undefined, "Website")} name="website" lead="Globe" placeholder="riotovar.com" />

                      <GH>{t("m.onboarding.profile.gh.dietary", undefined, "Dietary")}</GH>
                      <Field label={t("m.onboarding.profile.dietary", undefined, "Dietary Restrictions")} name="dietary" lead="Utensils" placeholder="Vegetarian · no shellfish" />

                      <GH>{t("m.onboarding.profile.gh.travel", undefined, "Travel Profile")}</GH>
                      {half(
                        <Field label={t("m.onboarding.profile.airport", undefined, "Home Airport")} name="home_airport" lead="Plane" placeholder="MIA" />,
                        <Field label={t("m.onboarding.profile.dob", undefined, "Date of Birth")} name="dob" placeholder="MM/DD/YYYY" />,
                      )}
                      {half(
                        <Field label={t("m.onboarding.profile.passport", undefined, "Passport No.")} name="passport" placeholder="•••••" />,
                        <Field label={t("m.onboarding.profile.visas", undefined, "Visas")} name="visas" placeholder="US · EU" />,
                      )}
                      {half(
                        <Field label={t("m.onboarding.profile.knownTraveler", undefined, "Known Traveler")} name="known_traveler" placeholder="TSA Pre / Global Entry" />,
                        <Field label={t("m.onboarding.profile.loyalty", undefined, "Loyalty")} name="loyalty" placeholder="AA · Marriott" />,
                      )}

                      <GH>{t("m.onboarding.profile.gh.uniform", undefined, "Uniform Sizes")}</GH>
                      {half(
                        <Field label={t("m.onboarding.profile.shirt", undefined, "Shirt")} name="size_shirt" placeholder="L" />,
                        <Field label={t("m.onboarding.profile.pants", undefined, "Pants")} name="size_pants" placeholder="32×32" />,
                      )}
                      {half(
                        <Field label={t("m.onboarding.profile.shoe", undefined, "Shoe")} name="size_shoe" placeholder="10.5" />,
                        <Field label={t("m.onboarding.profile.glove", undefined, "Glove")} name="size_glove" placeholder="L" />,
                      )}

                      <GH>{t("m.onboarding.profile.gh.credentials", undefined, "Credentials")}</GH>
                      <Field label={t("m.onboarding.profile.certs", undefined, "Certifications")} name="certifications" lead="BadgeCheck" placeholder="SIA · OSHA-30 · First Aid" />
                      <Field label={t("m.onboarding.profile.skills", undefined, "Skills & Tags")} name="skills" lead="Tags" placeholder="Crowd mgmt · radios · forklift" />
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="muted" style={{ marginBottom: 6 }}>
                {t("m.onboarding.profile.laterNote", undefined, "Bio, contact, emergency contacts, social, dietary, travel profile, uniform sizes & credentials can be added later from your profile.")}
              </p>
            )}
            <ErrLine msg={err} />
            <button type="submit" className="ps-btn ps-btn--cta" disabled={pending} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {pending
                ? t("m.onboarding.common.working", undefined, "Working…")
                : fullProfile
                  ? t("m.onboarding.profile.saveFull", undefined, "Save Profile")
                  : t("m.onboarding.profile.continueBasics", undefined, "Continue With Basics")}
            </button>
          </form>
        );

      case "join":
        return (
          <div className="scr">
            <Steps n={4} of={5} />
            <h1 className="h1">{t("m.onboarding.join.title", undefined, "Join Your Org")}</h1>
            <p className="sub" style={{ marginBottom: 18 }}>
              {t("m.onboarding.join.sub", undefined, "Enter the access code from your admin, or scan the invite QR.")}
            </p>
            <div className="scan-frame">
              <span className="cnr tl" />
              <span className="cnr tr" />
              <span className="cnr bl" />
              <span className="cnr br" />
              <KIcon name="QrCode" size={56} style={{ color: "rgba(255,255,255,.25)" }} />
            </div>
            <div className="field">
              <label>{t("m.onboarding.join.code", undefined, "Access Code")}</label>
              <div className="codebox">
                <input placeholder="GHXST-4471" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
              </div>
            </div>
            <ErrLine msg={err} />
            {cta(t("m.onboarding.join.cta", undefined, "Join"), onJoin)}
            <div className="note" style={{ marginTop: 14 }}>
              <KIcon name="Info" size={15} style={{ color: "var(--p-info)", flex: "none", marginTop: 1 }} />
              <span>{t("m.onboarding.join.note", undefined, "No code? You can request to join from an org admin, or continue and join a project later.")}</span>
            </div>
            <p className="muted" style={{ textAlign: "center", marginTop: 14 }}>
              <span className="link" onClick={() => go("permissions")}>
                {t("m.onboarding.join.skip", undefined, "Skip for Now")}
              </span>
            </p>
          </div>
        );

      case "permissions":
        return (
          <div className="scr">
            <Steps n={5} of={5} />
            <h1 className="h1">{t("m.onboarding.permissions.title", undefined, "App & Field Access")}</h1>
            <p className="sub" style={{ marginBottom: 16 }}>
              {t("m.onboarding.permissions.sub", undefined, "Set your language and the permissions COMPVSS uses on site. Change anytime in Settings.")}
            </p>
            <div className="field">
              <label>{t("m.onboarding.permissions.language", undefined, "Language")}</label>
              <div className="inwrap">
                <span className="lead">
                  <KIcon name="Languages" size={17} />
                </span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ paddingLeft: 40 }}>
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="pt">Português</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文 (简体)</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
            {(
              [
                ["location", "MapPin", t("m.onboarding.permissions.location", undefined, "Location"), t("m.onboarding.permissions.locationSub", undefined, "Verifies you're on-site for clock-in geofencing"), t("m.onboarding.permissions.recommended", undefined, "Recommended")],
                ["notifications", "Bell", t("m.onboarding.permissions.notifications", undefined, "Notifications"), t("m.onboarding.permissions.notificationsSub", undefined, "Shift reminders, approvals & ops alerts"), t("m.onboarding.permissions.recommended", undefined, "Recommended")],
                ["camera", "Camera", t("m.onboarding.permissions.camera", undefined, "Camera"), t("m.onboarding.permissions.cameraSub", undefined, "Scan QR credentials, assets & site documents"), t("m.onboarding.permissions.recommended", undefined, "Recommended")],
                ["bluetooth", "Bluetooth", t("m.onboarding.permissions.bluetooth", undefined, "Bluetooth / NFC"), t("m.onboarding.permissions.bluetoothSub", undefined, "Tap RFID credentials & readers"), t("m.onboarding.permissions.optional", undefined, "Optional")],
              ] as Array<[keyof Perms, string, string, string, string]>
            ).map(([k, ic, title, sub, req]) => {
              const unavailable = !permsSupport[k];
              return (
                <div className="toggle-row" key={k} style={unavailable ? { opacity: 0.55 } : undefined}>
                  <span className="ic">
                    <KIcon name={ic} size={19} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
                    <div className="muted" style={{ marginTop: 2 }}>
                      {sub}
                    </div>
                    <div className="req" style={{ marginTop: 3 }}>
                      {unavailable
                        ? t("m.onboarding.permissions.unavailable", undefined, "Unavailable on This Device")
                        : req}
                    </div>
                  </div>
                  <Toggle
                    on={perms[k]}
                    disabled={unavailable || permsBusy === k}
                    set={(v) => onTogglePerm(k, v)}
                  />
                </div>
              );
            })}
            <ErrLine msg={err} />
            <div className="spacer" />
            {cta(t("m.onboarding.permissions.cta", undefined, "Continue"), onSavePermissions, { marginTop: 16 })}
          </div>
        );

      case "welcome":
        return (
          <div className="scr center" style={{ textAlign: "center", alignItems: "center" }}>
            <div className="spacer" />
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: "color-mix(in oklab, var(--p-success) 16%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--p-success)",
              }}
            >
              <KIcon name="Check" size={48} stroke={2.5} />
            </div>
            <h1 className="h1" style={{ marginTop: 20 }}>
              {t("m.onboarding.welcome.title", undefined, "Welcome Aboard")}
            </h1>
            <p className="sub" style={{ maxWidth: 270, marginTop: 8 }}>
              {t("m.onboarding.welcome.sub", undefined, "Your COMPVSS account is set up and ready to go.")}
            </p>
            <div className="spacer" />
            {cta(t("m.onboarding.welcome.cta", undefined, "See Your Rose"), () => go("pass"))}
          </div>
        );

      case "pass":
        return (
          <div className="scr">
            <h1 className="h1">{t("m.onboarding.pass.title", undefined, "The COMPVSS Rose")}</h1>
            <p className="sub" style={{ marginBottom: 16 }}>
              {t("m.onboarding.pass.sub", undefined, "Presenting your COMPVSS Rose — the single, enduring credential that opens the entire ATLVS Ecosystem. It is issued once and carries with you for life, evolving only as your access does. Welcome to the membership.")}
            </p>
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                padding: "16px 20px",
                aspectRatio: "1.586 / 1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#fff",
                background: "linear-gradient(140deg, #2a1a09 0%, #36230d 38%, #120d08 100%)",
                border: "1px solid rgba(255,255,255,.1)",
                boxShadow: "var(--p-elev-2, var(--p-elev-1))",
                marginBottom: 8,
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(130% 90% at 100% 0%, color-mix(in oklab, var(--p-accent) 55%, transparent), transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 38%, rgba(255,255,255,.07) 50%, transparent 60%)", pointerEvents: "none" }} />
              <button
                type="button"
                onClick={toggleFlip}
                aria-label="Flip card"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 3,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,.22)",
                  background: "rgba(255,255,255,.1)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <KIcon name={flip ? "User" : "QrCode"} size={15} />
              </button>
              {flip && (
                <div
                  className="cardback"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    background: "linear-gradient(140deg, #2a1a09 0%, #36230d 38%, #120d08 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ width: "72%", height: 30, marginTop: 6, background: "repeating-linear-gradient(90deg, rgba(255,255,255,.5) 0 2px, transparent 2px 5px)", borderRadius: 2, opacity: 0.45 }} />
                  <span style={{ width: 116, height: 116, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0c0e12", padding: 8, boxSizing: "border-box" }}>
                    <QRCode value={passToken} size={100} />
                  </span>
                  <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,.7)" }}>0042 · RT4471</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)", textAlign: "center" }}>
                    {t("m.onboarding.pass.scanNote", undefined, "Scan to verify · single-use, refreshes on open")}
                  </div>
                </div>
              )}
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div className="wm" style={{ fontSize: 13, color: "rgba(255,255,255,.85)", paddingTop: 2 }}>
                    COMPVSS
                  </div>
                  <span style={{ fontFamily: "'Pinyon Script', cursive", fontSize: 44, lineHeight: 1, marginLeft: -26, marginTop: -2, background: "linear-gradient(135deg, #f4cdbf, #d9a08e 45%, #b76e79)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                    Rose
                  </span>
                </div>
              </div>
              <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-end" }}>
                <span style={{ width: 56, height: 70, borderRadius: 8, background: "linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.04))", border: "1px solid rgba(244,205,191,.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(244,205,191,.55)", flex: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)" }}>
                  <KIcon name="User" size={28} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "var(--p-mono)", fontSize: 7.5, letterSpacing: "0.22em", color: "rgba(244,205,191,.6)" }}>MEMBER</div>
                  <div style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 24, lineHeight: 1, marginTop: 3, letterSpacing: "0.01em", textShadow: "0 1px 1px rgba(0,0,0,.3)" }}>{displayName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--p-accent)" }} />
                    <span style={{ fontFamily: "var(--p-mono)", fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,.82)" }}>
                      {t("m.onboarding.pass.freeAgent", undefined, "Free Agent")}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 11 }}>
                <div>
                  <div style={{ fontFamily: "var(--p-mono)", fontSize: 8, letterSpacing: "0.16em", color: "rgba(255,255,255,.5)" }}>CREDENTIAL ID</div>
                  <div style={{ fontFamily: "var(--p-mono)", fontSize: 15, letterSpacing: "0.2em", marginTop: 3 }}>0042 · RT4471</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--p-mono)", fontSize: 8, letterSpacing: "0.16em", color: "rgba(255,255,255,.5)" }}>MEMBER SINCE</div>
                  <div style={{ fontFamily: "var(--p-mono)", fontSize: 12, letterSpacing: "0.1em", marginTop: 3 }}>06 / 26</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: "var(--p-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-text-3)", marginBottom: 8 }}>
                {t("m.onboarding.pass.howTo", undefined, "How to Use Your Rose")}
              </div>
              {(
                [
                  ["Scan", t("m.onboarding.pass.use1", undefined, "Tap or scan to enter job sites, access amenities, track assets & dispatch services")],
                  ["RefreshCw", t("m.onboarding.pass.use2", undefined, "Access updates remotely — granted, revoked or upgraded in real time")],
                  ["Infinity", t("m.onboarding.pass.use3", undefined, "Issued once, carried for life — only your access ever changes")],
                ] as Array<[string, string]>
              ).map(([ic, text]) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}>
                  <KIcon name={ic} size={16} style={{ color: "var(--p-text-2)", flex: "none" }} />
                  <span style={{ fontSize: 13 }}>{text}</span>
                </div>
              ))}
              <a href="https://compvss.com/help/pass" target="_blank" rel="noopener noreferrer" className="link" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                {t("m.onboarding.pass.faq", undefined, "Read the Full Rose FAQ")} <KIcon name="ExternalLink" size={13} />
              </a>
            </div>
            <div className="spacer" />
            {cta(t("m.onboarding.pass.cta", undefined, "Continue"), () => go("assignment"))}
          </div>
        );

      case "assignment":
        return (
          <div className="scr">
            <h1 className="h1">{t("m.onboarding.assignment.title", undefined, "Your First Assignment")}</h1>
            <p className="sub" style={{ marginBottom: 14 }}>
              {t("m.onboarding.assignment.sub", undefined, "You've been offered a role on this project. Review the offer and accept, or explore the app as a free agent.")}
            </p>
            <div className="card" style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
              <div style={{ background: "#0c0e12", color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--p-accent)", color: "#1f0e03", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--p-wordmark)", fontWeight: 500, flex: "none" }}>
                  {resolvedOffer.initials}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{resolvedOffer.project}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.7 }}>
                    {resolvedOffer.org} · {resolvedOffer.venue}
                  </div>
                </div>
              </div>
              <div style={{ padding: "4px 16px" }}>
                {(
                  [
                    ["Briefcase", t("m.onboarding.assignment.role", undefined, "Role"), resolvedOffer.role],
                    ["CalendarDays", t("m.onboarding.assignment.dates", undefined, "Dates"), resolvedOffer.dates],
                    ["DollarSign", t("m.onboarding.assignment.rate", undefined, "Rate"), resolvedOffer.rate],
                    ["Clock", t("m.onboarding.assignment.firstCall", undefined, "First call"), resolvedOffer.firstCall],
                    ["UserCheck", t("m.onboarding.assignment.reportsTo", undefined, "Reports to"), resolvedOffer.reportsTo],
                  ] as Array<[string, string, string]>
                ).map(([ic, k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: "1px solid var(--p-border)" }}>
                    <KIcon name={ic} size={17} style={{ color: "var(--p-text-3)", flex: "none" }} />
                    <span style={{ fontSize: 12, color: "var(--p-text-3)", width: 72 }}>{k}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <ErrLine msg={err} />
            <button type="button" className="ps-btn ps-btn--cta" disabled={pending} onClick={onComplete} style={{ width: "100%", justifyContent: "center" }}>
              <KIcon name="Check" size={16} /> {t("m.onboarding.assignment.accept", undefined, "Accept Assignment")}
            </button>
            <button type="button" className="sso" disabled={pending} style={{ marginTop: 8 }} onClick={onComplete}>
              <KIcon name="MessageCircle" size={16} /> {t("m.onboarding.assignment.contact", undefined, "Contact To Discuss")}
            </button>
            <button type="button" className="sso" disabled={pending} style={{ marginTop: 8 }} onClick={onComplete}>
              <KIcon name="Compass" size={16} /> {t("m.onboarding.assignment.explore", undefined, "Explore Platform")}
            </button>
            <p className="muted" style={{ marginTop: 12 }}>
              {t("m.onboarding.assignment.note", undefined, "Not ready to decide? Contact your inviter to discuss the role first. If you choose Explore Platform, this offer stays in your inbox & notifications to accept anytime.")}
            </p>
          </div>
        );

      default:
        return null;
    }
  }
}
