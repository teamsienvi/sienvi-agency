import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price ID to plan mapping (Test Mode) - for bundle plans
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1SpbnaDnw1azoLSpAmnnUwMX": "single",
  "price_1Spbo0Dnw1azoLSpUgAdICKR": "triple",
  "price_1SpboRDnw1azoLSpG07N2lA0": "full",
};

// Service-specific pricing (in dollars)
const SERVICE_PRICES: Record<string, { price: number; name: string }> = {
  "amazon-design": { price: 999, name: "Amazon Design Package" },
  "custom-website": { price: 888, name: "Custom Website Development" },
  "seo-aeo": { price: 888, name: "SEO/AEO Package" },
  "custom-ai-assistant": { price: 888, name: "Custom AI Assistant" },
  "social-media-suite": { price: 2450, name: "Social Media Suite" },
  "custom-lms": { price: 2450, name: "Custom LMS Package" },
};

// Advertising pricing constants
const PRICE_PER_CHANNEL = 888;
const TOTAL_CHANNELS = 7;
const ALL_CHANNELS_PRICE = 3450; // Total price for all 7 channels
const AD_BUNDLE_THRESHOLD = 3;
const PRICE_PER_CHANNEL_BUNDLED = ALL_CHANNELS_PRICE / TOTAL_CHANNELS; // ~$492.86

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { priceId, selectedServices, advertisingChannels, plan, isAdvertisingOnly } = await req.json();

    const origin = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";

    // For advertising-only checkout
    if (isAdvertisingOnly) {
      if (!advertisingChannels || advertisingChannels.length === 0) {
        return new Response(
          JSON.stringify({ error: "At least one advertising channel is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const channelCount = advertisingChannels.length;
      const baseTotal = channelCount * PRICE_PER_CHANNEL;
      const hasSavings = channelCount >= AD_BUNDLE_THRESHOLD;
      const finalTotal = hasSavings 
        ? Math.round(channelCount * PRICE_PER_CHANNEL_BUNDLED) 
        : baseTotal;
      const savings = hasSavings ? baseTotal - finalTotal : 0;

      console.log(`Creating advertising-only checkout: ${channelCount} channels, base: $${baseTotal}, savings: $${savings}, final: $${finalTotal}`);

      const customer = await stripe.customers.create({
        metadata: {
          source: "checkout_session",
          plan: "advertising",
        },
      });

      const price = await stripe.prices.create({
        unit_amount: finalTotal * 100,
        currency: "usd",
        recurring: { interval: "month" },
        product_data: {
          name: `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})${hasSavings ? ' - Bundle Savings Applied' : ''}`,
        },
      });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customer.id,
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: {
          product: "sienvi_advertising",
          plan: "advertising",
          advertising_channels: JSON.stringify(advertisingChannels),
          channel_count: channelCount.toString(),
          savings_applied: savings.toString(),
        },
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/#advertising`,
      });

      console.log(`Advertising checkout session created: ${session.id}`);

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a single service purchase with specific pricing
    const isSingleServicePurchase = plan === "single" && selectedServices && selectedServices.length === 1;
    const singleServiceId = isSingleServicePurchase ? selectedServices[0] : null;
    const serviceConfig = singleServiceId ? SERVICE_PRICES[singleServiceId] : null;

    // If it's a service with custom pricing (like Amazon Design), use dynamic pricing
    if (isSingleServicePurchase && serviceConfig) {
      console.log(`Creating dynamic checkout for ${serviceConfig.name} at $${serviceConfig.price}/mo`);

      const customer = await stripe.customers.create({
        metadata: {
          source: "checkout_session",
          plan: "single",
          service: singleServiceId,
        },
      });

      console.log(`Created Stripe customer: ${customer.id}`);

      // Create dynamic price for the specific service
      const dynamicPrice = await stripe.prices.create({
        unit_amount: serviceConfig.price * 100, // Convert to cents
        currency: "usd",
        recurring: { interval: "month" },
        product_data: {
          name: serviceConfig.name,
        },
      });

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        { price: dynamicPrice.id, quantity: 1 },
      ];

      // Add advertising channels if selected
      if (advertisingChannels && advertisingChannels.length > 0) {
        const channelCount = advertisingChannels.length;
        const baseTotal = channelCount * PRICE_PER_CHANNEL;
        const hasSavings = channelCount >= AD_BUNDLE_THRESHOLD;
        const adFinalTotal = hasSavings 
          ? Math.round(channelCount * PRICE_PER_CHANNEL_BUNDLED) 
          : baseTotal;

        console.log(`Adding advertising channels: ${channelCount} channels, total: $${adFinalTotal}`);

        const adPrice = await stripe.prices.create({
          unit_amount: adFinalTotal * 100,
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})${hasSavings ? ' - Bundle Savings Applied' : ''}`,
          },
        });

        lineItems.push({ price: adPrice.id, quantity: 1 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customer.id,
        line_items: lineItems,
        metadata: {
          product: "sienvi_automation",
          plan: "single",
          service: singleServiceId,
          selected_services: JSON.stringify(selectedServices),
          advertising_channels: advertisingChannels ? JSON.stringify(advertisingChannels) : "",
        },
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout-summary?plan=single&service=${singleServiceId}`,
      });

      console.log(`Single service checkout session created: ${session.id} for ${serviceConfig.name}`);

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard bundle plan checkout (triple, full, or single with priceId)
    if (!priceId) {
      console.error("Missing priceId in request body for bundle plan");
      return new Response(
        JSON.stringify({ error: "priceId is required for bundle plans" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate price ID
    const planFromPrice = PRICE_TO_PLAN[priceId];
    if (!planFromPrice) {
      console.error(`Invalid priceId: ${priceId}`);
      return new Response(
        JSON.stringify({ error: "Invalid priceId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating checkout session for plan: ${planFromPrice}, priceId: ${priceId}, services: ${selectedServices?.join(', ')}`);

    const customer = await stripe.customers.create({
      metadata: {
        source: "checkout_session",
        plan: plan || planFromPrice,
      },
    });

    console.log(`Created Stripe customer: ${customer.id}`);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    // If advertising channels are selected, add them as a separate line item
    if (advertisingChannels && advertisingChannels.length > 0) {
      const channelCount = advertisingChannels.length;
      const baseTotal = channelCount * PRICE_PER_CHANNEL;
      const hasSavings = channelCount >= AD_BUNDLE_THRESHOLD;
      const finalTotal = hasSavings 
        ? Math.round(channelCount * PRICE_PER_CHANNEL_BUNDLED) 
        : baseTotal;
      const savings = hasSavings ? baseTotal - finalTotal : 0;

      console.log(`Adding advertising channels: ${channelCount} channels, savings: $${savings}, total: $${finalTotal}`);

      const adPrice = await stripe.prices.create({
        unit_amount: finalTotal * 100,
        currency: "usd",
        recurring: { interval: "month" },
        product_data: {
          name: `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})${hasSavings ? ' - Bundle Savings Applied' : ''}`,
        },
      });

      lineItems.push({ price: adPrice.id, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: lineItems,
      metadata: {
        product: "sienvi_automation",
        plan: plan || planFromPrice,
        selected_services: selectedServices ? JSON.stringify(selectedServices) : "",
        advertising_channels: advertisingChannels ? JSON.stringify(advertisingChannels) : "",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/select-services?plan=${plan || planFromPrice}`,
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
