import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import PDFDocument from "pdfkit";

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

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://proxey-app-git-feature-prototype-migration-eto-seguns-projects.vercel.app',
  'https://proxey-app.vercel.app',
  /\.vercel\.app$/ // Allow all Vercel preview deployments
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or matches regex
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Create a notification for a provider
 * @param {string} providerId - Provider's user ID
 * @param {object} notification - { type, title, body, data, request_id, booking_id }
 */
async function createProviderNotification(providerId, notification) {
  if (!supabase || !providerId) return null;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        provider_id: providerId,
        type: notification.type || 'general',
        title: notification.title,
        body: notification.body || null,
        data: notification.data || {},
        request_id: notification.request_id || null,
        booking_id: notification.booking_id || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[notifications] Failed to create provider notification:", error);
      return null;
    }

    console.log("[notifications] Created provider notification:", data.id);
    return data;
  } catch (error) {
    console.error("[notifications] Error creating provider notification:", error);
    return null;
  }
}

/**
 * Create a notification for a client
 * @param {string} userId - Client's user ID
 * @param {object} notification - { type, title, body, data, request_id, booking_id }
 */
async function createClientNotification(userId, notification) {
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .insert({
        user_id: userId,
        type: notification.type || 'general',
        title: notification.title,
        body: notification.body || null,
        data: notification.data || {},
        request_id: notification.request_id || null,
        booking_id: notification.booking_id || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[notifications] Failed to create client notification:", error);
      return null;
    }

    console.log("[notifications] Created client notification:", data.id);
    return data;
  } catch (error) {
    console.error("[notifications] Error creating client notification:", error);
    return null;
  }
}

// ============================================

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

// Get services for a specific provider (for public profile)
app.get("/api/provider/:providerId/services", async (req, res) => {
  const { providerId } = req.params;

  if (!providerId) {
    return res.status(400).json({ error: "providerId is required." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[supabase] Failed to load provider services, using stub.", error);
      } else {
        // Transform to client-friendly format
        const services = data.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          category: s.category,
          price: s.base_price,
          basePrice: s.base_price,
          base_price: s.base_price,
          unit: s.unit || 'visit',
          duration: s.duration || 60,
          provider_id: s.provider_id
        }));
        return res.status(200).json({ services });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider services", error);
    }
  }

  // Fallback to mock data filtered by provider
  const mockServices = memoryStore.services.map(s => ({
    ...s,
    price: s.basePrice,
    base_price: s.basePrice
  }));
  res.status(200).json({ services: mockServices });
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

// Create or update a service (provider-owned)
app.post("/api/services", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { id, name, description, category, basePrice, unit, duration } = req.body || {};

  if (!name || !category || !basePrice) {
    return res.status(400).json({ error: "name, category, and basePrice are required." });
  }

  const payload = {
    id: id || crypto.randomUUID(),
    name,
    description: description || "",
    category,
    base_price: basePrice,
    unit: unit || "visit",
    duration: duration || 60,
    provider_id: providerId,
  };

  try {
    const { data, error } = await supabase
      .from("services")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ service: data });
  } catch (err) {
    console.error("[supabase] Failed to upsert service", err);
    res.status(500).json({ error: "Failed to save service." });
  }
});

// Delete a service (provider-owned)
app.delete("/api/services/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const serviceId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Service not found." });
    }

    res.status(200).json({ service: data });
  } catch (err) {
    console.error("[supabase] Failed to delete service", err);
    res.status(500).json({ error: "Failed to delete service." });
  }
});

