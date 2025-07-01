document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("logoutButton")
    .addEventListener("click", () => graphService.logout());
  document.getElementById("syncButton").addEventListener("click", syncWeather);
  loadDataAndInitialize();
});

const statusElement = document.getElementById("status");
const tableBody = document.getElementById("tableBody");

async function loadDataAndInitialize() {
  statusElement.textContent = "Initializing and authenticating...";
  try {
    const ready = await graphService.initialize();
    if (ready) {
      await refreshTableData();
    }
  } catch (err) {
    statusElement.textContent = `Error during initialization: ${err.message}`;
    statusElement.style.color = "red";
  }
}

async function refreshTableData() {
  statusElement.textContent = "Loading weather data from SharePoint...";
  statusElement.style.color = "#555";
  statusElement.style.display = "block";

  try {
    const items = await graphService.getListItems();
    renderTable(items);
    statusElement.style.display = "none";
  } catch (err) {
    statusElement.textContent = `Error loading data: ${err.message}`;
    statusElement.style.color = "red";
  }
}

function renderTable(items) {
  tableBody.innerHTML = "";
  if (items.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6">No weather data found. Click "Sync Weather" to get the latest.</td></tr>';
    return;
  }

  items.forEach((item) => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${item.Location || ""}</td>
      <td>${item.ForecastPeriod || ""}</td>
      <td>${item.Temperature || ""}</td>
      <td>${item.Unit || ""}</td>
      <td>${item.Forecast || ""}</td>
      <td>${item.DateTime || ""}</td>
    `;
  });
}

async function syncWeather() {
  const syncButton = document.getElementById("syncButton");
  syncButton.disabled = true;
  statusElement.style.display = "block";
  statusElement.style.color = "#555";

  try {
    // Fetch fresh weather data from our server
    statusElement.textContent = "Fetching latest weather data from server...";
    const weatherItems = await graphService.getWeatherFromServer();

    if (weatherItems.length === 0) {
      statusElement.textContent = "Server did not return any weather data.";
      return;
    }

    // Always append items in SharePoint
    statusElement.textContent = `Syncing ${weatherItems.length} locations to SharePoint...`;
    let successCount = 0;
    let failCount = 0;
    let processedCount = 0;
    for (const item of weatherItems) {
      try {
        await graphService.addListItem(item);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to sync ${item.Title || item.Name}:`, err);
        statusElement.textContent = `Error syncing ${
          item.Title || item.Name
        }: ${err.message}`;
        statusElement.style.color = "red";
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Pause to show the error
      }
      processedCount++;
      statusElement.textContent = `Syncing... (${processedCount}/${weatherItems.length} locations processed)`;
    }

    let resultMsg = `Sync complete! ${successCount} added.`;
    if (failCount > 0) {
      resultMsg += ` ${failCount} failed.`;
      statusElement.style.color = "orange";
    } else {
      statusElement.style.color = "green";
    }
    statusElement.textContent = resultMsg + " Refreshing table...";

    // Refresh the table with the new data
    await refreshTableData();
    setTimeout(() => {
      statusElement.style.display = "none";
    }, 5000);
  } catch (err) {
    statusElement.textContent = `Sync Error: ${err.message}`;
    statusElement.style.color = "red";
    console.error(err);
  } finally {
    syncButton.disabled = false;
  }
}
