import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  // Deep links through auth carry their destination as ?next= (legacy
  // callers used ?redirect=). Validated again server-side in loginAction
  // and /auth/resolve — this is just plumbing it into the form.
  const next = sp.next ?? sp.redirect ?? null;
  return <LoginForm next={next} />;
}
