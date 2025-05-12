async function startScraping() {
  const urlInput = document.getElementById("urlInput");
  const scrapeButton = document.getElementById("scrapeButton");
  const loadingSection = document.getElementById("loadingSection");
  const resultsSection = document.getElementById("resultsSection");
  const resultsList = document.getElementById("resultsList");

  // Get URLs from textarea and split by newline
  const urls = urlInput.value
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url && url.startsWith("https://chaldal.com/"));

  if (urls.length === 0) {
    alert("Please enter at least one valid Chaldal URL");
    return;
  }

  // Disable button and show loading
  scrapeButton.disabled = true;
  loadingSection.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  resultsList.innerHTML = "";

  try {
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    });

    const data = await response.json();

    if (data.success) {
      // Display results
      resultsList.innerHTML = data.results
        .map(
          (result) => `
            <div class="result-item ${result.error ? "error" : "success"}">
                <div class="result-info">
                    <div class="result-url">${result.url}</div>
                    ${
                      result.error
                        ? `<div class="error-message">Error: ${result.error}</div>`
                        : `<div class="success-message">✅ ${result.count} products scraped</div>`
                    }
                </div>
                <div class="result-actions">
                    ${
                      !result.error
                        ? `
                        <a href="${result.downloadUrl}" class="action-btn download" download>Download JSON</a>
                    `
                        : ""
                    }
                </div>
            </div>
          `
        )
        .join("");
      resultsSection.classList.remove("hidden");
    } else {
      alert("Error: " + (data.error || "Failed to scrape the URLs"));
    }
  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    // Re-enable button and hide loading
    scrapeButton.disabled = false;
    loadingSection.classList.add("hidden");
  }
}
