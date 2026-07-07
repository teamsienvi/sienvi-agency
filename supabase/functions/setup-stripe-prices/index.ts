import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Starting Stripe products and prices setup...");

    const createdPrices: Record<string, string> = {};

    // ============================================
    // 1. AMAZON DESIGN PACKAGE ($999/mo)
    // ============================================
    console.log("Creating Amazon Design Package product...");
    const amazonProduct = await stripe.products.create({
      name: "Amazon Design Package",
      description: "Complete Amazon listing design and optimization package including main images, A+ content, and listing optimization.",
      metadata: {
        service_id: "amazon-design",
        category: "premium",
      },
    });

    const amazonPrice = await stripe.prices.create({
      product: amazonProduct.id,
      unit_amount: 99900, // $999.00 in cents
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Amazon Design Package - Monthly",
      metadata: {
        service_id: "amazon-design",
      },
    });
    createdPrices["amazon-design"] = amazonPrice.id;
    console.log(`✓ Amazon Design Package: ${amazonPrice.id}`);

    // ============================================
    // 2. ADVERTISING PACKAGE (1-7 channels)
    // ============================================
    console.log("Creating Advertising Package product...");
    const advertisingProduct = await stripe.products.create({
      name: "Advertising Package",
      description: "Multi-channel advertising management across Meta, Google, TikTok, Amazon, Pinterest, Snapchat, and LinkedIn.",
      metadata: {
        service_id: "advertising",
        category: "advertising",
      },
    });

    // Individual channel pricing ($999/channel)
    const channelPricing = [
      { channels: 1, amount: 99900, nickname: "1 Channel" },
      { channels: 2, amount: 199800, nickname: "2 Channels" },
      // Bundle pricing (3+ channels at ~$493/channel)
      { channels: 3, amount: 147900, nickname: "3 Channels Bundle" },
      { channels: 4, amount: 197100, nickname: "4 Channels Bundle" },
      { channels: 5, amount: 246400, nickname: "5 Channels Bundle" },
      { channels: 6, amount: 295700, nickname: "6 Channels Bundle" },
      { channels: 7, amount: 345000, nickname: "All 7 Channels Bundle" },
    ];

    for (const pricing of channelPricing) {
      const price = await stripe.prices.create({
        product: advertisingProduct.id,
        unit_amount: pricing.amount,
        currency: "usd",
        recurring: { interval: "month" },
        nickname: pricing.nickname,
        metadata: {
          channel_count: pricing.channels.toString(),
          is_bundle: pricing.channels >= 3 ? "true" : "false",
        },
      });
      createdPrices[`advertising-${pricing.channels}`] = price.id;
      console.log(`✓ Advertising ${pricing.nickname}: ${price.id}`);
    }

    // ============================================
    // 3. STANDARD AUTOMATION SERVICES ($888/mo each)
    // ============================================
    console.log("Creating Standard Automation Services product...");
    const automationProduct = await stripe.products.create({
      name: "Automation Service",
      description: "Standard automation services including Custom Website, SEO/AEO, and Custom AI Assistant.",
      metadata: {
        category: "automation",
      },
    });

    const automationPrice = await stripe.prices.create({
      product: automationProduct.id,
      unit_amount: 88800, // $888.00 in cents
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Standard Automation Service - Monthly",
      metadata: {
        tier: "standard",
      },
    });
    createdPrices["standard-automation"] = automationPrice.id;
    console.log(`✓ Standard Automation: ${automationPrice.id}`);

    // ============================================
    // 4. PREMIUM SERVICES ($2,450/mo each)
    // ============================================
    console.log("Creating Premium Services...");
    
    // Social Media Suite
    const socialMediaProduct = await stripe.products.create({
      name: "Social Media Suite",
      description: "Complete social media management and automation suite.",
      metadata: {
        service_id: "social-media-suite",
        category: "premium",
      },
    });

    const socialMediaPrice = await stripe.prices.create({
      product: socialMediaProduct.id,
      unit_amount: 245000, // $2,450.00 in cents
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Social Media Suite - Monthly",
      metadata: {
        service_id: "social-media-suite",
      },
    });
    createdPrices["social-media-suite"] = socialMediaPrice.id;
    console.log(`✓ Social Media Suite: ${socialMediaPrice.id}`);

    // Custom LMS
    const lmsProduct = await stripe.products.create({
      name: "Custom LMS Package",
      description: "Custom Learning Management System development and setup.",
      metadata: {
        service_id: "custom-lms",
        category: "premium",
      },
    });

    const lmsPrice = await stripe.prices.create({
      product: lmsProduct.id,
      unit_amount: 245000, // $2,450.00 in cents
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Custom LMS Package - Monthly",
      metadata: {
        service_id: "custom-lms",
      },
    });
    createdPrices["custom-lms"] = lmsPrice.id;
    console.log(`✓ Custom LMS: ${lmsPrice.id}`);

    // ============================================
    // 5. BUNDLE PLANS
    // ============================================
    console.log("Creating Bundle Plans...");

    // Single Plan ($888/mo)
    const singleProduct = await stripe.products.create({
      name: "Single Automation Plan",
      description: "One automation service of your choice.",
      metadata: {
        plan: "single",
      },
    });

    const singlePrice = await stripe.prices.create({
      product: singleProduct.id,
      unit_amount: 88800,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Single Plan - Monthly",
    });
    createdPrices["bundle-single"] = singlePrice.id;
    console.log(`✓ Single Plan: ${singlePrice.id}`);

    // Triple Plan ($2,664/mo)
    const tripleProduct = await stripe.products.create({
      name: "Triple Automation Plan",
      description: "Three automation services bundled together.",
      metadata: {
        plan: "triple",
      },
    });

    const triplePrice = await stripe.prices.create({
      product: tripleProduct.id,
      unit_amount: 266400,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Triple Plan - Monthly",
    });
    createdPrices["bundle-triple"] = triplePrice.id;
    console.log(`✓ Triple Plan: ${triplePrice.id}`);

    // Full Plan ($3,996/mo)
    const fullProduct = await stripe.products.create({
      name: "Full Automation Suite",
      description: "All standard automation services included.",
      metadata: {
        plan: "full",
      },
    });

    const fullPrice = await stripe.prices.create({
      product: fullProduct.id,
      unit_amount: 399600,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Full Automation Suite - Monthly",
    });
    createdPrices["bundle-full"] = fullPrice.id;
    console.log(`✓ Full Plan: ${fullPrice.id}`);

    console.log("\n========================================");
    console.log("STRIPE SETUP COMPLETE!");
    console.log("========================================\n");
    console.log("Copy these price IDs to src/data/stripePrices.ts:\n");
    console.log(JSON.stringify(createdPrices, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: "All Stripe products and prices created successfully!",
        priceIds: createdPrices,
        instructions: "Copy these price IDs to src/data/stripePrices.ts",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
