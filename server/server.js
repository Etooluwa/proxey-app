import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY. Add it to server/.env before starting the server."
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
});

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

const app = express();
app.use(cors());

const jsonMiddleware = express.json();
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    jsonMiddleware(req, res, next);
  }
});

app.get("/", (req, res) => {
  res.send("Booking App Backend Running 🚀");
});

// Service categories endpoint
const SERVICE_CATEGORIES = [
  { id: "home-cleaning", label: "Home & Cleaning" },
  { id: "beauty-personal-care", label: "Beauty & Personal Care" },
  { id: "health-wellness", label: "Health & Wellness" },
  { id: "events-entertainment", label: "Events & Entertainment" },
  { id: "trades-repair", label: "Trades & Repair" },
  { id: "auto-services", label: "Auto Services" },
  { id: "business-services", label: "Business Services" },
  { id: "child-pet-care", label: "Child & Pet Care" },
  { id: "delivery-errands", label: "Delivery & Errands" },
  { id: "creative-specialty", label: "Creative & Specialty" },
];

app.get("/api/categories", (req, res) => {
  res.status(200).json({ categories: SERVICE_CATEGORIES });
});

const memoryStore = {
  services: [
    {
      id: "svc-home-clean",
      name: "Home Cleaning",
      description: "Thorough cleaning for condos, apartments, and houses.",
      category: "Home",
      basePrice: 12000,
      unit: "per visit",
      duration: 120,
    },
    {
      id: "svc-personal-training",
      name: "Personal Training",
      description: "One-on-one fitness session tailored to your goals.",
      category: "Wellness",
      basePrice: 9000,
      unit: "per hour",
      duration: 60,
    },
    {
      id: "svc-mobile-barber",
      name: "Mobile Barber",
      description: "Professional haircut and grooming at your location.",
      category: "Grooming",
      basePrice: 6500,
      unit: "per visit",
      duration: 45,
    },
  ],
  providers: [
    {
      id: "prov-ella-hughes",
      name: "Ella Hughes",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
      rating: 4.9,
      reviewCount: 184,
      location: "Toronto, ON",
      categories: ["Home", "Cleaning"],
      hourlyRate: 4500,
      headline: "Luxury home cleaning specialist",
      servicesOffered: ["svc-home-clean"],
    },
    {
      id: "prov-malik-thomas",
      name: "Malik Thomas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      rating: 4.7,
      reviewCount: 96,
      location: "Mississauga, ON",
      categories: ["Wellness"],
      hourlyRate: 5500,
      headline: "Certified personal trainer & nutrition coach",
      servicesOffered: ["svc-personal-training"],
    },
    {
      id: "prov-amelia-chan",
      name: "Amelia Chan",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      rating: 4.8,
      reviewCount: 72,
      location: "Brampton, ON",
      categories: ["Grooming"],
      hourlyRate: 4000,
      headline: "Mobile barber serving the GTA",
      servicesOffered: ["svc-mobile-barber"],
    },
  ],
  bookings: [],
  providerProfiles: [
    {
      providerId: "prov-ella-hughes",
      name: "Ella Hughes",
      phone: "+1 (437) 555-0123",
      categories: ["Home Cleaning", "Organization"],
      hourlyRate: 6500,
      hourly_rate: 6500,
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
      bio: "Luxury home cleaning specialist serving downtown Toronto and midtown.",
      schedule: [
        { day: "Monday", startTime: "09:00", endTime: "17:00", available: true },
        { day: "Wednesday", startTime: "10:00", endTime: "18:00", available: true },
        { day: "Friday", startTime: "09:00", endTime: "15:00", available: true },
      ],
    },
  ],
  providerJobs: [
    {
      id: "job-001",
      providerId: "prov-ella-hughes",
      clientName: "Michael Green",
      serviceName: "Deep Clean",
      status: "active",
      scheduledAt: hoursFromNow(2),
      price: 18000,
      location: "92 Wellington St W, Toronto",
      notes: "Focus on kitchen appliances.",
    },
    {
      id: "job-002",
      providerId: "prov-ella-hughes",
      clientName: "Sarah Lee",
      serviceName: "Move-out Clean",
      status: "pending",
      scheduledAt: hoursFromNow(28),
      price: 24000,
      location: "18 York St, Toronto",
      notes: "Client requested eco-friendly products.",
    },
    {
      id: "job-003",
      providerId: "prov-ella-hughes",
      clientName: "Daniel Kim",
      serviceName: "Standard Clean",
      status: "completed",
      scheduledAt: hoursFromNow(-20),
      price: 12000,
      location: "78 King St E, Toronto",
      notes: "Left key with concierge.",
    },
  ],
  providerEarnings: [
    {
      providerId: "prov-ella-hughes",
      totalEarned: 428000,
      pendingPayout: 54000,
      transactions: [
        {
          id: "txn-1001",
          jobId: "job-003",
          date: hoursFromNow(-20),
          amount: 12000,
          clientName: "Daniel Kim",
        },
        {
          id: "txn-1000",
          jobId: "job-099",
          date: hoursFromNow(-70),
          amount: 16000,
          clientName: "Jennifer Brown",
        },
      ],
    },
  ],
};

