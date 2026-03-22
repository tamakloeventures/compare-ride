const CONFIG = window.RIDECOMPARE_CONFIG || {};

const SUPABASE_URL =
  CONFIG.SUPABASE_URL ||
  CONFIG.supabaseUrl ||
  "https://prglhlctcswjccajsvxr.supabase.co";

const SUPABASE_ANON_KEY =
  CONFIG.SUPABASE_ANON_KEY ||
  CONFIG.supabaseAnonKey ||
  "sb_publishable_BM9ApnCCqHYai5ZaZPf0Pw_l1N4Vatk";

const LYFT_REFERRAL_URL =
  CONFIG.LYFT_REFERRAL_URL ||
  CONFIG.lyftReferralUrl ||
  "https://www.lyft.com/i/ELVIS98387";

const DEFAULT_MARKET = (CONFIG.DEFAULT_MARKET || "us").toLowerCase();

const supabaseEnabled =
  typeof window.supabase !== "undefined" &&
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("https") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20;

const sb = supabaseEnabled
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const els = {
  pickup: document.getElementById("pickup"),
  dropoff: document.getElementById("dropoff"),
  date: document.getElementById("rideDate"),
  time: document.getElementById("rideTime"),
  rideForm: document.getElementById("rideForm"),
  btnCompare: document.getElementById("btnCompare"),
  btnScrollBooking: document.getElementById("btnScrollBooking"),
  btnFindRates: document.getElementById("btnFindRates"),
  btnShareCompare: document.getElementById("btnShareCompare"),
  statusNote: document.getElementById("statusNote"),
  helperText: document.getElementById("helperText"),
  available: document.getElementById("available"),
  bookingCard: document.getElementById("bookingCard"),
  waitlistForm: document.getElementById("waitlistForm"),
  waitlistEmail: document.getElementById("waitlistEmail"),
  waitlistCity: document.getElementById("waitlistCity"),
  waitlistStatus: document.getElementById("waitlistStatus"),
  ridesComparedCount: document.getElementById("ridesComparedCount"),
  mobileStickyCta: document.getElementById("mobileStickyCta"),
  mobileBestRideBtn: document.getElementById("mobileBestRideBtn"),
  mobileCompareBtn: document.getElementById("mobileCompareBtn"),
  marketSelect: document.getElementById("marketSelect"),
  marketEyebrow: document.getElementById("marketEyebrow"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  marketChips: document.getElementById("marketChips"),
  officialNotice: document.getElementById("officialNotice"),
  availableTitle: document.getElementById("availableTitle"),
  availableSubtitle: document.getElementById("availableSubtitle"),
  resultsNotice: document.getElementById("resultsNotice"),
  ridesGrid: document.getElementById("ridesGrid")
};

const sessionId = localStorage.getItem("rc_session") || crypto.randomUUID();
localStorage.setItem("rc_session", sessionId);

const coords = {
  pickup: null,
  dropoff: null
};

const selectedPlaces = {
  pickup: null,
  dropoff: null
};

let lastRoute = {
  distance_m: null,
  duration_s: null
};

let currentMarket = getInitialMarket();
let lastBestProviderId = null;

const DISPLAY_COUNTER_BASE = 127;

const MARKET_CONFIG = {
  us: {
    code: "us",
    eyebrow: "RideCompare by Tamakloe Ventures LLC",
    heroTitle: "Compare Uber and Lyft fares instantly",
    heroSubtitle:
      "Find the cheapest ride and launch it in seconds. Built for everyday commuters, airport travelers, and anyone who wants a faster way to compare ride options.",
    chips: ["New York", "Los Angeles", "Chicago", "Houston", "Atlanta"],
    currency: "USD",
    locale: "en-US",
    availableTitle: "Available Rides",
    availableSubtitle:
      "Estimated fares are approximate. Use them to compare quickly, then confirm final pricing inside each provider’s official experience.",
    officialNotice:
      "⚠️ <strong>Important:</strong> RideCompare is an independent comparison tool and is not affiliated with Uber or Lyft. <strong>Official booking and final pricing always happen inside the provider app.</strong> RideCompare only provides estimated comparisons to help you choose faster.",
    resultsNotice:
      "<strong>Important:</strong> RideCompare is an independent comparison tool and is not affiliated with Uber or Lyft. Fare estimates are approximate, and final pricing, availability, and booking are completed inside the official provider experience. Lyft links may include a referral code.",
    waitlistCityEnabled: false,
    waitlistSource: "ridecompare_us",
    providers: [
      {
        id: "uber",
        name: "Uber",
        subtitleMobile: "Book instantly with Uber",
        subtitleDesktop: "Book instantly with Uber",
        buttonTextMobile: "Book with Uber",
        buttonTextDesktop: "Book with Uber",
        brandClass: "uber",
        logoType: "image",
        logoSrc: "uber-logo.svg",
        logoText: "Uber",
        badgeText: "Estimate",
        referralUrl: null
      },
      {
        id: "lyft",
        name: "Lyft",
        subtitleMobile: "Open in Lyft app",
        subtitleDesktop: "Continue with Lyft app",
        buttonTextMobile: "Book with Lyft",
        buttonTextDesktop: "Get Lyft App",
        brandClass: "lyft",
        logoType: "image",
        logoSrc: "lyft-logo.svg",
        logoText: "Lyft",
        badgeText: "Estimate",
        referralUrl: LYFT_REFERRAL_URL,
        referralLabel: "Use referral link",
        referralNote:
          "Affiliate disclosure: RideCompare may benefit from some referral links."
      }
    ],
    pricingModel: {
      uber: { base: 2.5, perMile: 1.75, perMin: 0.25, surge: 1.0 },
      lyft: { base: 2.3, perMile: 1.8, perMin: 0.24, surge: 1.0 }
    }
  },

  gh: {
    code: "gh",
    eyebrow: "RideCompare Ghana",
    heroTitle: "Compare ride options faster before you book in Ghana",
    heroSubtitle:
      "Compare available ride providers, review estimated fare ranges, and continue in the official provider app.",
    chips: ["Accra", "Kumasi"],
    currency: "GHS",
    locale: "en-GH",
    availableTitle: "Available Ride Options",
    availableSubtitle:
      "Estimated fares are approximate. Use them to compare quickly, then confirm final pricing and availability inside each provider’s official experience.",
    officialNotice:
      "⚠️ <strong>Important:</strong> RideCompare is an independent comparison platform and is not affiliated with ride providers. <strong>Official booking and final pricing always happen inside the provider app.</strong> RideCompare only provides estimated comparisons to help you choose faster.",
    resultsNotice:
      "<strong>Important:</strong> RideCompare is an independent comparison tool. Fare estimates are approximate, and final pricing, availability, and booking are completed inside the official provider experience.",
    waitlistCityEnabled: true,
    waitlistSource: "ridecompare_gh",
    providers: [
      {
        id: "uber",
        name: "Uber",
        subtitleMobile: "Known city coverage",
        subtitleDesktop: "Known city coverage",
        buttonTextMobile: "Book with Uber",
        buttonTextDesktop: "Book with Uber",
        brandClass: "uber",
        logoType: "image",
        logoSrc: "uber-logo.svg",
        logoText: "Uber",
        badgeText: "Estimate",
        referralUrl: null
      },
      {
        id: "bolt",
        name: "Bolt",
        subtitleMobile: "Strong local contender",
        subtitleDesktop: "Strong local contender",
        buttonTextMobile: "Open Bolt",
        buttonTextDesktop: "Open Bolt",
        brandClass: "bolt",
        logoType: "text",
        logoSrc: "",
        logoText: "Bolt",
        badgeText: "Estimate",
        referralUrl: null
      },
      {
        id: "yango",
        name: "Yango",
        subtitleMobile: "Alternative provider",
        subtitleDesktop: "Alternative provider",
        buttonTextMobile: "Open Yango",
        buttonTextDesktop: "Open Yango",
        brandClass: "yango",
        logoType: "text",
        logoSrc: "",
        logoText: "Yango",
        badgeText: "Estimate",
        referralUrl: null
      }
    ],
    pricingModel: {
      uber: { base: 18, perMile: 3.8, perMin: 0.55, surge: 1.0 },
      bolt: { base: 16, perMile: 3.5, perMin: 0.5, surge: 1.0 },
      yango: { base: 17, perMile: 3.65, perMin: 0.52, surge: 1.0 }
    }
  }
};

function getInitialMarket() {
  const params = new URLSearchParams(window.location.search);
  const market = (params.get("market") || "").toLowerCase();
  if (MARKET_CONFIG[market]) return market;
  return MARKET_CONFIG[DEFAULT_MARKET] ? DEFAULT_MARKET : "us";
}

function getCurrentMarketConfig() {
  return MARKET_CONFIG[currentMarket] || MARKET_CONFIG.us;
}

function updateMarketInUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("market", currentMarket);
  window.history.replaceState({}, "", url);
}

