console.log("script.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");
  const form = document.getElementById("rideForm");

  // Initialize Google Autocomplete safely
  try {
    if (google && google.maps && google.maps.places) {
      const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput);
      const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput);

      console.log("Autocomplete initialized");
    }
  } catch (err) {
    console.warn("Google Maps Autocomplete failed:", err.message);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const pickup = pickupInput.value.trim();
    const dropoff = dropoffInput.value.trim();
    const date = document.getElementById("rideDate").value;
    const time = document.getElementById("rideTime").value;

    console.log("Form submitted:", { pickup, dropoff, date, time });

    if (!pickup || !dropoff) {
      alert("Please enter pickup and dropoff addresses");
      return;
    }

    // Demo coords (replace with geocoding if needed)
    const pickupLat = 37.775;
    const pickupLng = -122.418;
    const dropLat = 37.785;
    const dropLng = -122.406;

    const uberURL = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}`;
    const lyftURL = `https://www.lyft.com/i/ELVIS98387&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&destination[latitude]=${dropLat}&destination[longitude]=${dropLng}`;

    console.log("Uber deep link:", uberURL);
    console.log("Lyft deep link:", lyftURL);

    // Update buttons
    document.getElementById("uberLink").href = uberURL;
    document.getElementById("lyftLink").href = lyftURL;

    document.getElementById("rideOptions").scrollIntoView({ behavior: "smooth" });
  });
});