function getUserId(req) {
  return req.headers["x-user-id"] || "demo-user";
}

function getProviderId(req) {
  return req.headers["x-provider-id"] || getUserId(req);
}

function hoursFromNow(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

if (memoryStore.bookings.length === 0) {
  memoryStore.bookings.push(
    {
      id: "bk-demo-upcoming",
      userId: "demo-user",
      providerId: "prov-ella-hughes",
      serviceId: "svc-home-clean",
      status: "upcoming",
      scheduledAt: hoursFromNow(48),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: "123 Queen St W, Toronto, ON",
      notes: "Please focus on kitchen and living room.",
      price: 14000,
    },
    {
      id: "bk-demo-past",
      userId: "demo-user",
      providerId: "prov-malik-thomas",
      serviceId: "svc-personal-training",
      status: "completed",
      scheduledAt: hoursFromNow(-72),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: "Condo gym, 54 Adelaide St",
      notes: "Bring resistance bands.",
      price: 9000,
    }
  );
}

app.post("/api/create-checkout-session", async (req, res) => {
  const {
    serviceName,
    amount,
    currency = "usd",
    bookingId,
    providerId,
    successUrl,
    cancelUrl,
    customerEmail,
  } = req.body;

  if (!serviceName || !amount) {
    return res.status(400).json({
      error: "serviceName and amount are required to create a checkout session.",
    });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      error:
        "amount must be a positive integer representing the amount in the smallest currency unit (for USD, cents).",
    });
  }

  try {
    const metadata = {};
    if (bookingId) metadata.bookingId = String(bookingId);
    if (providerId) metadata.providerId = String(providerId);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: serviceName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata,
      client_reference_id: bookingId ? String(bookingId) : undefined,
      // Optional Stripe Connect example (uncomment when providers use Express accounts):
      // transfer_data: {
      //   destination: providerStripeAccountId,
      // },
      // application_fee_amount: Math.round(amount * 0.2), // e.g. 20% platform fee
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.FRONTEND_URL}/cancel?booking_id=${bookingId}`,
    });

    console.log(
      `[stripe] Created checkout session ${session.id} for booking ${bookingId || "N/A"}`
    );

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("[stripe] Failed to create checkout session", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/services", async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("services").select("*");
      if (error) {
        console.warn("[supabase] Failed to load services, using stub.", error);
      } else {
        return res.status(200).json({ services: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching services", error);
    }
  }

  res.status(200).json({ services: memoryStore.services });
});

app.get("/api/providers", async (req, res) => {
  const { category, minPrice, maxPrice, minRating } = req.query;

  if (supabase) {
    try {
      let query = supabase.from("providers").select("*");
      if (category) {
        query = query.contains("categories", [category]);
      }
      if (minRating) {
        query = query.gte("rating", Number(minRating));
      }
      if (minPrice) {
        query = query.gte("hourly_rate", Number(minPrice));
      }
      if (maxPrice) {
        query = query.lte("hourly_rate", Number(maxPrice));
      }
      const { data, error } = await query;
      if (error) {
        console.warn("[supabase] Failed to load providers, using stub.", error);
      } else {
        return res.status(200).json({ providers: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching providers", error);
    }
  }

  const providers = memoryStore.providers.filter((provider) => {
    const matchesCategory = category
      ? provider.categories.includes(String(category))
      : true;
    const matchesRating = minRating ? provider.rating >= Number(minRating) : true;
    const matchesMinPrice = minPrice
      ? provider.hourlyRate >= Number(minPrice)
      : true;
    const matchesMaxPrice = maxPrice
      ? provider.hourlyRate <= Number(maxPrice)
      : true;
    return matchesCategory && matchesRating && matchesMinPrice && matchesMaxPrice;
  });

  res.status(200).json({ providers });
});

app.get("/api/bookings/me", async (req, res) => {
  const userId = getUserId(req);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        console.warn("[supabase] Failed to load bookings, using stub.", error);
      } else {
        return res.status(200).json({ bookings: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching bookings", error);
    }
  }

  const bookings = memoryStore.bookings.filter(
    (booking) => booking.userId === userId
  );
  res.status(200).json({ bookings });
});

app.post("/api/bookings", async (req, res) => {
  const userId = getUserId(req);
  const {
    serviceId,
    providerId,
    scheduledAt,
    location,
    notes,
    status = "draft",
    price,
  } = req.body || {};

  if (!serviceId || !providerId || !scheduledAt) {
    return res.status(400).json({
      error: "serviceId, providerId, and scheduledAt are required.",
    });
  }

  const now = new Date().toISOString();
  const booking = {
    id: crypto.randomUUID(),
    userId,
    serviceId,
    providerId,
    scheduledAt,
    location: location || "",
    notes: notes || "",
    status,
    createdAt: now,
    updatedAt: now,
    price: price ?? null,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          id: booking.id,
          user_id: booking.userId,
          service_id: booking.serviceId,
          provider_id: booking.providerId,
          scheduled_at: booking.scheduledAt,
          location: booking.location,
          notes: booking.notes,
          status: booking.status,
          price: booking.price,
        })
        .select()
        .single();

      if (error) {
        console.warn("[supabase] Failed to create booking, using stub.", error);
      } else {
        return res.status(201).json({ booking: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error creating booking", error);
    }
  }

  memoryStore.bookings.push(booking);
  res.status(201).json({ booking });
});

app.patch("/api/bookings/:id/cancel", async (req, res) => {
  const bookingId = req.params.id;
  const userId = getUserId(req);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", bookingId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.warn("[supabase] Failed to cancel booking, using stub.", error);
      } else if (!data) {
        return res.status(404).json({ error: "Booking not found." });
      } else {
        return res.status(200).json({ booking: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error cancelling booking", error);
    }
  }

  const booking = memoryStore.bookings.find(
    (item) => item.id === bookingId && item.userId === userId
  );

  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }

  booking.status = "cancelled";
  booking.updatedAt = new Date().toISOString();

  res.status(200).json({ booking });
});

app.post("/api/payments/create-checkout", async (req, res) => {
  const { bookingId, successUrl, cancelUrl } = req.body || {};
  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required." });
  }

  const booking =
    memoryStore.bookings.find((item) => item.id === bookingId) || null;

  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }

  const service =
    memoryStore.services.find((item) => item.id === booking.serviceId) || {};

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: service?.name || "Booking Payment",
              description: service?.description,
            },
            unit_amount: booking.price || 1000,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        providerId: booking.providerId,
      },
      client_reference_id: bookingId,
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.FRONTEND_URL}/cancel?booking_id=${bookingId}`,
    });

    res.status(200).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[stripe] Failed to create checkout session", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/bookings/:id", async (req, res) => {
  const bookingId = req.params.id;

  if (!supabase) {
    return res
      .status(500)
      .json({ error: "Supabase client is not configured on the server." });
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        service_name,
        service_title,
        service_description,
        amount_due,
        amount_total,
        amount,
        price,
        currency,
        provider_id,
        providerId,
        client_email,
        customer_email,
        customerEmail,
        status
      `
      )
      .eq("id", bookingId)
      .single();

    if (error) {
      console.error(`[supabase] Failed to load booking ${bookingId}:`, error);
      return res.status(500).json({
        error: `Failed to load booking ${bookingId}.`,
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const normalized = normalizeBooking(data);
    res.status(200).json({ booking: normalized });
  } catch (err) {
    console.error(`[supabase] Unexpected error fetching booking ${bookingId}`, err);
    res.status(500).json({ error: "Unexpected error fetching booking." });
  }
});

app.get("/api/provider/jobs", async (req, res) => {
  const providerId = getProviderId(req);
  const { status } = req.query;

  if (supabase) {
    try {
      let query = supabase
        .from("provider_jobs")
        .select("*")
        .eq("provider_id", providerId)
        .order("scheduled_at", { ascending: true });
      if (status && status !== "today") {
        query = query.eq("status", status);
      }
      if (status === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query = query
          .gte("scheduled_at", start.toISOString())
          .lt("scheduled_at", end.toISOString());
      }
      const { data, error } = await query;
      if (error) {
        console.warn("[supabase] Failed to load provider jobs, using stub.", error);
      } else {
        return res.status(200).json({ jobs: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider jobs", error);
    }
  }

  const jobs = memoryStore.providerJobs.filter((job) => {
    const matchesProvider = job.providerId === providerId;
    let matchesStatus = true;
    if (status && status !== "today") {
      matchesStatus = job.status === status;
    }
    if (status === "today") {
      const scheduled = new Date(job.scheduledAt);
      const now = new Date();
      matchesStatus =
        scheduled.getDate() === now.getDate() &&
        scheduled.getMonth() === now.getMonth() &&
        scheduled.getFullYear() === now.getFullYear();
    }
    return matchesProvider && matchesStatus;
  });
  res.status(200).json({ jobs });
});

app.patch("/api/provider/jobs/:id", async (req, res) => {
  const providerId = getProviderId(req);
  const jobId = req.params.id;
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ error: "status is required." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("provider_jobs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", jobId)
        .eq("provider_id", providerId)
        .select()
        .single();
      if (error) {
        console.warn("[supabase] Failed to update provider job, using stub.", error);
      } else {
        return res.status(200).json({ job: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error updating provider job", error);
    }
  }

  const job = memoryStore.providerJobs.find(
    (item) => item.id === jobId && item.providerId === providerId
  );
  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }
  job.status = status;
  job.updatedAt = new Date().toISOString();
  res.status(200).json({ job });
});

app.get("/api/provider/earnings", async (req, res) => {
  const providerId = getProviderId(req);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("provider_earnings")
        .select("*")
        .eq("provider_id", providerId)
        .single();
      if (error) {
        console.warn("[supabase] Failed to load provider earnings, using stub.", error);
      } else {
        return res.status(200).json({ earnings: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider earnings", error);
    }
  }

  const earnings =
    memoryStore.providerEarnings.find((item) => item.providerId === providerId) || {
      providerId,
      totalEarned: 0,
      pendingPayout: 0,
      transactions: [],
    };
  res.status(200).json({ earnings });
});

app.get("/api/provider/me", async (req, res) => {
  const providerId = getProviderId(req);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("provider_id", providerId)
        .single();
      if (error) {
        console.warn("[supabase] Failed to load provider profile, using stub.", error);
      } else {
        return res.status(200).json({ profile: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider profile", error);
    }
  }

  const profile =
    memoryStore.providerProfiles.find((item) => item.providerId === providerId) || null;
  if (!profile) {
    return res.status(404).json({ error: "Provider profile not found." });
  }
  const normalized = {
    ...profile,
    hourly_rate: profile.hourly_rate ?? profile.hourlyRate ?? 0,
    hourlyRate: profile.hourlyRate ?? profile.hourly_rate ?? 0,
    categories: profile.categories || [],
    schedule: profile.schedule || [],
  };
  res.status(200).json({ profile: normalized });
});

app.patch("/api/provider/me", async (req, res) => {
  const providerId = getProviderId(req);
  const updates = req.body || {};

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .upsert(
          {
            provider_id: providerId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider_id" }
        )
        .select()
        .single();
      if (error) {
        console.warn("[supabase] Failed to update provider profile, using stub.", error);
      } else {
        return res.status(200).json({ profile: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error updating provider profile", error);
    }
  }

  let profile = memoryStore.providerProfiles.find(
    (item) => item.providerId === providerId
  );
  if (!profile) {
    profile = { providerId };
    memoryStore.providerProfiles.push(profile);
  }
  Object.assign(profile, updates, {
    updatedAt: new Date().toISOString(),
  });
  if (typeof updates.hourly_rate !== "undefined") {
    profile.hourlyRate = updates.hourly_rate;
  }
  if (typeof updates.hourlyRate !== "undefined") {
    profile.hourly_rate = updates.hourlyRate;
  }
  const normalized = {
    ...profile,
    hourly_rate: profile.hourly_rate ?? profile.hourlyRate ?? 0,
    hourlyRate: profile.hourlyRate ?? profile.hourly_rate ?? 0,
    categories: profile.categories || [],
    schedule: profile.schedule || [],
  };
  res.status(200).json({ profile: normalized });
});

app.patch("/api/provider/schedule", async (req, res) => {
  const providerId = getProviderId(req);
  const { schedule = [] } = req.body || {};

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: "schedule must be an array." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .upsert(
          {
            provider_id: providerId,
            schedule,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider_id" }
        )
        .select()
        .single();
      if (error) {
        console.warn("[supabase] Failed to update provider schedule, using stub.", error);
      } else {
        return res.status(200).json({ schedule: data.schedule || schedule });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error updating provider schedule", error);
    }
  }

  const profile =
    memoryStore.providerProfiles.find((item) => item.providerId === providerId) ||
    (() => {
      const newProfile = { providerId, schedule: [] };
      memoryStore.providerProfiles.push(newProfile);
      return newProfile;
    })();

  profile.schedule = schedule;
  if (profile.schedule && !profile.categories) {
    profile.categories = [];
  }
  profile.updatedAt = new Date().toISOString();

  res.status(200).json({ schedule });
});
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send("STRIPE_WEBHOOK_SECRET is not configured.");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[stripe] Webhook signature verification failed", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await markBookingPaid(session);
      } else {
        console.log(`[stripe] Unhandled event type ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (handlerError) {
      console.error("[stripe] Webhook handler failed", handlerError);
      await reportWebhookError(event, handlerError);
      res.status(500).send("Webhook handler failed.");
    }
  }
);

