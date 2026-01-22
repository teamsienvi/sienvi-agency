import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// STRIPE PRICE IDS (Test Mode)
// ============================================

// Bundle plans
const BUNDLE_PRICE_IDS: Record<string, string> = {
  single: "price_1SpbnaDnw1azoLSpAmnnUwMX",
  triple: "price_1Spbo0Dnw1azoLSpUgAdICKR",
  full: "price_1SpboRDnw1azoLSpG07N2lA0",
};

// Individual service prices
const SERVICE_PRICE_IDS: Record<string, string> = {
  "custom-website": "price_1SpbnaDnw1azoLSpAmnnUwMX",
  "seo-aeo": "price_1SpbnaDnw1azoLSpAmnnUwMX",
  "custom-ai-assistant": "price_1SpbnaDnw1azoLSpAmnnUwMX",
  "amazon-design": "price_1Sq8qQDnw1azoLSpNJgw6Lzd",        // $999/mo
  "social-media-suite": "price_1Sq8qrDnw1azoLSpFzRt8BWN",   // $2,450/mo
  "custom-lms": "price_1Sq8r5Dnw1azoLSpQF19zfYf",           // $2,450/mo
};

// Advertising pricing by channel count
const ADVERTISING_PRICE_IDS: Record<number, string> = {
  1: "price_1Sq8raDnw1azoLSpX1Channel1",  // 1 channel = $888
  2: "price_1Sq8rbDnw1azoLSpX2Channel2",  // 2 channels = $1,776
  3: "price_1Sq8rcDnw1azoLSpX3Channels",  // 3 channels = $1,479 (bundle)
  4: "price_1Sq8rdDnw1azoLSpX4Channels",  // 4 channels = $1,971 (bundle)
  5: "price_1Sq8reDnw1azoLSpX5Channels",  // 5 channels = $2,464 (bundle)
  6: "price_1Sq8rfDnw1azoLSpX6Channels",  // 6 channels = $2,957 (bundle)
  7: "price_1Sq8rgDnw1azoLSpAllChannels", // 7 channels = $3,450 (all)
};

// Pricing constants for dynamic price creation (fallback)
const PRICING = {
  PER_CHANNEL: 888,
  ALL_CHANNELS: 3450,
  CHANNEL_COUNT: 7,
  BUNDLE_THRESHOLD: 3,
  AMAZON_DESIGN: 999,
  PREMIUM_SERVICE: 2450,
  SINGLE_SERVICE: 888,
};

// Calculate advertising cost
const calculateAdvertisingCost = (channelCount: number): { total: number; savings: number } => {
  if (channelCount <= 0) return { total: 0, savings: 0 };
  
  const baseTotal = channelCount * PRICING.PER_CHANNEL;
  const perChannelBundled = PRICING.ALL_CHANNELS / PRICING.CHANNEL_COUNT;
  
  if (channelCount < PRICING.BUNDLE_THRESHOLD) {
    return { total: baseTotal, savings: 0 };
  }
  
  const bundledTotal = Math.round(channelCount * perChannelBundled);
  return { total: bundledTotal, savings: baseTotal - bundledTotal };
};