app.get("/api/providers", async (req, res) => {
  const { category, minPrice, maxPrice, minRating } = req.query;

  if (supabase) {
    try {
      let query = supabase.from("providers").select("*").eq("is_active", true);
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

// Create or update provider profile
app.post("/api/providers/profile", async (req, res) => {
  const {
    userId,
    name,
    email,
    phone,
    avatar,
    photo,
    bio,
    headline,
    category,
    categories,
    city,
    location,
    hourlyRate,
    services,
    availability,
    stripeAccountId,
    isProfileComplete,
    onboardingCompletedAt
  } = req.body;

  if (!userId || !name) {
    return res.status(400).json({
      error: "userId and name are required to create a provider profile."
    });
  }

  if (!supabase) {
    return res.status(503).json({
      error: "Database connection not available."
    });
  }

  try {
    // Check if provider profile already exists
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", userId)
      .single();

    const providerData = {
      user_id: userId,
      name,
      email,
      phone,
      avatar: avatar || photo,
      photo: photo || avatar,
      bio,
      headline,
      category,
      categories: categories || (category ? [category] : []),
      city,
      location: location || city,
      hourly_rate: hourlyRate ? Number(hourlyRate) : null,
      services: services || [],
      availability: availability || {},
      stripe_account_id: stripeAccountId,
      is_active: true,
      is_profile_complete: isProfileComplete || false,
      onboarding_completed_at: onboardingCompletedAt
    };

    let result;
    if (existing) {
      // Update existing provider
      result = await supabase
        .from("providers")
        .update(providerData)
        .eq("user_id", userId)
        .select()
        .single();
    } else {
      // Insert new provider
      result = await supabase
        .from("providers")
        .insert(providerData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    console.log(`[providers] ${existing ? 'Updated' : 'Created'} provider profile for user ${userId}`);
    res.status(200).json({ provider: result.data });
  } catch (error) {
    console.error("[providers] Failed to save provider profile", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bookings/me", async (req, res) => {
  const userId = getUserId(req);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", userId);
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
    originalPrice,
    promotionId,
    promoCode,
    discountType,
    discountValue,
    discountAmount,
  } = req.body || {};

  if (!serviceId || !providerId || !scheduledAt) {
    return res.status(400).json({
      error: "serviceId, providerId, and scheduledAt are required.",
    });
  }

  const now = new Date().toISOString();

  // Build metadata for promo/discount info
  const metadata = {};
  if (promotionId) {
    metadata.promotion = {
      id: promotionId,
      promoCode,
      discountType,
      discountValue,
      discountAmount,
      originalPrice: originalPrice ?? null,
    };
  }

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
      const insertData = {
        id: booking.id,
        client_id: booking.userId,
        service_id: booking.serviceId,
        provider_id: booking.providerId,
        scheduled_at: booking.scheduledAt,
        location: booking.location,
        notes: booking.notes,
        status: booking.status,
        price: booking.price,
      };

      if (Object.keys(metadata).length > 0) {
        insertData.metadata = metadata;
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.warn("[supabase] Failed to create booking, using stub.", error);
      } else {
        // Send notification to provider about new booking request
        if (data.status === 'pending' || data.status === 'confirmed') {
          const scheduledDate = new Date(data.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });

          await createProviderNotification(data.provider_id, {
            type: 'booking_request',
            title: 'New Booking Request',
            body: `You have a new booking request for ${scheduledDate}`,
            booking_id: data.id,
            data: {
              service_id: data.service_id,
              scheduled_at: data.scheduled_at,
              price: data.price
            }
          });
        }
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
        .eq("client_id", userId)
        .select()
        .single();

      if (error) {
        console.warn("[supabase] Failed to cancel booking, using stub.", error);
      } else if (!data) {
        return res.status(404).json({ error: "Booking not found." });
      } else {
        // Notify provider about the cancelled booking
        if (data.provider_id) {
          const scheduledDate = new Date(data.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          await createProviderNotification(data.provider_id, {
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            body: `A booking for ${scheduledDate} has been cancelled by the client`,
            booking_id: data.id,
            data: {
              client_id: data.client_id,
              scheduled_at: data.scheduled_at,
              status: 'cancelled'
            }
          });
        }
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
        // Send notification to client about booking status change
        // Handle both client_id (bookings table) and user_id (if used)
        const clientId = data.client_id || data.user_id;
        if (clientId && (status === 'accepted' || status === 'confirmed')) {
          const scheduledDate = new Date(data.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          await createClientNotification(clientId, {
            type: 'booking_accepted',
            title: 'Booking Confirmed!',
            body: `Your booking for ${scheduledDate} has been confirmed`,
            booking_id: data.id,
            data: {
              provider_id: data.provider_id,
              scheduled_at: data.scheduled_at,
              status: 'accepted'
            }
          });
        } else if (clientId && (status === 'declined' || status === 'cancelled')) {
          await createClientNotification(clientId, {
            type: 'booking_declined',
            title: 'Booking Update',
            body: `Your booking request was not accepted. Please try another time or provider.`,
            booking_id: data.id,
            data: {
              provider_id: data.provider_id,
              status: 'declined'
            }
          });
        }
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

// ============================================================================
// SUPABASE-ONLY ENDPOINTS: Notifications, Messages, Reviews, Promotions, Portfolio
// ============================================================================

app.get("/api/provider/notifications", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ notifications: data });
  } catch (err) {
    console.error("[supabase] Failed to load notifications", err);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Notification not found." });
    }

    res.status(200).json({ notification: data });
  } catch (err) {
    console.error("[supabase] Failed to mark notification read", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// Mark all provider notifications as read
app.patch("/api/provider/notifications/read-all", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("provider_id", providerId)
      .eq("is_read", false)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({ updated: data?.length || 0 });
  } catch (err) {
    console.error("[supabase] Failed to mark all provider notifications read", err);
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

// Delete a provider notification
app.delete("/api/provider/notifications/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const providerId = getProviderId(req);

  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("provider_id", providerId);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[supabase] Failed to delete provider notification", err);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

app.get("/api/messages/:threadId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const threadId = req.params.threadId;

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("sent_at", { ascending: true });

    if (error) {
      throw error;
    }

    const enriched = await attachProfilesToMessages(data);
    res.status(200).json({ messages: enriched });
  } catch (err) {
    console.error("[supabase] Failed to load messages", err);
    res.status(500).json({ error: "Failed to load messages." });
  }
});

app.post("/api/messages", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { threadId, senderId, receiverId, body } = req.body || {};

  if (!senderId || !receiverId || !body) {
    return res.status(400).json({
      error: "senderId, receiverId, and body are required.",
    });
  }

  const payload = {
    thread_id: threadId || crypto.randomUUID(),
    sender_id: senderId,
    receiver_id: receiverId,
    body,
  };

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send notification to the receiver about the new message
    // Try to determine if receiver is a provider or client
    const { data: providerCheck } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", receiverId)
      .single();

    if (providerCheck) {
      // Receiver is a provider
      await createProviderNotification(receiverId, {
        type: 'new_message',
        title: 'New Message',
        body: body.length > 50 ? body.substring(0, 50) + '...' : body,
        data: {
          thread_id: data.thread_id,
          sender_id: senderId,
          message_id: data.id
        }
      });
    } else {
      // Receiver is a client
      await createClientNotification(receiverId, {
        type: 'new_message',
        title: 'New Message',
        body: body.length > 50 ? body.substring(0, 50) + '...' : body,
        data: {
          thread_id: data.thread_id,
          sender_id: senderId,
          message_id: data.id
        }
      });
    }

    const enriched = (await attachProfilesToMessages([data]))?.[0] || data;
    res.status(201).json({ message: enriched });
  } catch (err) {
    console.error("[supabase] Failed to send message", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

app.get("/api/provider/:id/reviews", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ reviews: data });
  } catch (err) {
    console.error("[supabase] Failed to load reviews", err);
    res.status(500).json({ error: "Failed to load reviews." });
  }
});

app.post("/api/reviews", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { bookingId, providerId, userId, rating, comment } = req.body || {};

  if (!bookingId || !providerId || !userId || typeof rating !== "number") {
    return res.status(400).json({
      error: "bookingId, providerId, userId, and numeric rating are required.",
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be between 1 and 5." });
  }

  const payload = {
    booking_id: bookingId,
    provider_id: providerId,
    user_id: userId,
    rating,
    comment: comment || "",
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ review: data });
  } catch (err) {
    const isUniqueViolation = err?.code === "23505";
    if (isUniqueViolation) {
      return res.status(409).json({ error: "A review already exists for this booking." });
    }
    console.error("[supabase] Failed to create review", err);
    res.status(500).json({ error: "Failed to create review." });
  }
});

app.get("/api/provider/promotions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("provider_id", providerId)
      .order("start_at", { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({ promotions: data });
  } catch (err) {
    console.error("[supabase] Failed to load promotions", err);
    res.status(500).json({ error: "Failed to load promotions." });
  }
});

app.post("/api/provider/promotions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const {
    promoCode,
    discountType,
    discountValue,
    startAt,
    endAt,
    isActive = true,
    applicableServices = [],
  } = req.body || {};

  if (!promoCode || !discountType || typeof discountValue !== "number") {
    return res.status(400).json({
      error: "promoCode, discountType, and numeric discountValue are required.",
    });
  }

  const normalizedType = String(discountType).toLowerCase();
  if (!["percentage", "fixed"].includes(normalizedType)) {
    return res.status(400).json({ error: "discountType must be 'percentage' or 'fixed'." });
  }

  const payload = {
    provider_id: providerId,
    promo_code: promoCode,
    discount_type: normalizedType,
    discount_value: discountValue,
    is_active: Boolean(isActive),
    start_at: startAt || null,
    end_at: endAt || null,
    applicable_services: Array.isArray(applicableServices)
      ? applicableServices
      : [],
  };

  try {
    const { data, error } = await supabase
      .from("promotions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ promotion: data });
  } catch (err) {
    const isConflict = err?.code === "23505";
    if (isConflict) {
      return res.status(409).json({ error: "Promo code already exists for this provider." });
    }
    console.error("[supabase] Failed to create promotion", err);
    res.status(500).json({ error: "Failed to create promotion." });
  }
});

app.patch("/api/provider/promotions/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const promotionId = req.params.id;
  const {
    promoCode,
    discountType,
    discountValue,
    startAt,
    endAt,
    isActive,
    applicableServices,
  } = req.body || {};

  const updates = {};
  if (typeof promoCode !== "undefined") updates.promo_code = promoCode;
  if (typeof discountType !== "undefined") {
    const normalizedType = String(discountType).toLowerCase();
    if (!["percentage", "fixed"].includes(normalizedType)) {
      return res.status(400).json({ error: "discountType must be 'percentage' or 'fixed'." });
    }
    updates.discount_type = normalizedType;
  }
  if (typeof discountValue !== "undefined") {
    if (typeof discountValue !== "number") {
      return res.status(400).json({ error: "discountValue must be numeric." });
    }
    updates.discount_value = discountValue;
  }
  if (typeof startAt !== "undefined") updates.start_at = startAt || null;
  if (typeof endAt !== "undefined") updates.end_at = endAt || null;
  if (typeof isActive !== "undefined") updates.is_active = Boolean(isActive);
  if (typeof applicableServices !== "undefined") {
    updates.applicable_services = Array.isArray(applicableServices)
      ? applicableServices
      : [];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields provided to update." });
  }

  try {
    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", promotionId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Promotion not found." });
    }

    res.status(200).json({ promotion: data });
  } catch (err) {
    console.error("[supabase] Failed to update promotion", err);
    res.status(500).json({ error: "Failed to update promotion." });
  }
});

// Validate and apply a promo code for a provider
app.post("/api/promotions/validate", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { promoCode, providerId, serviceName } = req.body || {};

  if (!promoCode || !providerId) {
    return res.status(400).json({ error: "promoCode and providerId are required." });
  }

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("provider_id", providerId)
      .ilike("promo_code", promoCode)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Invalid promo code." });
    }

    // Check date validity
    const now = new Date();
    if (data.start_at && new Date(data.start_at) > now) {
      return res.status(400).json({ error: "This promotion has not started yet." });
    }
    if (data.end_at && new Date(data.end_at) < now) {
      return res.status(400).json({ error: "This promotion has expired." });
    }

    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return res.status(400).json({ error: "This promotion has reached its usage limit." });
    }

    // Check if service is applicable
    const applicableServices = data.applicable_services || [];
    if (applicableServices.length > 0 && serviceName) {
      const isApplicable = applicableServices.some(
        (s) => s.toLowerCase() === serviceName.toLowerCase() || s.toLowerCase() === 'all services'
      );
      if (!isApplicable) {
        return res.status(400).json({ error: "This promo code does not apply to the selected service." });
      }
    }

    res.status(200).json({
      valid: true,
      promotion: {
        id: data.id,
        promoCode: data.promo_code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        applicableServices: data.applicable_services,
      }
    });
  } catch (err) {
    console.error("[supabase] Failed to validate promo code", err);
    res.status(500).json({ error: "Failed to validate promo code." });
  }
});