function setStatus(message) {
  if (els.statusNote) {
    els.statusNote.textContent = message;
  }
}

function setHelper(message) {
  if (els.helperText) {
    els.helperText.textContent = message;
  }
}

function scrollToBooking() {
  els.bookingCard?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function scrollToAvailable() {
  els.available?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function incrementRideCounter() {
  const current = Number(localStorage.getItem("rc_compare_count") || "0") + 1;
  localStorage.setItem("rc_compare_count", String(current));

  const displayCount = DISPLAY_COUNTER_BASE + current;

  if (els.ridesComparedCount) {
    els.ridesComparedCount.textContent = displayCount.toLocaleString();
  }
}

function hydrateRideCounter() {
  const stored = Number(localStorage.getItem("rc_compare_count") || "0");
  const displayCount = DISPLAY_COUNTER_BASE + stored;

  if (els.ridesComparedCount) {
    els.ridesComparedCount.textContent = displayCount.toLocaleString();
  }
}

function setLoading(isLoading) {
  if (!els.btnFindRates) return;

  if (isLoading) {
    els.btnFindRates.classList.add("btn-loading");
    els.btnFindRates.disabled = true;
    els.btnFindRates.textContent = "Calculating";
  } else {
    els.btnFindRates.classList.remove("btn-loading");
    els.btnFindRates.disabled = false;
    els.btnFindRates.textContent = "Find Best Rates";
  }
}

async function logEvent(eventName, extra = {}) {
  if (!supabaseEnabled || !sb) return;

  try {
    await sb.from("app_events").insert({
      session_id: sessionId,
      event_name: eventName,
      page: window.location.pathname,
      pickup_text: els.pickup?.value?.trim() || null,
      dropoff_text: els.dropoff?.value?.trim() || null,
      pickup_lat: coords.pickup?.lat ?? null,
      pickup_lng: coords.pickup?.lng ?? null,
      dropoff_lat: coords.dropoff?.lat ?? null,
      dropoff_lng: coords.dropoff?.lng ?? null,
      distance_meters: lastRoute.distance_m ?? null,
      duration_seconds: lastRoute.duration_s ?? null,
      provider: extra.provider ?? null,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      extra
    });
  } catch (error) {
    console.warn("[RideCompare] logEvent failed:", error);
  }
}

async function saveWaitlist(email, city = "") {
  if (!supabaseEnabled || !sb) {
    return { ok: false, error: "Supabase not configured" };
  }

  const market = getCurrentMarketConfig();

  try {
    const source =
      city && market.waitlistCityEnabled
        ? `${market.waitlistSource}_${city.toLowerCase().trim().replace(/\s+/g, "_")}`
        : market.waitlistSource;

    const { error } = await sb.from("waitlist").insert({
      email,
      source
    });

    if (error) {
      return { ok: false, error: error.message || String(error) };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

function applyMarketUI() {
  const market = getCurrentMarketConfig();

  if (els.marketSelect) {
    els.marketSelect.value = currentMarket;
  }

  if (els.marketEyebrow) {
    els.marketEyebrow.textContent = market.eyebrow;
  }

  if (els.heroTitle) {
    els.heroTitle.textContent = market.heroTitle;
  }

  if (els.heroSubtitle) {
    els.heroSubtitle.textContent = market.heroSubtitle;
  }

  if (els.marketChips) {
    els.marketChips.innerHTML = "";
    market.chips.forEach((chip) => {
      const span = document.createElement("span");
      span.className = "market-chip";
      span.textContent = chip;
      els.marketChips.appendChild(span);
    });
  }

  if (els.officialNotice) {
    els.officialNotice.innerHTML = market.officialNotice;
  }

  if (els.availableTitle) {
    els.availableTitle.textContent = market.availableTitle;
  }

  if (els.availableSubtitle) {
    els.availableSubtitle.textContent = market.availableSubtitle;
  }

  if (els.resultsNotice) {
    els.resultsNotice.innerHTML = market.resultsNotice;
  }

  if (els.waitlistCity) {
    els.waitlistCity.style.display = market.waitlistCityEnabled ? "" : "none";
    els.waitlistCity.placeholder = market.waitlistCityEnabled
      ? "Request your city (optional)"
      : "City";
    if (!market.waitlistCityEnabled) {
      els.waitlistCity.value = "";
    }
  }

  renderEmptyProviderCards();
  updateMarketInUrl();
}

function renderEmptyProviderCards() {
  const market = getCurrentMarketConfig();
  const currencyPrefix = market.currency === "GHS" ? "GH₵" : "$";

  const cards = market.providers.map((provider) => ({
    provider,
    fareText: `${currencyPrefix} —`,
    etaText: "ETA —",
    tagText: provider.badgeText || "Estimate",
    isBest: false,
    actionDisabled: true
  }));

  renderRideCards(cards);
}

function renderRideCards(cards) {
  if (!els.ridesGrid) return;

  els.ridesGrid.innerHTML = "";

  cards.forEach((card) => {
    const article = document.createElement("div");
    article.className = "ride-card";
    if (card.isBest) article.classList.add("best-pick");

    const subtitle = isMobileDevice()
      ? (card.provider.subtitleMobile || card.provider.subtitleDesktop || "")
      : (card.provider.subtitleDesktop || card.provider.subtitleMobile || "");

    const buttonText = isMobileDevice()
      ? (card.provider.buttonTextMobile || `Open ${card.provider.name}`)
      : (card.provider.buttonTextDesktop || `Open ${card.provider.name}`);

    let logoHtml = "";
    if (card.provider.logoType === "image" && card.provider.logoSrc) {
      logoHtml = `
        <img
          src="${card.provider.logoSrc}"
          alt="${card.provider.name} logo"
          onerror="this.style.display='none'; this.parentNode.textContent='${card.provider.logoText || card.provider.name}';"
        />
      `;
    } else {
      logoHtml = card.provider.logoText || card.provider.name;
    }

    article.innerHTML = `
      <div class="ride-top ${card.isBest ? "with-badge" : ""}">
        <div class="ride-top-main">
          <div class="logo-badge ${card.provider.brandClass || ""} ${card.provider.logoType === "text" ? "text-logo" : ""}" aria-hidden="true" title="${card.provider.name}">
            ${logoHtml}
          </div>

          <div class="ride-meta">
            <strong>${card.provider.name}</strong>
            <span>${subtitle}</span>
          </div>
        </div>

        ${card.isBest ? `<div class="best-badge">Best Value</div>` : ""}
      </div>

      <div class="pricebox">
        <div>
          <div class="price-label tooltip-trigger">
            Estimated Fare
            <span class="tooltip-icon">?</span>

            <div class="tooltip-box">
              These are estimated fares based on distance and time.
              Most accurate for trips happening now or soon.

              Future trips may vary due to traffic, demand, and surge pricing.
            </div>
          </div>
          <b>${card.fareText}</b>
          <div class="price-eta">${card.etaText}</div>
        </div>
        <span class="tag ${card.isBest ? "best" : ""}">${card.tagText}</span>
      </div>

      <div class="ride-actions">
        <button class="btn provider-btn ${card.provider.brandClass || ""}" type="button" ${card.actionDisabled ? "disabled" : ""}>
          ${buttonText}
        </button>

        ${
          card.provider.referralUrl
            ? `
          <div class="referral-wrap">
            <a
              href="${card.provider.referralUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="referral-link"
            >
              ${card.provider.referralLabel || "Use referral link"}
            </a>
            <span class="referral-note">
              ${card.provider.referralNote || ""}
            </span>
          </div>
        `
            : ""
        }
      </div>
    `;

    const button = article.querySelector(".provider-btn");
    button?.addEventListener("click", async () => {
      if (card.actionDisabled) return;
      await openProvider(card.provider.id);
    });

    els.ridesGrid.appendChild(article);
  });

  bindTooltipClicks();
  cleanupDuplicateLogos();
}

function bindTooltipClicks() {
  document.querySelectorAll(".tooltip-trigger").forEach((el) => {
    if (el.dataset.bound === "1") return;
    el.dataset.bound = "1";

    el.addEventListener("click", (event) => {
      const box = el.querySelector(".tooltip-box");
      if (!box) return;

      const isVisible = box.style.opacity === "1";

      document.querySelectorAll(".tooltip-box").forEach((tooltip) => {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
        tooltip.style.pointerEvents = "none";
        tooltip.style.transform = "translateY(6px)";
      });

      if (!isVisible) {
        box.style.opacity = "1";
        box.style.visibility = "visible";
        box.style.pointerEvents = "auto";
        box.style.transform = "translateY(0)";
      }

      event.stopPropagation();
    });
  });
}

function cleanupDuplicateLogos() {
  const badges = document.querySelectorAll(".logo-badge");

  badges.forEach((badge) => {
    const images = badge.querySelectorAll("img");
    if (images.length <= 1) return;

    for (let i = 1; i < images.length; i += 1) {
      images[i].remove();
    }
  });
}

function validateInputs() {
  const pickup = els.pickup?.value?.trim() || "";
  const dropoff = els.dropoff?.value?.trim() || "";

  if (!pickup || !dropoff) {
    setStatus("Please enter both pickup and dropoff.");
    return null;
  }

  return { pickup, dropoff };
}

function milesFromMeters(meters) {
  return meters / 1609.344;
}

function formatMoneyRange(min, max) {
  const market = getCurrentMarketConfig();

  const formatter = new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: market.currency === "GHS" ? 0 : 2,
    minimumFractionDigits: market.currency === "GHS" ? 0 : 2
  });

  return `${formatter.format(min)}–${formatter.format(max)}`;
}

function estimateFares(distanceMeters, durationSeconds) {
  const market = getCurrentMarketConfig();
  const miles = milesFromMeters(distanceMeters);
  const minutes = durationSeconds / 60;

  const estimates = {};

  market.providers.forEach((provider) => {
    const model = market.pricingModel[provider.id];
    if (!model) return;

    const raw =
      (model.base + model.perMile * miles + model.perMin * minutes) * model.surge;

    estimates[provider.id] = {
      low: raw * 0.92,
      high: raw * 1.12
    };
  });

  return {
    estimates,
    miles,
    minutes
  };
}

function applyFareUI(estimate) {
  const market = getCurrentMarketConfig();

  const rendered = market.providers.map((provider) => {
    const providerEstimate = estimate.estimates[provider.id];
    const low = providerEstimate?.low ?? 0;
    const high = providerEstimate?.high ?? 0;
    const midpoint = (low + high) / 2;

    return {
      provider,
      low,
      high,
      midpoint,
      fareText: formatMoneyRange(low, high),
      etaText: `Trip ~${Math.round(estimate.minutes)} min · ${estimate.miles.toFixed(1)} mi`,
      tagText: provider.badgeText || "Estimate",
      isBest: false,
      actionDisabled: false
    };
  });

  rendered.sort((a, b) => a.midpoint - b.midpoint);

  if (rendered.length) {
    rendered[0].isBest = true;
    rendered[0].tagText = "Best value";
    lastBestProviderId = rendered[0].provider.id;
  } else {
    lastBestProviderId = null;
  }

  renderRideCards(rendered);
}

function haversineMiles(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const radiusMiles = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * radiusMiles * Math.asin(Math.sqrt(a));
}

async function geocodeAddress(address) {
  if (!window.google || !google.maps || !google.maps.Geocoder) {
    return null;
  }

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;

        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formatted: results[0].formatted_address || address
        });
      } else {
        resolve(null);
      }
    });
  });
}

