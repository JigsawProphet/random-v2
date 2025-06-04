// This JS should be saved as script.js and referenced by index.html
let allEntries = [];
let currentEntry = null;
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvpHHptVU9GYzDcIoolYnB9SRrFZGzvwbv4bB4-1fqqbr1gOAx6o0frWQfkGIIg9SQ/exec";

function formatInstructions(instructions) {
  const steps = instructions.split(/(?=\d+\.)/g);
  return steps.map(step => `<p>${step.trim()}</p>`).join('');
}

function populateCategoryFilter(entries) {
  const select = document.getElementById("categoryFilter");
  select.innerHTML = '<option value="">All Categories</option>';
  const categorySet = new Set();
  entries.forEach(row => {
    const cats = row["Category"]?.split(',').map(c => c.trim()) || [];
    cats.forEach(cat => categorySet.add(cat));
    if (row["Favorite"]?.toLowerCase() === "yes") {
      categorySet.add("Favorites");
    }
  });
  Array.from(categorySet).sort().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function loadCSV() {
  if (allEntries.length === 0) {
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS4LT2q5K43i62SqQbCRtJmsmCnX8g3Jsm76gW4Tuzogjy_LSgXgddCsp8eZitoqt3yRMRg1p4J3mXr/pub?output=csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true });
        allEntries = result.data.filter(row => row["Name"]);
        populateCategoryFilter(allEntries);
        showRandomEntry();
      })
      .catch(error => {
        document.getElementById('entryDisplay').innerHTML = '<p>Error loading data.</p>';
        console.error('Error fetching or parsing CSV:', error);
      });
  } else {
    showRandomEntry();
  }
}

function showRandomEntry() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filtered = selectedCategory
    ? allEntries.filter(row => {
        const cats = row["Category"]?.split(',').map(c => c.trim()) || [];
        const isFavorite = row["Favorite"]?.toLowerCase() === "yes";
        return selectedCategory === "Favorites" ? isFavorite : cats.includes(selectedCategory);
      })
    : allEntries;

  if (filtered.length === 0) {
    document.getElementById('entryDisplay').innerHTML = '<p>No entries found for selected category.</p>';
    return;
  }

  currentEntry = filtered[Math.floor(Math.random() * filtered.length)];
  const isFavorite = currentEntry["Favorite"]?.toLowerCase() === "yes";

  document.getElementById('entryDisplay').innerHTML = `
    <h2>${currentEntry["Name"]}</h2>
    <img src="${currentEntry["ImageURL"]}" alt="${currentEntry["Name"]}"><br>
    <p><strong>Description:</strong> ${currentEntry["Description"]}</p>
    <div><strong>Instructions:</strong>${formatInstructions(currentEntry["Instructions"])} </div>
    <div class="favorite-indicator">${isFavorite ? "★ Favorited" : ""}</div>
    <button onclick="toggleFavorite()">${isFavorite ? "Remove from Favorites" : "Mark as Favorite"}</button>
  `;
}

function toggleFavorite() {
  if (!currentEntry) return;
  const formData = new URLSearchParams();
  formData.append("name", currentEntry["Name"]);

  fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData
  })
    .then(response => response.text())
    .then(result => {
      alert(result);
      allEntries = []; // clear cache so next call reloads updated sheet
      loadCSV();
    })
    .catch(error => {
      alert("Error toggling favorite: " + error);
      console.error("Toggle Favorite Error:", error);
    });
}

window.addEventListener('DOMContentLoaded', () => {
  fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS4LT2q5K43i62SqQbCRtJmsmCnX8g3Jsm76gW4Tuzogjy_LSgXgddCsp8eZitoqt3yRMRg1p4J3mXr/pub?output=csv')
    .then(response => response.text())
    .then(csvText => {
      const result = Papa.parse(csvText, { header: true });
      allEntries = result.data.filter(row => row["Name"]);
      populateCategoryFilter(allEntries);
    });
});
