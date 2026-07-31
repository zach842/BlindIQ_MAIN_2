import { createClient, type User } from "@supabase/supabase-js";

export const appConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
  stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ID ?? "",
  stripeCheckoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL ?? "",
};

export const supabase =
  appConfig.supabaseUrl && appConfig.supabasePublishableKey
    ? createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey)
    : null;

export const isDemoMode = !supabase;

export function displayNameFor(user: User) {
  const username = user.user_metadata?.username;
  if (typeof username === "string" && username.trim()) return username.trim();
  return user.email?.split("@")[0] || "Hunter";
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    if (email.toLowerCase() !== "hunter" || password !== "confidence") {
      throw new Error("Incorrect username or password.");
    }
    return { id: "demo-user", name: "Hunter", email: "hunter" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { id: data.user.id, name: displayNameFor(data.user), email: data.user.email ?? email };
}

export async function signUp(username: string, email: string, password: string) {
  if (!supabase) return { id: "demo-user", name: username, email, confirmationRequired: false };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return {
    name: data.user ? displayNameFor(data.user) : username,
    id: data.user?.id ?? "",
    email,
    confirmationRequired: !data.session,
  };
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function getSubscription() {
  if (!supabase) {
    return { status: "active", isPremium: true, currentPeriodEnd: null as string | null };
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { status: "inactive", isPremium: false, currentPeriodEnd: null };
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  const status = data?.status ?? "inactive";
  return {
    status,
    isPremium: status === "active" || status === "trialing",
    currentPeriodEnd: data?.current_period_end ?? null,
  };
}

export function beginCheckout(userId: string, email: string) {
  if (appConfig.stripeCheckoutUrl) {
    const checkout = new URL(appConfig.stripeCheckoutUrl);
    if (userId && userId !== "demo-user") checkout.searchParams.set("client_reference_id", userId);
    if (email.includes("@")) checkout.searchParams.set("prefilled_email", email);
    window.location.href = checkout.toString();
    return;
  }
  return "demo";
}