function splitAddressLines(address) {
  const parts = String(address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const line1 = parts.shift() || address || "";
  const line2 = parts.join(", ") || "";

  return { line1, line2 };
}

function clearStoredPlace(kind) {
  selectedPlaces[kind] = null;
  coords[kind] = null;
}

function setSelectedPlace(kind, place, inputEl) {
  const hasGeometry =
    place &&
    place.geometry &&
    place.geometry.location &&
    typeof place.geometry.location.lat === "function" &&
    typeof place.geometry.location.lng === "function";

  if (!hasGeometry) {
    clearStoredPlace(kind);
    return false;
  }

  const formattedAddress =
    place.formatted_address || place.name || inputEl.value.trim();

  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();

  selectedPlaces[kind] = {
    name: place.name || "",
    formattedAddress,
    lat,
    lng
  };

  coords[kind] = { lat, lng };
  inputEl.value = formattedAddress;

  return true;
}

function attachManualEditReset(inputEl, kind) {
  if (!inputEl) return;

  inputEl.addEventListener("input", () => {
    const selected = selectedPlaces[kind];

    if (selected && inputEl.value.trim() !== selected.formattedAddress.trim()) {
      clearStoredPlace(kind);
    }

    setStatus("Update your trip details, then click Find Best Rates.");
  });
}

function attachAutocomplete(inputEl, kind) {
  if (!inputEl) return null;

  if (!window.google || !google.maps || !google.maps.places) {
    return null;
  }

  const autocomplete = new google.maps.places.Autocomplete(inputEl, {
    types: ["geocode"],
    fields: ["formatted_address", "geometry", "name"]
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    const ok = setSelectedPlace(kind, place, inputEl);

    if (ok) {
      setHelper("Autocomplete active. Select a suggested address for the best transfer.");
    }
  });

  attachManualEditReset(inputEl, kind);

  return autocomplete;
}

async function ensureCoordsFromInputs() {
  const values = validateInputs();
  if (!values) return false;

  if (!coords.pickup) {
    const pickupResult = await geocodeAddress(values.pickup);
    if (pickupResult) {
      coords.pickup = {
        lat: pickupResult.lat,
        lng: pickupResult.lng
      };

      selectedPlaces.pickup = {
        name: splitAddressLines(pickupResult.formatted).line1,
        formattedAddress: pickupResult.formatted,
        lat: pickupResult.lat,
        lng: pickupResult.lng
      };
    }
  }

  if (!coords.dropoff) {
    const dropoffResult = await geocodeAddress(values.dropoff);
    if (dropoffResult) {
      coords.dropoff = {
        lat: dropoffResult.lat,
        lng: dropoffResult.lng
      };

      selectedPlaces.dropoff = {
        name: splitAddressLines(dropoffResult.formatted).line1,
        formattedAddress: dropoffResult.formatted,
        lat: dropoffResult.lat,
        lng: dropoffResult.lng
      };
    }
  }

  return Boolean(coords.pickup && coords.dropoff);
}

function buildUberPlaceObject(addressText, coordObj, selectedPlaceObj) {
  const bestAddress = selectedPlaceObj?.formattedAddress || addressText || "";
  const { line1, line2 } = splitAddressLines(bestAddress);

  return {
    addressLine1: selectedPlaceObj?.name || line1,
    addressLine2: line2 || line1,
    id: crypto.randomUUID(),
    source: "SEARCH",
    latitude: coordObj?.lat ?? null,
    longitude: coordObj?.lng ?? null,
    provider: "uber_places"
  };
}

function buildUberLink(pickupText, dropoffText) {
  const pickupObj = buildUberPlaceObject(
    pickupText,
    coords.pickup,
    selectedPlaces.pickup
  );

  const dropoffObj = buildUberPlaceObject(
    dropoffText,
    coords.dropoff,
    selectedPlaces.dropoff
  );

  const params = new URLSearchParams();
  params.set("pickup", JSON.stringify(pickupObj));
  params.set("drop[0]", JSON.stringify(dropoffObj));

  return `https://m.uber.com/go/product-selection?${params.toString()}`;
}

function buildLyftLink(pickupText, dropoffText) {
  const params = new URLSearchParams();
  params.set("id", "lyft");

  if (coords.pickup) {
    params.set("pickup[latitude]", String(coords.pickup.lat));
    params.set("pickup[longitude]", String(coords.pickup.lng));
  } else {
    params.set("pickup[formatted_address]", pickupText);
  }

  if (coords.dropoff) {
    params.set("destination[latitude]", String(coords.dropoff.lat));
    params.set("destination[longitude]", String(coords.dropoff.lng));
  } else {
    params.set("destination[formatted_address]", dropoffText);
  }

  return `https://lyft.com/ride?${params.toString()}`;
}

async function computeRoute() {
  const values = validateInputs();
  if (!values) return null;

  if (window.google && google.maps && google.maps.DirectionsService) {
    const directionsService = new google.maps.DirectionsService();

    const route = await new Promise((resolve) => {
      directionsService.route(
        {
          origin: coords.pickup
            ? new google.maps.LatLng(coords.pickup.lat, coords.pickup.lng)
            : values.pickup,
          destination: coords.dropoff
            ? new google.maps.LatLng(coords.dropoff.lat, coords.dropoff.lng)
            : values.dropoff,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === "OK" && result?.routes?.[0]?.legs?.[0]) {
            const leg = result.routes[0].legs[0];
            resolve({
              distance_m: leg.distance.value,
              duration_s: leg.duration.value
            });
          } else {
            resolve(null);
          }
        }
      );
    });

    if (route) {
      return route;
    }
  }

  const haveCoords = await ensureCoordsFromInputs();
  if (!haveCoords) return null;

  const miles = haversineMiles(
    coords.pickup.lat,
    coords.pickup.lng,
    coords.dropoff.lat,
    coords.dropoff.lng
  );

  const approxMinutes = Math.max(8, Math.round((miles / 22) * 60));

  return {
    distance_m: miles * 1609.344,
    duration_s: approxMinutes * 60
  };
}

