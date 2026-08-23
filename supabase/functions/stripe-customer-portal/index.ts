import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Sign in before managing a membership." }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return json({ error: "Your session has expired. Sign in again." }, 401);
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error(subscriptionError);
    return json({ error: "BlindIQ could not load this membership." }, 500);
  }
  if (!subscription?.stripe_customer_id) {
    return json({ error: "Complete Stripe checkout before managing this membership." }, 409);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const appUrl = Deno.env.get("BLINDIQ_APP_URL") ?? "https://blindiq.app";
  if (!stripeSecretKey) {
    return json({ error: "Stripe membership management is not configured." }, 500);
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: appUrl,
    });
    return json({ url: portal.url });
  } catch (error) {
    console.error(error);
    return json({ error: "Stripe could not open membership management." }, 500);
  }
});