// Get active promotions for a specific provider (public)
app.get("/api/provider/:providerId/promotions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = req.params.providerId;

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("promotions")
      .select("id, promo_code, discount_type, discount_value, applicable_services, start_at, end_at")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ promotions: data || [] });
  } catch (err) {
    console.error("[supabase] Failed to load provider promotions", err);
    res.status(500).json({ error: "Failed to load promotions." });
  }
});

// Increment promo code usage after successful booking
app.patch("/api/promotions/:id/increment-usage", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const promotionId = req.params.id;

  try {
    const { error } = await supabase.rpc('increment_promotion_usage', { promo_id: promotionId });
    if (error) {
      // Fallback: manual increment
      const { data: promo } = await supabase
        .from("promotions")
        .select("usage_count")
        .eq("id", promotionId)
        .single();

      if (promo) {
        await supabase
          .from("promotions")
          .update({ usage_count: (promo.usage_count || 0) + 1 })
          .eq("id", promotionId);
      }
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[supabase] Failed to increment promotion usage", err);
    res.status(200).json({ success: false });
  }
});

// Get own portfolio (authenticated provider)
app.get("/api/provider/portfolio", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ media: data });
  } catch (err) {
    console.error("[supabase] Failed to load portfolio media", err);
    res.status(500).json({ error: "Failed to load portfolio media." });
  }
});