async function refreshEstimates() {
  setLoading(true);
  renderEmptyProviderCards();

  const route = await computeRoute();

  if (!route) {
    lastRoute = {
      distance_m: null,
      duration_s: null
    };

    setStatus(
      "Could not estimate this route yet. Please enter a more complete pickup and dropoff address."
    );
    setLoading(false);
    return;
  }

  lastRoute = route;

  const estimate = estimateFares(route.distance_m, route.duration_s);
  applyFareUI(estimate);

  setHelper("Your estimates are ready. Choose a provider to continue.");
  incrementRideCounter();

  const bestProviderName =
    getCurrentMarketConfig().providers.find((p) => p.id === lastBestProviderId)?.name ||
    "This provider";

  setStatus(
    `${bestProviderName} looks like the best value for this trip: ${els.pickup.value.trim()} → ${els.dropoff.value.trim()}`
  );

  setLoading(false);

  if (els.mobileStickyCta && isMobileDevice()) {
    els.mobileStickyCta.style.display = "flex";
  }
}

async function openProvider(providerId) {
  const values = validateInputs();
  if (!values) return;

  const haveCoords = await ensureCoordsFromInputs();
  if (!haveCoords) {
    setStatus("Please enter a more complete pickup and dropoff address.");
    return;
  }

  let url = "";

  if (providerId === "uber") {
    url = buildUberLink(values.pickup, values.dropoff);
  } else if (providerId === "lyft") {
    url = isMobileDevice() ? buildLyftLink(values.pickup, values.dropoff) : LYFT_REFERRAL_URL;
  } else if (providerId === "bolt") {
    url = "https://bolt.eu/en-gh/";
  } else if (providerId === "yango") {
    url = "https://yango.com/en_gh/rider/";
  } else {
    return;
  }

  await logEvent("ride_click", {
    market: currentMarket,
    provider: providerId,
    url
  });

  if (providerId === "lyft" && isMobileDevice()) {
    const startTime = Date.now();
    window.location.href = url;

    setTimeout(() => {
      if (Date.now() - startTime < 1800 && LYFT_REFERRAL_URL) {
        window.location.href = LYFT_REFERRAL_URL;
      }
    }, 1200);

    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

async function shareComparison() {
  const values = validateInputs();
  if (!values) return;

  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("pickup", values.pickup);
  url.searchParams.set("dropoff", values.dropoff);
  url.searchParams.set("market", currentMarket);

  if (els.date?.value) {
    url.searchParams.set("rideDate", els.date.value);
  }

  if (els.time?.value) {
    url.searchParams.set("rideTime", els.time.value);
  }

  try {
    await navigator.clipboard.writeText(url.toString());
    setStatus("Comparison link copied to clipboard ✅");
    logEvent("share_compare", { url: url.toString(), market: currentMarket });
  } catch (error) {
    setStatus("Could not copy link. You can copy the URL from your browser.");
  }
}

function hydrateFromQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const pickup = params.get("pickup");
  const dropoff = params.get("dropoff");
  const rideDate = params.get("rideDate");
  const rideTime = params.get("rideTime");
  const market = (params.get("market") || "").toLowerCase();

  if (pickup && els.pickup) els.pickup.value = pickup;
  if (dropoff && els.dropoff) els.dropoff.value = dropoff;
  if (rideDate && els.date) els.date.value = rideDate;
  if (rideTime && els.time) els.time.value = rideTime;
  if (MARKET_CONFIG[market]) currentMarket = market;
}

function setDefaultDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  const rounded = new Date(now.getTime());
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 5) * 5);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);

  const yyyy = rounded.getFullYear();
  const mm = pad(rounded.getMonth() + 1);
  const dd = pad(rounded.getDate());
  const hh = pad(rounded.getHours());
  const min = pad(rounded.getMinutes());

  if (els.date && !els.date.value) {
    els.date.value = `${yyyy}-${mm}-${dd}`;
  }

  if (els.time && !els.time.value) {
    els.time.value = `${hh}:${min}`;
  }
}

