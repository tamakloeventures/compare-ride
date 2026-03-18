const CONFIG = window.RIDECOMPARE_CONFIG || {};

const SUPABASE_URL = CONFIG.https://prglhlctcswjccajsvxr.supabase.co || ";
const SUPABASE_ANON_KEY = CONFIG.sb\_publishable\_BM9ApnCCqHYai5ZaZPf0Pw\_l1N4Vatk || ";
const LYFT_REFERRAL_URL = CONFIG.https://www.lyft.com/i/ELVIS98387 || "https://www.lyft.com/";

const supabaseEnabled =
  typeof window.supabase !== "undefined" &&
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("http") &&
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
  btnUber: document.getElementById("btnUber"),
  btnLyft: document.getElementById("btnLyft"),
  btnShareCompare: document.getElementById("btnShareCompare"),
  statusNote: document.getElementById("statusNote"),
  helperText: document.getElementById("helperText"),
  available: document.getElementById("available"),
  bookingCard: document.getElementById("bookingCard"),
  uberPrice: document.getElementById("uberPrice"),
  lyftPrice: document.getElementById("lyftPrice"),
  uberEta: document.getElementById("uberEta"),
  lyftEta: document.getElementById("lyftEta"),
  uberTag: document.getElementById("uberTag"),
  lyftTag: document.getElementById("lyftTag"),
  uberCard: document.getElementById("uberCard"),
  lyftCard: document.getElementById("lyftCard"),
  waitlistForm: document.getElementById("waitlistForm"),
  waitlistEmail: document.getElementById("waitlistEmail"),
  waitlistStatus: document.getElementById("waitlistStatus"),
  lyftSubtitle: document.getElementById("lyftSubtitle"),
  ridesComparedCount: document.getElementById("ridesComparedCount"),
  mobileStickyCta: document.getElementById("mobileStickyCta"),
  mobileBestRideBtn: document.getElementById("mobileBestRideBtn"),
  mobileCompareBtn: document.getElementById("mobileCompareBtn")
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

let lastBestProvider = "Uber";

const DISPLAY_COUNTER_BASE = 127;

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

