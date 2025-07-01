const config = {
  authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your Directory (tenant) ID
  clientId: "YOUR_CLIENT_ID", // Replace with your Application (client) ID
  redirectUri: window.location.origin,
  listUrl: "https://graph.microsoft.com/v1.0/sites/YOUR_SHAREPOINT_SITE/lists/YOUR_LIST_ID/items", // Replace with your list's Graph API URL
  cacheLocation: "sessionStorage",
};

const graphService = (() => {
  let msalInstance;

  async function initialize() {
    msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        redirectUri: config.redirectUri,
      },
      cache: { cacheLocation: config.cacheLocation },
    });

    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      msalInstance.setActiveAccount(response.account);
    }

    const accounts = msalInstance.getAllAccounts();
    if (!accounts.length) {
      await msalInstance.loginRedirect({
        scopes: ["https://graph.microsoft.com/Sites.ReadWrite.All"],
      });
      return false;
    }

    msalInstance.setActiveAccount(accounts[0]);
    document.getElementById(
      "auth-text"
    ).textContent = `Signed in as: ${accounts[0].username}`;
    document.getElementById("logoutButton").style.display = "inline-block";
    return true;
  }

  async function logout() {
    await msalInstance.logoutRedirect();
  }

  async function acquireToken() {
    const account = msalInstance.getActiveAccount();
    if (!account) throw new Error("No active account");

    const tokenRequest = {
      scopes: ["https://graph.microsoft.com/Sites.ReadWrite.All"],
      account: account,
    };

    try {
      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (err) {
      if (err instanceof msal.InteractionRequiredAuthError) {
        return msalInstance
          .acquireTokenPopup(tokenRequest)
          .then((resp) => resp.accessToken);
      }
      throw err;
    }
  }

  async function getListItems() {
    const token = await acquireToken();
    const url = `${config.listUrl}?expand=fields`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error(`Graph error: ${await resp.text()}`);

    const data = await resp.json();
    // Map SharePoint fields to simpler names
    return data.value.map((item) => ({
      id: item.id,
      Location: item.fields.Title,
      ForecastPeriod: item.fields.Name,
      Temperature: item.fields.Temperature,
      Unit: item.fields.TemperatureUnit,
      Forecast: item.fields.ShortForecast,
      DateTime: item.fields.DateTime,
    }));
  }

  // This function sends a POST request to the SharePoint list, which always
  // creates a new item. It does not patch or update existing items.
  // The "invalidRequest" error on a second sync usually means you have a column
  // in your SharePoint list with "Enforce unique values" enabled.
  async function addListItem(item) {
    const token = await acquireToken();

    const url = config.listUrl;
    const body = {
      fields: {
        Title: item.Title,
        LatitudeLongitude: item.LatitudeLongitude,
        Name: item.Name,
        Temperature: item.Temperature,
        TemperatureUnit: item.TemperatureUnit,
        ShortForecast: item.ShortForecast,
        DateTime: item.DateTime,
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`Graph API error: ${await resp.text()}`);
    }
    return await resp.json();
  }

  async function getWeatherFromServer() {
    // This function calls our new backend API
    const resp = await fetch("/api/syncWeather");
    if (!resp.ok) {
      throw new Error(`API error: ${await resp.text()}`);
    }
    return await resp.json();
  }

  return { initialize, logout, getListItems, addListItem, getWeatherFromServer };
})();