function initAppEvents() {
  els.btnCompare?.addEventListener("click", () => {
    logEvent("cta_compare_click", { market: currentMarket });
    scrollToBooking();
  });

  els.btnScrollBooking?.addEventListener("click", () => {
    logEvent("cta_find_click", { market: currentMarket });
    scrollToBooking();
  });

  els.btnShareCompare?.addEventListener("click", shareComparison);

  els.mobileBestRideBtn?.addEventListener("click", () => {
    if (lastBestProviderId) {
      openProvider(lastBestProviderId);
    }
  });

  els.mobileCompareBtn?.addEventListener("click", scrollToAvailable);

  els.marketSelect?.addEventListener("change", () => {
    currentMarket = els.marketSelect.value;
    applyMarketUI();
    logEvent("market_change", { market: currentMarket });
  });

  els.rideForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = validateInputs();
    if (!values) return;

    logEvent("search_submit", { market: currentMarket });
    await refreshEstimates();
    scrollToAvailable();
  });

  if (els.waitlistForm && els.waitlistEmail && els.waitlistStatus) {
    els.waitlistForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = els.waitlistEmail.value.trim();
      const city = els.waitlistCity?.value?.trim() || "";

      if (!email) {
        els.waitlistStatus.textContent = "Please enter a valid email address.";
        return;
      }

      els.waitlistStatus.textContent = "Joining waitlist...";

      const result = await saveWaitlist(email, city);

      if (result.ok) {
        els.waitlistStatus.textContent =
          getCurrentMarketConfig().waitlistCityEnabled && city
            ? `You're on the waitlist ✅ City noted: ${city}`
            : "You're on the waitlist ✅";

        els.waitlistEmail.value = "";
        if (els.waitlistCity) els.waitlistCity.value = "";

        logEvent("waitlist_signup", {
          market: currentMarket,
          requested_city: city || null
        });
      } else {
        console.error("Waitlist error:", result.error);

        const errorText = String(result.error || "").toLowerCase();

        if (
          errorText.includes("duplicate") ||
          errorText.includes("unique") ||
          errorText.includes("already")
        ) {
          els.waitlistStatus.textContent = "This email is already on the waitlist ✅";
        } else if (errorText.includes("permission") || errorText.includes("policy")) {
          els.waitlistStatus.textContent =
            "Waitlist permissions need one small Supabase fix.";
        } else {
          els.waitlistStatus.textContent =
            "Waitlist signup failed. Please try again later.";
        }
      }
    });
  }
}

