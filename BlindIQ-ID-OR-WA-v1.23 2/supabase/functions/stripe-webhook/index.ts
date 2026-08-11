import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@^2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

async function rowFromSubscription(
  subscription: Stripe.Subscription,
  userId: string,
): Promise<SubscriptionRow> {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return {
    user_id: userId,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id ?? null,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

async function upsertFromCheckout(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId || !session.subscription) {
    throw new Error("Checkout session is missing user or subscription reference.");
  }
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const row = await rowFromSubscription(subscription, userId);
  const { error } = await supabase.from("subscriptions").upsert(row);
  if (error) throw error;
}

async function updateExistingSubscription(subscription: Stripe.Subscription) {
  const { data: existing, error: findError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (findError) throw findError;
  if (!existing?.user_id) return;
  const row = await rowFromSubscription(subscription, existing.user_id);
  const { error } = await supabase.from("subscriptions").upsert(row);
  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    return new Response(`Invalid Stripe signature: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await upsertFromCheckout(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await updateExistingSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error(error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