// Get portfolio for a specific provider (public)
app.get("/api/provider/:providerId/portfolio", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = req.params.providerId;

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ media: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider portfolio", err);
    res.status(500).json({ error: "Failed to load portfolio." });
  }
});

app.post("/api/provider/portfolio", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { title, description, mediaUrl, mediaType = "image" } = req.body || {};

  if (!mediaUrl) {
    return res.status(400).json({ error: "mediaUrl is required." });
  }

  const payload = {
    provider_id: providerId,
    title: title || null,
    description: description || null,
    media_url: mediaUrl,
    media_type: mediaType || "image",
  };

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ media: data });
  } catch (err) {
    console.error("[supabase] Failed to add portfolio media", err);
    res.status(500).json({ error: "Failed to add portfolio media." });
  }
});

app.delete("/api/provider/portfolio/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const mediaId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .delete()
      .eq("id", mediaId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Portfolio media not found." });
    }

    res.status(200).json({ media: data });
  } catch (err) {
    console.error("[supabase] Failed to delete portfolio media", err);
    res.status(500).json({ error: "Failed to delete portfolio media." });
  }
});

// ============================================================================
// SUPABASE-ONLY ENDPOINTS: Client profile, notifications, transaction ledger
// ============================================================================

app.get("/api/client/profile", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return res.status(200).json({ profile: null });
    }

    res.status(200).json({ profile: data });
  } catch (err) {
    console.error("[supabase] Failed to load client profile", err);
    res.status(500).json({ error: "Failed to load client profile." });
  }
});

app.put("/api/client/profile", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const updates = req.body || {};

  const payload = {
    user_id: userId,
    name: updates.name || null,
    email: updates.email || null,
    phone: updates.phone || null,
    bio: updates.bio || null,
    avatar: updates.avatar || null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("client_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ profile: data });
  } catch (err) {
    console.error("[supabase] Failed to upsert client profile", err);
    res.status(500).json({ error: "Failed to save client profile." });
  }
});

app.get("/api/client/notifications", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ notifications: data });
  } catch (err) {
    console.error("[supabase] Failed to load client notifications", err);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

app.post("/api/client/notifications", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const { type, title, body, data = {}, is_read = false } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "title is required." });
  }

  const payload = {
    user_id: userId,
    type: type || null,
    title,
    body: body || "",
    data,
    is_read: Boolean(is_read),
  };

  try {
    const { data: inserted, error } = await supabase
      .from("client_notifications")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ notification: inserted });
  } catch (err) {
    console.error("[supabase] Failed to create client notification", err);
    res.status(500).json({ error: "Failed to create notification." });
  }
});

app.patch("/api/client/notifications/:id/read", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Notification not found." });
    }

    res.status(200).json({ notification: data });
  } catch (err) {
    console.error("[supabase] Failed to mark client notification read", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// Mark all client notifications as read
app.patch("/api/client/notifications/read-all", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({ updated: data?.length || 0 });
  } catch (err) {
    console.error("[supabase] Failed to mark all client notifications read", err);
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

// Delete a client notification
app.delete("/api/client/notifications/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const userId = getUserId(req);

  try {
    const { error } = await supabase
      .from("client_notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[supabase] Failed to delete client notification", err);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

app.get("/api/client/transactions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ transactions: data });
  } catch (err) {
    console.error("[supabase] Failed to load client transactions", err);
    res.status(500).json({ error: "Failed to load transactions." });
  }
});

app.post("/api/client/transactions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const {
    bookingId,
    amount,
    currency = "usd",
    status = "pending",
    description = "",
  } = req.body || {};

  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({ error: "amount (number) is required." });
  }

  const payload = {
    user_id: userId,
    booking_id: bookingId || null,
    amount,
    currency,
    status,
    description,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("client_transactions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ transaction: data });
  } catch (err) {
    console.error("[supabase] Failed to create client transaction", err);
    res.status(500).json({ error: "Failed to create transaction." });
  }
});

// Messages list for current user (sender or receiver)
app.get("/api/messages", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("sent_at", { ascending: true });

    if (error) {
      throw error;
    }

    const enriched = await attachProfilesToMessages(data);
    res.status(200).json({ messages: enriched });
  } catch (err) {
    console.error("[supabase] Failed to load user messages", err);
    res.status(500).json({ error: "Failed to load messages." });
  }
});

