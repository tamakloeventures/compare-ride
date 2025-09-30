console.log("script.js loaded");

let pickupLocation = "";
let dropoffLocation = "";

// Google Maps Autocomplete
function initAutocomplete() {
  console.log("initAutocomplete called");

  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  if (!pickupInput || !dropoffInput) {
    console.error("Pickup or Dropoff input not found");
    return;
  }

  const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput);
  const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput);

  pickupAutocomplete.addListener("place_changed", () => {
    const place = pickupAutocomplete.getPlace();
    pickupLocation = place.formatted_address || pickupInput.value;
    console.log("Pickup selected:", pickupLocation);
  });

  dropoffAutocomplete.addListener("place_changed", () => {
    const place = dropoffAutocomplete.getPlace();
    dropoffLocation = place.formatted_address || dropoffInput.value;
    console.log("Dropoff selected:", dropoffLocation);
  });
}

// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ride-form");
  const uberBtn = document.getElementById("uber-btn");
  const lyftBtn = document.getElementById("lyft-btn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Form submitted");

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    const pickup = pickupLocation || document.getElementById("pickup").value;
    const dropoff = dropoffLocation || document.getElementById("dropoff").value;

    console.log("Pickup:", pickup);
    console.log("Dropoff:", dropoff);

    // Uber deep link
    const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=${encodeURIComponent(
      pickup
    )}&dropoff=${encodeURIComponent(dropoff)}`;
    uberBtn.href = uberUrl;

    // Lyft deep link with referral
    const lyftUrl = `https://lyft.com/ride?id=lyft&pickup=${encodeURIComponent(
      pickup
    )}&destination=${encodeURIComponent(
      dropoff
    )}&referralCode=ELVIS98387`;
    lyftBtn.href = lyftUrl;

    alert("Links updated! Scroll down to 'Available Rides' to book.");
  });
});