function initMobileDateTimeAssist() {
  const isSmallScreen = () => window.matchMedia("(max-width: 768px)").matches;
  const fields = [els.date, els.time].filter(Boolean);

  if (!fields.length || !els.rideForm) return;

  let autoSubmitTimer = null;

  const canAutoSubmit = () => {
    const pickup = els.pickup?.value?.trim() || "";
    const dropoff = els.dropoff?.value?.trim() || "";
    const rideDate = els.date?.value?.trim() || "";
    const rideTime = els.time?.value?.trim() || "";

    return Boolean(pickup && dropoff && rideDate && rideTime);
  };

  const autoSubmitIfReady = () => {
    if (!isSmallScreen() || !canAutoSubmit()) return;

    window.clearTimeout(autoSubmitTimer);

    autoSubmitTimer = window.setTimeout(() => {
      const values = validateInputs();
      if (!values) return;

      els.rideForm.requestSubmit();
    }, 220);
  };

  fields.forEach((field) => {
    const handleFieldComplete = () => {
      if (!isSmallScreen()) return;

      field.blur();
      autoSubmitIfReady();
    };

    field.addEventListener("change", handleFieldComplete);
    field.addEventListener("input", handleFieldComplete);
    field.addEventListener("blur", autoSubmitIfReady);
  });

  if (window.visualViewport) {
    let lastHeight = window.visualViewport.height;

    window.visualViewport.addEventListener("resize", () => {
      const currentHeight = window.visualViewport.height;
      const pickerLikelyClosed = currentHeight > lastHeight + 40;

      if (pickerLikelyClosed) {
        autoSubmitIfReady();
      }

      lastHeight = currentHeight;
    });
  }
}