async function markBookingPaid(session) {
  const bookingId = session.metadata?.bookingId;
  const providerId = session.metadata?.providerId;

  if (!bookingId) {
    console.warn(
      "[stripe] checkout.session.completed missing bookingId metadata; skipping Supabase update."
    );
    return;
  }

  if (!supabase) {
    console.warn(
      "[stripe] Supabase client not configured. Skipping booking update."
    );
    return;
  }

  const updates = {
    status: "paid",
    payment_status: session.payment_status || "paid",
  };

  if (session.payment_intent) {
    updates.payment_intent_id = session.payment_intent;
  }

  if (session.amount_total) {
    updates.amount_paid = session.amount_total;
  }

  if (session.currency) {
    updates.currency = session.currency;
  }

  if (providerId) {
    updates.provider_id = providerId;
  }

  updates.paid_at = new Date().toISOString();

  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  const { error } = await supabase
    .from("bookings")
    .update(sanitizedUpdates)
    .eq("id", bookingId);

  if (error) {
    if (error.code === "42703") {
      console.error(
        "[stripe] Supabase is missing one of the columns referenced in the webhook update. Falling back to status-only update.",
        error
      );

      const fallback = {
        status: sanitizedUpdates.status,
        payment_status: sanitizedUpdates.payment_status,
        paid_at: sanitizedUpdates.paid_at,
      };

      const retry = await supabase
        .from("bookings")
        .update(fallback)
        .eq("id", bookingId);

      if (retry.error) {
        throw new Error(
          `Failed to mark booking ${bookingId} as paid in Supabase (missing columns). Latest error: ${retry.error.message}`
        );
      }

      console.log(
        `[stripe] Booking ${bookingId} marked as paid with fallback fields. Add missing columns to store full payment metadata.`
      );
      return;
    }

    throw new Error(
      `Failed to mark booking ${bookingId} as paid in Supabase: ${error.message}`
    );
  }

  console.log(
    `[stripe] Booking ${bookingId} marked as paid (payment_intent: ${session.payment_intent}).`
  );
}