// Provider time blocks (availability)
app.get("/api/provider/time-blocks", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  try {
    const { data, error } = await supabase
      .from("provider_time_blocks")
      .select("*")
      .eq("provider_id", providerId)
      .order("day_index", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    res.status(200).json({ blocks: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider time blocks", err);
    res.status(500).json({ error: "Failed to load time blocks." });
  }
});

app.post("/api/provider/time-blocks", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { blocks = [] } = req.body || {};

  if (!Array.isArray(blocks)) {
    return res.status(400).json({ error: "blocks must be an array." });
  }

  const payload = blocks.map((block) => ({
    provider_id: providerId,
    day_index: block.dayIndex ?? block.day_index ?? 0,
    start_time: block.startTime ?? block.start_time,
    end_time: block.endTime ?? block.end_time,
    is_available: block.isAvailable ?? block.is_available ?? true,
  }));

  try {
    await supabase.from("provider_time_blocks").delete().eq("provider_id", providerId);

    const { data, error } = await supabase
      .from("provider_time_blocks")
      .insert(payload)
      .select();

    if (error) throw error;

    res.status(201).json({ blocks: data });
  } catch (err) {
    console.error("[supabase] Failed to upsert provider time blocks", err);
    res.status(500).json({ error: "Failed to save time blocks." });
  }
});

// Provider invoices
app.get("/api/provider/invoices", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  try {
    const { data, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("provider_id", providerId)
      .order("issued_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ invoices: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider invoices", err);
    res.status(500).json({ error: "Failed to load invoices." });
  }
});

app.post("/api/provider/invoices", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const invoice = req.body || {};

  if (!invoice?.invoiceNumber && !invoice?.bookingId) {
    return res.status(400).json({
      error: "invoiceNumber or bookingId is required to create an invoice.",
    });
  }

  const payload = {
    provider_id: providerId,
    booking_id: invoice.bookingId || null,
    invoice_number: invoice.invoiceNumber || null,
    client_name: invoice.clientName || null,
    client_email: invoice.clientEmail || null,
    client_phone: invoice.clientPhone || null,
    service: invoice.service || null,
    description: invoice.description || null,
    total_amount: invoice.totalAmount ?? null,
    deposit_amount: invoice.depositAmount ?? null,
    final_amount: invoice.finalAmount ?? null,
    status: invoice.status || "pending",
    issued_at: invoice.issuedAt || new Date().toISOString(),
    paid_at: invoice.paidAt || null,
    notes: invoice.notes || null,
    address: invoice.address || null,
  };

  try {
    const { data, error } = await supabase
      .from("provider_invoices")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ invoice: data });
  } catch (err) {
    console.error("[supabase] Failed to create provider invoice", err);
    res.status(500).json({ error: "Failed to create invoice." });
  }
});