window.initAutocomplete = function initAutocomplete() {
  setHelper("Start typing pickup and dropoff, then select a suggested address.");

  attachAutocomplete(els.pickup, "pickup");
  attachAutocomplete(els.dropoff, "dropoff");

  els.pickup?.addEventListener("blur", async () => {
    if (!coords.pickup && els.pickup.value.trim()) {
      const result = await geocodeAddress(els.pickup.value.trim());

      if (result) {
        coords.pickup = { lat: result.lat, lng: result.lng };
        selectedPlaces.pickup = {
          name: splitAddressLines(result.formatted).line1,
          formattedAddress: result.formatted,
          lat: result.lat,
          lng: result.lng
        };
      }
    }
  });

  els.dropoff?.addEventListener("blur", async () => {
    if (!coords.dropoff && els.dropoff.value.trim()) {
      const result = await geocodeAddress(els.dropoff.value.trim());

      if (result) {
        coords.dropoff = { lat: result.lat, lng: result.lng };
        selectedPlaces.dropoff = {
          name: splitAddressLines(result.formatted).line1,
          formattedAddress: result.formatted,
          lat: result.lat,
          lng: result.lng
        };
      }
    }
  });
};

window.__gmapsFail = function __gmapsFail() {
  setHelper("Address lookup failed to load. You can still type addresses manually.");
};

document.addEventListener("click", () => {
  document.querySelectorAll(".tooltip-box").forEach((tooltip) => {
    tooltip.style.opacity = "0";
    tooltip.style.visibility = "hidden";
    tooltip.style.pointerEvents = "none";
    tooltip.style.transform = "translateY(6px)";
  });
});

window.addEventListener("load", () => {
  hydrateFromQueryParams();
  applyMarketUI();
  hydrateRideCounter();
  setDefaultDateTime();
  initAppEvents();
  initMobileDateTimeAssist();
  logEvent("page_view", { supabaseEnabled, market: currentMarket });
});