// Get service price
const getServicePrice = (serviceId: string): number => {
  switch (serviceId) {
    case "amazon-design":
      return PRICING.AMAZON_DESIGN;
    case "social-media-suite":
    case "custom-lms":
      return PRICING.PREMIUM_SERVICE;
    default:
      return PRICING.SINGLE_SERVICE;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const { priceId, selectedServices, advertisingChannels, plan, isAdvertisingOnly } = await req.json();
    const origin = req.headers.get("origin") || "https://sienvi-agency-landing-page.lovable.app";

    // ========================================
    // ADVERTISING-ONLY CHECKOUT
    // ========================================
    if (isAdvertisingOnly) {
      if (!advertisingChannels || advertisingChannels.length === 0) {
        return new Response(
          JSON.stringify({ error: "At least one advertising channel is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const channelCount = Math.min(advertisingChannels.length, 7);
      const { total, savings } = calculateAdvertisingCost(channelCount);

      console.log(`Advertising checkout: ${channelCount} channels, total: $${total}, savings: $${savings}`);

      // Create customer
      const customer = await stripe.customers.create({
        metadata: { source: "checkout_session", plan: "advertising" },
      });

      // Try to use predefined price, fall back to dynamic
      let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
      const predefinedPriceId = ADVERTISING_PRICE_IDS[channelCount];

      if (predefinedPriceId) {
        console.log(`Using predefined advertising price ID: ${predefinedPriceId}`);
        lineItems = [{ price: predefinedPriceId, quantity: 1 }];
      } else {
        // Fallback: create dynamic price
        console.log(`Creating dynamic price for ${channelCount} channels at $${total}/mo`);
        const dynamicPrice = await stripe.prices.create({
          unit_amount: total * 100,
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})${savings > 0 ? ' - Bundle Savings' : ''}`,
          },
        });
        lineItems = [{ price: dynamicPrice.id, quantity: 1 }];
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customer.id,
        line_items: lineItems,
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

    // ========================================
    // SINGLE SERVICE CHECKOUT (with specific service)
    // ========================================
    const isSingleServicePurchase = plan === "single" && selectedServices && selectedServices.length === 1;
    const singleServiceId = isSingleServicePurchase ? selectedServices[0] : null;

    if (isSingleServicePurchase && singleServiceId) {
      const servicePriceId = SERVICE_PRICE_IDS[singleServiceId];
      const servicePrice = getServicePrice(singleServiceId);

      console.log(`Single service checkout: ${singleServiceId}, price: $${servicePrice}/mo`);

      const customer = await stripe.customers.create({
        metadata: { source: "checkout_session", plan: "single", service: singleServiceId },
      });

      let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

      if (servicePriceId) {
        console.log(`Using predefined service price ID: ${servicePriceId}`);
        lineItems = [{ price: servicePriceId, quantity: 1 }];
      } else {
        // Fallback: create dynamic price
        console.log(`Creating dynamic price for ${singleServiceId} at $${servicePrice}/mo`);
        const dynamicPrice = await stripe.prices.create({
          unit_amount: servicePrice * 100,
          currency: "usd",
          recurring: { interval: "month" },
          product_data: { name: `${singleServiceId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Package` },
        });
        lineItems = [{ price: dynamicPrice.id, quantity: 1 }];
      }

      // Add advertising if selected
      if (advertisingChannels && advertisingChannels.length > 0) {
        const channelCount = Math.min(advertisingChannels.length, 7);
        const { total, savings } = calculateAdvertisingCost(channelCount);
        const adPriceId = ADVERTISING_PRICE_IDS[channelCount];

        if (adPriceId) {
          lineItems.push({ price: adPriceId, quantity: 1 });
        } else {
          const adPrice = await stripe.prices.create({
            unit_amount: total * 100,
            currency: "usd",
            recurring: { interval: "month" },
            product_data: {
              name: `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})${savings > 0 ? ' - Bundle Savings' : ''}`,
            },
          });
          lineItems.push({ price: adPrice.id, quantity: 1 });
        }
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

      console.log(`Single service checkout session created: ${session.id}`);
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // BUNDLE PLAN CHECKOUT (triple, full)
    // ========================================
    const bundlePriceId = priceId || BUNDLE_PRICE_IDS[plan];
    if (!bundlePriceId) {
      console.error(`Invalid plan or missing priceId: ${plan}`);
      return new Response(
        JSON.stringify({ error: "Invalid plan or priceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Bundle checkout: plan=${plan}, priceId=${bundlePriceId}`);

    const customer = await stripe.customers.create({
      metadata: { source: "checkout_session", plan: plan },
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: bundlePriceId, quantity: 1 },
    ];

    // Add advertising if selected
    if (advertisingChannels && advertisingChannels.length > 0) {
      const channelCount = Math.min(advertisingChannels.length, 7);
      const { total, savings } = calculateAdvertisingCost(channelCount);
      const adPriceId = ADVERTISING_PRICE_IDS[channelCount];

      console.log(`Adding advertising: ${channelCount} channels, total: $${total}`);

      if (adPriceId) {
        lineItems.push({ price: adPriceId, quantity: 1 });
      } else {
        const adPrice = await stripe.prices.create({
          unit_amount: total * 100,
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: `Advertising Package (${channelCount} Channel${channelCount > 1 ? 's' : ''})${savings > 0 ? ' - Bundle Savings' : ''}`,
          },
        });
        lineItems.push({ price: adPrice.id, quantity: 1 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: lineItems,
      metadata: {
        product: "sienvi_automation",
        plan: plan,
        selected_services: selectedServices ? JSON.stringify(selectedServices) : "",
        advertising_channels: advertisingChannels ? JSON.stringify(advertisingChannels) : "",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/select-services?plan=${plan}`,
    });

    console.log(`Bundle checkout session created: ${session.id}`);
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