function normalizeBooking(record) {
  const serviceName =
    record.service_name ||
    record.service_title ||
    record.serviceDescription ||
    record.service_description ||
    record.title ||
    `Booking ${record.id}`;

  const amountSources = [
    record.amount_due,
    record.amount_total,
    record.amount,
    record.price,
  ];

  const amountCandidate = amountSources.find(
    (value) => typeof value === "number" && !Number.isNaN(value)
  );

  const numericAmount =
    typeof amountCandidate === "number"
      ? amountCandidate
      : record.amount
      ? Number(record.amount)
      : 0;

  let amountInCents = 0;
  if (numericAmount > 0) {
    if (Number.isInteger(numericAmount) && numericAmount >= 1000) {
      amountInCents = numericAmount;
    } else if (Number.isInteger(numericAmount) && numericAmount < 1000) {
      amountInCents = numericAmount * 100;
    } else {
      amountInCents = Math.round(numericAmount * 100);
    }
  }

  const currency = (record.currency || "usd").toLowerCase();

  const providerId = record.provider_id || record.providerId || null;

  const customerEmail =
    record.customer_email || record.customerEmail || record.client_email || null;

  return {
    bookingId: record.id,
    serviceName,
    amount: amountInCents,
    currency,
    providerId,
    customerEmail,
    status: record.status,
  };
}

