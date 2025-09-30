console.log("script.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const form = document.getElementById("ride-form");
  const uberBtn = document.getElementById("uber-btn");
  const lyftBtn = document.getElementById("lyft-btn");

  let pickupLocation = "";
  let dropoffLocation = "";

  // Google Places Autocomplete init function
  window.initAutocomplete = function () {
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

    console.log("Autocomplete initialized on inputs:", { pickupAutocomplete, dropoffAutocomplete });
  };

  // Handle form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Form submitted");

      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;

      console.log("Pickup:", pickupLocation || document.getElementById("pickup").value);
      console.log("Dropoff:", dropoffLocation || document.getElementById("dropoff").value);
      console.log("Date:", date, "Time:", time);

      // Uber deep link
      const uberLink = `https://m.uber.com/ul/?action=setPickup&pickup=${encodeURIComponent(
        pickupLocation
      )}&dropoff=${encodeURIComponent(dropoffLocation)}`;
      console.log("Uber deep link:", uberLink);
      uberBtn.setAttribute("href", uberLink);

      // Lyft deep link (with referral)
      const lyftLink = `https://lyft.com/ride?id=lyft&pickup=${encodeURIComponent(
        pickupLocation
      )}&destination=${encodeURIComponent(
        dropoffLocation
      )}&referralCode=ELVIS98387`;
      console.log("Lyft deep link:", lyftLink);
      lyftBtn.setAttribute("href", lyftLink);
    });
  }
});