function updateLyftButtonUI() {
  if (!els.btnLyft || !els.lyftSubtitle) return;

  if (isMobileDevice()) {
    els.btnLyft.textContent = "Book with Lyft";
    els.lyftSubtitle.textContent = "Open in Lyft app";
  } else {
    els.btnLyft.textContent = "Get Lyft App";
    els.lyftSubtitle.textContent = "Continue with Lyft app";
  }
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

function normalizeRideTopStructure(card) {
  if (!card) return;

  const top = card.querySelector(".ride-top");
  if (!top) return;

  const existingMain = top.querySelector(".ride-top-main");
  if (existingMain) return;

  const badge = top.querySelector(".best-badge");
  const children = Array.from(top.children).filter((child) => child !== badge);

  const main = document.createElement("div");
  main.className = "ride-top-main";

  children.forEach((child) => main.appendChild(child));
  top.prepend(main);
}

function removeExistingBestBadges() {
  document.querySelectorAll(".best-badge").forEach((badge) => badge.remove());
  document.querySelectorAll(".ride-top").forEach((top) => top.classList.remove("with-badge"));
}

function updateBestCardUI() {
  els.uberCard?.classList.remove("best-pick");
  els.lyftCard?.classList.remove("best-pick");

  removeExistingBestBadges();

  if (lastBestProvider === "Uber" && els.uberCard) {
    normalizeRideTopStructure(els.uberCard);
    els.uberCard.classList.add("best-pick");

    const top = els.uberCard.querySelector(".ride-top");
    if (top) {
      top.classList.add("with-badge");
      const badge = document.createElement("div");
      badge.className = "best-badge";
      badge.textContent = "Best Value";
      top.appendChild(badge);
    }
  }

  if (lastBestProvider === "Lyft" && els.lyftCard) {
    normalizeRideTopStructure(els.lyftCard);
    els.lyftCard.classList.add("best-pick");

    const top = els.lyftCard.querySelector(".ride-top");
    if (top) {
      top.classList.add("with-badge");
      const badge = document.createElement("div");
      badge.className = "best-badge";
      badge.textContent = "Best Value";
      top.appendChild(badge);
    }
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

async function saveWaitlist(email) {
  if (!supabaseEnabled || !sb) {
    return { ok: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await sb.from("waitlist").insert({
      email,
      source: "ridecompare_homepage"
    });

    if (error) {
      return { ok: false, error: error.message || String(error) };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
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
  return `$${min.toFixed(2)}–$${max.toFixed(2)}`;
}

function estimateFares(distanceMeters, durationSeconds) {
  const miles = milesFromMeters(distanceMeters);
  const minutes = durationSeconds / 60;

  const uberModel = {
    base: 2.5,
    perMile: 1.75,
    perMin: 0.25,
    surge: 1.0
  };

  const lyftModel = {
    base: 2.3,
    perMile: 1.8,
    perMin: 0.24,
    surge: 1.0
  };

  function calculate(model) {
    const raw =
      (model.base + model.perMile * miles + model.perMin * minutes) * model.surge;

    return {
      low: raw * 0.92,
      high: raw * 1.12
    };
  }

  return {
    uber: calculate(uberModel),
    lyft: calculate(lyftModel),
    miles,
    minutes
  };
}

function applyFareUI(estimate) {
  if (!els.uberPrice || !els.lyftPrice || !els.uberEta || !els.lyftEta) return;

  els.uberPrice.textContent = formatMoneyRange(estimate.uber.low, estimate.uber.high);
  els.lyftPrice.textContent = formatMoneyRange(estimate.lyft.low, estimate.lyft.high);

  const tripText = `Trip ~${Math.round(estimate.minutes)} min · ${estimate.miles.toFixed(1)} mi`;
  els.uberEta.textContent = tripText;
  els.lyftEta.textContent = tripText;

  const uberMid = (estimate.uber.low + estimate.uber.high) / 2;
  const lyftMid = (estimate.lyft.low + estimate.lyft.high) / 2;

  if (uberMid <= lyftMid) {
    lastBestProvider = "Uber";

    els.uberTag.textContent = "Best value";
    els.uberTag.classList.add("best");

    els.lyftTag.textContent = "Estimate";
    els.lyftTag.classList.remove("best");
  } else {
    lastBestProvider = "Lyft";

    els.lyftTag.textContent = "Best value";
    els.lyftTag.classList.add("best");

    els.uberTag.textContent = "Estimate";
    els.uberTag.classList.remove("best");
  }

  updateBestCardUI();
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

  if (els.uberPrice) els.uberPrice.textContent = "$ —";
  if (els.lyftPrice) els.lyftPrice.textContent = "$ —";
  if (els.uberEta) els.uberEta.textContent = "ETA —";
  if (els.lyftEta) els.lyftEta.textContent = "ETA —";

  if (els.uberTag) {
    els.uberTag.textContent = "Estimate";
    els.uberTag.classList.remove("best");
  }

  if (els.lyftTag) {
    els.lyftTag.textContent = "Estimate";
    els.lyftTag.classList.remove("best");
  }

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

  setHelper("Your estimates are ready. Choose Uber or Lyft to continue.");
  incrementRideCounter();

  setStatus(
    `${lastBestProvider} looks like the best value for this trip: ${els.pickup.value.trim()} → ${els.dropoff.value.trim()}`
  );

  setLoading(false);

  if (els.mobileStickyCta && isMobileDevice()) {
    els.mobileStickyCta.style.display = "flex";
  }
}

async function openUber() {
  const values = validateInputs();
  if (!values) return;

  const haveCoords = await ensureCoordsFromInputs();
  if (!haveCoords) {
    setStatus("Please enter a more complete pickup and dropoff address.");
    return;
  }

  const url = buildUberLink(values.pickup, values.dropoff);
  logEvent("ride_click", {
    provider: "Uber",
    url
  });

  window.open(url, "_blank", "noopener,noreferrer");
}

async function openLyft() {
  const values = validateInputs();
  if (!values) return;

  const haveCoords = await ensureCoordsFromInputs();
  if (!haveCoords) {
    setStatus("Please enter a more complete pickup and dropoff address.");
    return;
  }

  const deepLink = buildLyftLink(values.pickup, values.dropoff);

  if (!isMobileDevice()) {
    logEvent("ride_click", {
      provider: "Lyft",
      url: LYFT_REFERRAL_URL,
      mode: "desktop_referral"
    });

    window.open(LYFT_REFERRAL_URL, "_blank", "noopener,noreferrer");
    return;
  }

  logEvent("ride_click", {
    provider: "Lyft",
    url: deepLink,
    mode: "mobile_deeplink"
  });

  const startTime = Date.now();
  window.location.href = deepLink;

  setTimeout(() => {
    if (Date.now() - startTime < 1800) {
      window.location.href = LYFT_REFERRAL_URL;
    }
  }, 1200);
}

async function shareComparison() {
  const values = validateInputs();
  if (!values) return;

  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("pickup", values.pickup);
  url.searchParams.set("dropoff", values.dropoff);

  if (els.date?.value) {
    url.searchParams.set("rideDate", els.date.value);
  }

  if (els.time?.value) {
    url.searchParams.set("rideTime", els.time.value);
  }

  try {
    await navigator.clipboard.writeText(url.toString());
    setStatus("Comparison link copied to clipboard ✅");
    logEvent("share_compare", { url: url.toString() });
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

  if (pickup && els.pickup) els.pickup.value = pickup;
  if (dropoff && els.dropoff) els.dropoff.value = dropoff;
  if (rideDate && els.date) els.date.value = rideDate;
  if (rideTime && els.time) els.time.value = rideTime;
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
  els.btnUber?.addEventListener("click", openUber);
  els.btnLyft?.addEventListener("click", openLyft);

  els.btnCompare?.addEventListener("click", () => {
    logEvent("cta_compare_click");
    scrollToBooking();
  });

  els.btnScrollBooking?.addEventListener("click", () => {
    logEvent("cta_find_click");
    scrollToBooking();
  });

  els.btnShareCompare?.addEventListener("click", shareComparison);

  els.mobileBestRideBtn?.addEventListener("click", () => {
    if (lastBestProvider === "Uber") {
      openUber();
    } else {
      openLyft();
    }
  });

  els.mobileCompareBtn?.addEventListener("click", scrollToAvailable);

  els.rideForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = validateInputs();
    if (!values) return;

    logEvent("search_submit");
    await refreshEstimates();
    scrollToAvailable();
  });

  if (els.waitlistForm && els.waitlistEmail && els.waitlistStatus) {
    els.waitlistForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = els.waitlistEmail.value.trim();

      if (!email) {
        els.waitlistStatus.textContent = "Please enter a valid email address.";
        return;
      }

      els.waitlistStatus.textContent = "Joining waitlist...";

      const result = await saveWaitlist(email);

      if (result.ok) {
        els.waitlistStatus.textContent = "You're on the waitlist ✅";
        els.waitlistEmail.value = "";
        logEvent("waitlist_signup");
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

window.addEventListener("load", () => {
  cleanupDuplicateLogos();
  normalizeRideTopStructure(els.uberCard);
  normalizeRideTopStructure(els.lyftCard);
  updateLyftButtonUI();
  hydrateRideCounter();
  hydrateFromQueryParams();
  setDefaultDateTime();
  initAppEvents();
  logEvent("page_view", { supabaseEnabled });
});