async function reportWebhookError(event, error) {
  console.error("[stripe] Reporting webhook failure", {
    eventId: event?.id,
    type: event?.type,
    message: error?.message,
  });

  const target = process.env.WEBHOOK_ALERT_URL;
  if (!target) {
    return;
  }

  try {
    const body = {
      eventId: event?.id,
      type: event?.type,
      message: error?.message,
      timestamp: new Date().toISOString(),
    };

    const fetchFn =
      typeof fetch === "function" ? fetch : (await import("node-fetch")).default;

    await fetchFn(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (notifyError) {
    console.error("[stripe] Failed to send webhook alert", notifyError);
  }
}

// ============================================================================
// PAYMENT ENDPOINTS - CLIENT PAYMENT METHODS
// ============================================================================

// POST /api/client/setup-intent
// Creates a SetupIntent for client to save their card
app.post("/api/client/setup-intent", async (req, res) => {
  const { userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      limit: 100,
    });

    let customerId;
    const existingCustomer = customers.data.find(
      (c) => c.metadata?.userId === userId
    );

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
          userType: "client",
        },
      });
      customerId = customer.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "on_session",
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
    });
  } catch (error) {
    console.error("Setup intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/payment-methods
// Retrieve all payment methods for a customer
app.post("/api/client/payment-methods", async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: "customerId required" });
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    res.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      })),
    });
  } catch (error) {
    console.error("Payment methods error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/client/payment-methods/:paymentMethodId
// Remove a saved payment method
app.delete("/api/client/payment-methods/:paymentMethodId", async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ success: true });
  } catch (error) {
    console.error("Payment method deletion error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/charge
// Charge an existing payment method
app.post("/api/charge", async (req, res) => {
  const { amount, paymentMethodId, customerId, bookingId, providerId } = req.body;

  if (!amount || !paymentMethodId || !customerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const charge = await stripe.charges.create({
      amount: Math.round(amount),
      currency: "cad",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        bookingId: bookingId || "unknown",
        providerId: providerId || "unknown",
      },
    });

    res.json({
      chargeId: charge.id,
      status: charge.status,
      amount: charge.amount,
    });
  } catch (error) {
    console.error("Charge error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PAYMENT ENDPOINTS - PROVIDER STRIPE CONNECT
// ============================================================================

// POST /api/provider/connected-account
// Create a Connected Account for provider
app.post("/api/provider/connected-account", async (req, res) => {
  const { userId, email, businessName } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "userId and email required" });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "CA",
      email: email,
      business_type: "individual",
      individual: {
        email: email,
      },
      business_profile: {
        name: businessName || email,
        support_email: email,
        url: "https://proxey.app",
      },
      metadata: {
        userId: userId,
        userType: "provider",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    res.json({
      accountId: account.id,
    });
  } catch (error) {
    console.error("Connected account error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/provider/onboarding-link
// Generate onboarding link for provider to complete Stripe setup
app.post("/api/provider/onboarding-link", async (req, res) => {
  const { accountId, refreshUrl, returnUrl } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "accountId required" });
  }

  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    res.json({
      onboardingLink: link.url,
    });
  } catch (error) {
    console.error("Onboarding link error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/provider/account/:accountId
// Check provider's Stripe account status
app.get("/api/provider/account/:accountId", async (req, res) => {
  const { accountId } = req.params;

  try {
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements || {},
    });
  } catch (error) {
    console.error("Account retrieval error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