// GET /api/provider/invoices/:invoiceId/pdf
// Generate and download PDF for a provider invoice
app.get("/api/provider/invoices/:invoiceId/pdf", async (req, res) => {
  const { invoiceId } = req.params;

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  try {
    // Get invoice details from database
    const { data: invoice, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get provider details for the invoice header
    const { data: provider } = await supabase
      .from("providers")
      .select("name, email, phone")
      .eq("user_id", invoice.provider_id)
      .single();

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    const safeInvoiceNumber = (invoice.invoice_number || invoiceId).replace(/[^a-zA-Z0-9-_]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${safeInvoiceNumber}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Format dates
    const invoiceDate = invoice.issued_at
      ? new Date(invoice.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    // Header - Company/Provider Info
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#F58027').text('PROXEY', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#333')
      .text(provider?.name || 'Service Provider', 50, 80)
      .text(provider?.email || '', 50, 95)
      .text(provider?.phone || '', 50, 110);

    // Invoice Title
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#333').text('INVOICE', 400, 50);
    doc.fontSize(10).font('Helvetica')
      .text(`Invoice #: ${invoice.invoice_number || invoiceId.substring(0, 8).toUpperCase()}`, 400, 80)
      .text(`Date: ${invoiceDate}`, 400, 95);

    // Status badge
    const statusColor = invoice.status === 'paid' ? '#16a34a' : '#eab308';
    doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor)
      .text(invoice.status?.toUpperCase() || 'PENDING', 400, 110);

    // Line separator
    doc.fillColor('#333').moveTo(50, 140).lineTo(550, 140).stroke();

    // Bill To Section
    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 160);
    doc.fontSize(10).font('Helvetica')
      .text(invoice.client_name || 'Client', 50, 180)
      .text(invoice.client_email || '', 50, 195)
      .text(invoice.client_phone || '', 50, 210)
      .text(invoice.address || '', 50, 225);

    // Service Details Section
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE DETAILS', 50, 270);

    // Table headers
    const tableTop = 295;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 450, tableTop, { align: 'right' });

    // Line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Service details
    doc.font('Helvetica');
    doc.text(invoice.service || 'Service', 50, tableTop + 25, { width: 350 });

    if (invoice.description) {
      doc.fontSize(9).fillColor('#666')
        .text(invoice.description, 50, tableTop + 40, { width: 350 });
      doc.fillColor('#333').fontSize(10);
    }

    const totalAmount = (invoice.total_amount || 0) / 100;
    doc.text(`$${totalAmount.toFixed(2)}`, 450, tableTop + 25, { align: 'right' });

    // Payment Summary section
    const summaryTop = tableTop + 100;
    doc.moveTo(300, summaryTop).lineTo(550, summaryTop).stroke();

    doc.fontSize(10).font('Helvetica');
    doc.text('Service Amount:', 300, summaryTop + 15);
    doc.text(`$${totalAmount.toFixed(2)}`, 450, summaryTop + 15, { align: 'right' });

    let currentY = summaryTop + 35;

    // Show deposit if applicable
    if (invoice.deposit_amount && invoice.deposit_amount > 0) {
      const depositAmount = invoice.deposit_amount / 100;
      const finalAmount = (invoice.final_amount || invoice.total_amount - invoice.deposit_amount) / 100;

      doc.text('Deposit Paid:', 300, currentY);
      doc.text(`-$${depositAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
      currentY += 20;

      doc.text('Balance Due:', 300, currentY);
      doc.text(`$${finalAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
      currentY += 20;
    }

    // Total line
    doc.moveTo(300, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL:', 300, currentY);
    doc.text(`$${totalAmount.toFixed(2)}`, 450, currentY, { align: 'right' });

    // Payment status indicator
    currentY += 30;
    if (invoice.status === 'paid') {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a')
        .text('✓ PAID', 300, currentY);
      if (invoice.paid_at) {
        doc.fillColor('#666').font('Helvetica').fontSize(9)
          .text(`Paid on: ${new Date(invoice.paid_at).toLocaleDateString()}`, 300, currentY + 15);
      }
    } else {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#eab308')
        .text('⏳ PAYMENT PENDING', 300, currentY);
    }

    // Notes section
    if (invoice.notes) {
      doc.fillColor('#333').fontSize(10).font('Helvetica-Bold')
        .text('Notes:', 50, summaryTop + 15);
      doc.font('Helvetica').fontSize(9)
        .text(invoice.notes, 50, summaryTop + 30, { width: 200 });
    }

    // Footer
    doc.fontSize(9).fillColor('#666')
      .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 })
      .text('This invoice was generated by Proxey', 50, 715, { align: 'center', width: 500 });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  }
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

async function attachProfilesToMessages(messages = []) {
  if (!supabase || !Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  const ids = Array.from(
    new Set(
      messages.flatMap((m) => [m.sender_id, m.receiver_id]).filter(Boolean)
    )
  );

  const profileMap = {};

  if (ids.length > 0) {
    const { data: providerProfiles } = await supabase
      .from("provider_profiles")
      .select("provider_id,name,avatar")
      .in("provider_id", ids);

    (providerProfiles || []).forEach((p) => {
      profileMap[p.provider_id] = {
        name: p.name,
        avatar: p.avatar,
        role: "provider",
      };
    });

    const { data: clientProfiles } = await supabase
      .from("client_profiles")
      .select("user_id,name,avatar")
      .in("user_id", ids);

    (clientProfiles || []).forEach((c) => {
      profileMap[c.user_id] = {
        name: c.name,
        avatar: c.avatar,
        role: "client",
      };
    });

    const missing = ids.filter((id) => !profileMap[id]);
    if (missing.length > 0) {
      const { data: providers } = await supabase
        .from("providers")
        .select("id,name,avatar")
        .in("id", missing);
      (providers || []).forEach((p) => {
        profileMap[p.id] = {
          name: p.name,
          avatar: p.avatar,
          role: "provider",
        };
      });
    }
  }

  return messages.map((m) => {
    const sender = profileMap[m.sender_id] || {};
    const receiver = profileMap[m.receiver_id] || {};
    return {
      ...m,
      sender_name: sender.name || m.sender_name || null,
      sender_avatar: sender.avatar || m.sender_avatar || null,
      receiver_name: receiver.name || m.receiver_name || null,
      receiver_avatar: receiver.avatar || m.receiver_avatar || null,
    };
  });
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
    // Get customer to find default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    res.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        isDefault: pm.id === defaultPaymentMethodId,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        },
      })),
    });
  } catch (error) {
    console.error("Payment methods error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/attach-payment-method
// Attach a payment method to a customer
app.post("/api/client/attach-payment-method", async (req, res) => {
  const { paymentMethodId, customerId, setAsDefault } = req.body;

  if (!paymentMethodId || !customerId) {
    return res.status(400).json({ error: "paymentMethodId and customerId required" });
  }

  try {
    // Attach the payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Check if this is the first payment method or if setAsDefault is true
    const existingMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Set as default if it's the first card or explicitly requested
    if (existingMethods.data.length === 1 || setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        isDefault: existingMethods.data.length === 1 || setAsDefault,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      },
    });
  } catch (error) {
    console.error("Attach payment method error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/set-default-payment-method
// Set a payment method as the default for a customer
app.post("/api/client/set-default-payment-method", async (req, res) => {
  const { paymentMethodId, customerId } = req.body;

  if (!paymentMethodId || !customerId) {
    return res.status(400).json({ error: "paymentMethodId and customerId required" });
  }

  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      success: true,
      message: "Default payment method updated successfully",
    });
  } catch (error) {
    console.error("Set default payment method error:", error);
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

// GET /api/bookings/:bookingId/invoice
// Generate and download invoice PDF for a booking
app.get("/api/bookings/:bookingId/invoice", async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Get booking details from database
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only generate invoice if payment is completed
    if (booking.payment_status !== 'succeeded' && booking.payment_status !== 'completed') {
      return res.status(400).json({ error: "Payment not completed for this booking" });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${bookingId}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Add content to PDF
    const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(booking.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Header - Company Info
    doc.fontSize(24).font('Helvetica-Bold').text('PROXEY', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Service Booking Platform', 50, 80);
    doc.text('proxey@example.com', 50, 95);

    // Invoice Title
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoiceNumber}`, 400, 80);
    doc.text(`Date: ${invoiceDate}`, 400, 95);

    // Line separator
    doc.moveTo(50, 130).lineTo(550, 130).stroke();

    // Bill To Section
    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 150);
    doc.fontSize(10).font('Helvetica')
      .text(booking.client_name || 'Client', 50, 170)
      .text(booking.client_email || '', 50, 185)
      .text(booking.client_phone || '', 50, 200);

    // Service Provider Section
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE PROVIDER:', 350, 150);
    doc.fontSize(10).font('Helvetica')
      .text(booking.provider_name || 'Provider', 350, 170);

    // Service Details Section
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE DETAILS', 50, 250);

    // Table headers
    const tableTop = 280;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Date & Time', 250, tableTop);
    doc.text('Amount', 450, tableTop, { align: 'right' });

    // Line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Service details
    doc.font('Helvetica');
    const serviceDate = new Date(booking.scheduled_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(booking.service_name, 50, tableTop + 25, { width: 190 });
    if (booking.service_description) {
      doc.fontSize(9).fillColor('#666')
        .text(booking.service_description, 50, tableTop + 40, { width: 190 });
      doc.fillColor('#000').fontSize(10);
    }
    doc.text(serviceDate, 250, tableTop + 25);
    doc.text(`$${((booking.price || 0) / 100).toFixed(2)}`, 450, tableTop + 25, { align: 'right' });

    // Total section
    const totalTop = tableTop + 80;
    doc.moveTo(350, totalTop).lineTo(550, totalTop).stroke();

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Subtotal:', 350, totalTop + 10);
    doc.text(`$${((booking.price || 0) / 100).toFixed(2)}`, 450, totalTop + 10, { align: 'right' });

    doc.text('TOTAL:', 350, totalTop + 35);
    doc.fontSize(14).text(`$${((booking.price || 0) / 100).toFixed(2)}`, 450, totalTop + 35, { align: 'right' });

    // Payment status
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a')
      .text('PAID', 350, totalTop + 60);
    doc.fillColor('#000').font('Helvetica')
      .text(`Payment Method: Card ending in ****`, 350, totalTop + 75);

    // Footer
    doc.fontSize(9).fillColor('#666')
      .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 })
      .text('This is a computer-generated invoice.', 50, 715, { align: 'center', width: 500 });

    // Additional booking info if available
    if (booking.location) {
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')
        .text('Location:', 50, totalTop + 10);
      doc.font('Helvetica').text(booking.location, 50, totalTop + 25, { width: 250 });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("Invoice generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate invoice" });
    }
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

// ============================================================================
// TIME REQUESTS & AVAILABILITY ENDPOINTS
// ============================================================================

// POST /api/time-requests
// Create a new time request from client to provider
app.post("/api/time-requests", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const {
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    providerId,
    requestedDate,
    requestedTime,
    serviceId,
    serviceName,
    durationMinutes = 60,
    notes
  } = req.body;

  if (!clientId || !providerId || !requestedDate || !requestedTime) {
    return res.status(400).json({
      error: "clientId, providerId, requestedDate, and requestedTime are required."
    });
  }

  try {
    // Combine date and time into a timestamp
    const requestedDatetime = new Date(`${requestedDate}T${requestedTime}`).toISOString();

    const payload = {
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      provider_id: providerId,
      requested_date: requestedDate,
      requested_time: requestedTime,
      requested_datetime: requestedDatetime,
      service_id: serviceId,
      service_name: serviceName,
      duration_minutes: durationMinutes,
      notes: notes || null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from("time_requests")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Notify provider about the new time request
    const requestDateTime = new Date(`${requestedDate}T${requestedTime}`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    await createProviderNotification(providerId, {
      type: 'time_request',
      title: 'New Time Request',
      body: `A client is requesting an appointment for ${requestDateTime}`,
      request_id: data.id,
      data: {
        client_id: clientId,
        client_name: clientName,
        service_name: serviceName,
        requested_datetime: data.requested_datetime
      }
    });

    res.status(201).json({ timeRequest: data });
  } catch (err) {
    console.error("[supabase] Failed to create time request", err);
    res.status(500).json({ error: "Failed to create time request." });
  }
});

// GET /api/time-requests/client/:clientId
// Get all time requests for a client
app.get("/api/time-requests/client/:clientId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { clientId } = req.params;

  try {
    const { data, error } = await supabase
      .from("time_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("requested_datetime", { ascending: true });

    if (error) throw error;

    res.status(200).json({ timeRequests: data });
  } catch (err) {
    console.error("[supabase] Failed to load client time requests", err);
    res.status(500).json({ error: "Failed to load time requests." });
  }
});

// GET /api/time-requests/provider/:providerId
// Get all time requests for a provider
app.get("/api/time-requests/provider/:providerId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;
  const { status } = req.query;

  try {
    let query = supabase
      .from("time_requests")
      .select("*")
      .eq("provider_id", providerId);

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("requested_datetime", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ timeRequests: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider time requests", err);
    res.status(500).json({ error: "Failed to load time requests." });
  }
});

// PATCH /api/time-requests/:id
// Update a time request (accept/decline/cancel)
app.patch("/api/time-requests/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { id } = req.params;
  const { status, providerResponse } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required." });
  }

  if (!['pending', 'accepted', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({
      error: "status must be one of: pending, accepted, declined, cancelled"
    });
  }

  try {
    const updates = {
      status,
      provider_response: providerResponse || null
    };

    if (status === 'accepted' || status === 'declined') {
      updates.responded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("time_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Time request not found." });
    }

    // Notify client about the time request status change
    if (data.client_id && (status === 'accepted' || status === 'declined')) {
      const requestDateTime = new Date(data.requested_datetime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      if (status === 'accepted') {
        await createClientNotification(data.client_id, {
          type: 'time_request_accepted',
          title: 'Request Accepted!',
          body: `Your time request for ${requestDateTime} has been accepted`,
          request_id: data.id,
          data: {
            provider_id: data.provider_id,
            requested_datetime: data.requested_datetime,
            service_name: data.service_name,
            status: 'accepted'
          }
        });
      } else if (status === 'declined') {
        await createClientNotification(data.client_id, {
          type: 'time_request_declined',
          title: 'Request Declined',
          body: `Your time request for ${requestDateTime} was not accepted`,
          request_id: data.id,
          data: {
            provider_id: data.provider_id,
            provider_response: data.provider_response,
            status: 'declined'
          }
        });
      }
    }

    res.status(200).json({ timeRequest: data });
  } catch (err) {
    console.error("[supabase] Failed to update time request", err);
    res.status(500).json({ error: "Failed to update time request." });
  }
});

// GET /api/provider/:providerId/availability
// Get provider's availability slots
app.get("/api/provider/:providerId/availability", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;
  const { startDate, endDate, limit = 10 } = req.query;

  try {
    let query = supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_available", true)
      .eq("is_booked", false)
      .gte("datetime", new Date().toISOString());

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    query = query.order("datetime", { ascending: true }).limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider availability", err);
    res.status(500).json({ error: "Failed to load availability." });
  }
});

// GET /api/provider/:providerId/availability/closest
// Get the 3 closest available time slots for a provider
app.get("/api/provider/:providerId/availability/closest", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;

  try {
    const { data, error } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_available", true)
      .eq("is_booked", false)
      .gte("datetime", new Date().toISOString())
      .order("datetime", { ascending: true })
      .limit(3);

    if (error) throw error;

    res.status(200).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to load closest availability", err);
    res.status(500).json({ error: "Failed to load availability." });
  }
});

// POST /api/provider/availability
// Provider creates/updates their availability
app.post("/api/provider/availability", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { slots = [] } = req.body;

  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: "slots must be an array." });
  }

  try {
    const payload = slots.map(slot => ({
      provider_id: providerId,
      date: slot.date,
      time_slot: slot.timeSlot || slot.time_slot,
      datetime: slot.datetime,
      duration_minutes: slot.durationMinutes || slot.duration_minutes || 60,
      is_available: slot.isAvailable !== undefined ? slot.isAvailable : true,
      is_booked: slot.isBooked || false,
      notes: slot.notes || null
    }));

    const { data, error } = await supabase
      .from("provider_availability")
      .upsert(payload, { onConflict: 'provider_id,datetime' })
      .select();

    if (error) throw error;

    res.status(201).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to save provider availability", err);
    res.status(500).json({ error: "Failed to save availability." });
  }
});

// POST /api/provider/:providerId/availability/generate
// Generate availability slots for a provider
app.post("/api/provider/:providerId/availability/generate", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;
  const {
    startDate,
    endDate,
    startTime = '09:00:00',
    endTime = '17:00:00',
    slotDurationMinutes = 60,
    daysOfWeek = [1, 2, 3, 4, 5] // Monday to Friday
  } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      error: "startDate and endDate are required."
    });
  }

  try {
    const { data, error } = await supabase.rpc('generate_provider_availability', {
      p_provider_id: providerId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_start_time: startTime,
      p_end_time: endTime,
      p_slot_duration_minutes: slotDurationMinutes,
      p_days_of_week: daysOfWeek
    });

    if (error) throw error;

    res.status(201).json({
      slotsCreated: data,
      message: `Successfully generated ${data} availability slots.`
    });
  } catch (err) {
    console.error("[supabase] Failed to generate availability", err);
    res.status(500).json({ error: "Failed to generate availability." });
  }
});

// DELETE /api/provider/availability/:id
// Delete an availability slot
app.delete("/api/provider/availability/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("provider_availability")
      .delete()
      .eq("id", id)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    res.status(200).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to delete availability slot", err);
    res.status(500).json({ error: "Failed to delete availability slot." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
