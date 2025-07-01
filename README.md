# Sample Weather App

This document walks you through the setup of a sample project. The purpose of this project and this guide is to provide a clear, step-by-step example of how to build and deploy a simple, secure web application with a backend API. This project is a simple weather dashboard that displays weather data for five U.S. cities. The data is stored in a Microsoft List and the application is a secure web app built using Azure Static Web Apps, with an API backend using Azure Functions. The site is secured using Microsoft Authentication Library (MSAL) for Azure Active Directory (Azure AD).

This project is intended as a simple example of how to:

  * Create a secure web application that accesses data from Microsoft 365 (a Microsoft List).
  * Use an Azure Function to create a backend API that fetches data from an external, unauthenticated API.
  * Deploy a full-stack application using Azure Static Web Apps and GitHub.

## How It Works

The application is composed of a frontend and a backend API.

### Frontend

The frontend is a static web application built with **HTML, CSS, and vanilla JavaScript**. It is responsible for:

  * **Authentication**: It uses the [Microsoft Authentication Library for JavaScript (MSAL.js)](https://github.com/AzureAD/microsoft-authentication-library-for-js) to sign in users with their Azure AD accounts.
  * **Data Display**: It fetches weather data from a Microsoft List using the **Microsoft Graph API** and displays it in a table.

### Backend

The backend is a serverless **Azure Function** written in **Python**. It has a single API endpoint: `/api/syncWeather`

When this endpoint is called, the function:

1.  Fetches the latest weather forecast for five predefined U.S. cities from the public and unauthenticated [National Weather Service API](https://www.weather.gov/documentation/services-web-api).
2.  Adds the retrieved weather data as new items to the Microsoft List.

## Setup Instructions

Follow these steps to set up the Weather Dashboard in your own environment.

### Step 1: Prerequisites

  * A **GitHub account**.
  * An **Azure account** with an active subscription. *Credit card required, but zero cost when using Free tier Static Web App.
  * Access to create a **Microsoft List** (requires a Microsoft 365 subscription with SharePoint).

### Step 2: Create a Microsoft List

You need to create a Microsoft List to store the weather data.

1.  Go to your SharePoint site and create a new list.
2.  Name the list whatever you like.
3.  Add the following columns to your list with the specified types:

| Column Name | Type |
| --- | --- |
| Title | Single line of text |
| LatitudeLongitude | Single line of text |
| Name | Single line of text |
| Temperature | Number |
| TemperatureUnit | Single line of text |
| ShortForecast | Single line of text |
| DateTime | Single line of text |

### Step 3: App Registration in Azure AD

You need to register an application in Azure AD to get a **Client ID** for authentication.

1.  Go to the **Azure portal** and navigate to **Azure Active Directory**.
2.  Go to **App registrations** and click **New registration**.
3.  Give your application a name (e.g., "Weather Dashboard").
4.  For **Supported account types**, select **"Accounts in this organizational directory only (Default Directory only - Single tenant)"**.
5.  For the **Redirect URI**, select **Single-page application (SPA)** and enter the URL of your Azure Static Web App. You won't have this URL yet, so for now, you can enter `http://localhost:3000`. You will update this later.
6.  Click **Register**.
7.  Once registered, copy the **Application (client) ID** and **Directory (tenant) ID**. You'll need these for the next step.
8.  Go to **API permissions** for your new app registration.
9.  Click **Add a permission** and select **Microsoft Graph**.
10. Select **Delegated permissions**.
11. Search for and add the `Sites.ReadWrite.All` permission.
12. Click **Add permissions**.
13. Click the **Grant admin consent for [Your Tenant Name]** button.

### Step 4: Configure the Frontend

You need to update the frontend code with your Azure AD App Registration details and the URL of your Microsoft List.

1.  In the `graph-service.js` file, update the `config` object with your details:

    ```javascript
    const config = {
      authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your Directory (tenant) ID
      clientId: "YOUR_CLIENT_ID", // Replace with your Application (client) ID
      redirectUri: window.location.origin,
      listUrl: "https://graph.microsoft.com/v1.0/sites/YOUR_SHAREPOINT_SITE/lists/YOUR_LIST_ID/items", // Replace with your list's Graph API URL
      cacheLocation: "sessionStorage",
    };
    ```

    To get your `listUrl`, you can use the Microsoft Graph Explorer. You'll need to find the ID of your SharePoint site and the ID of your list.

### Step 5: Fork and Upload to GitHub

1.  Fork this repository to your own GitHub account.
2.  If you have the project files locally, create a new repository on GitHub and upload the files.

### Step 6: Deploy to Azure Static Web Apps

Now you will deploy the application to Azure Static Web Apps.

1.  Go to the **Azure portal** and search for **Static Web Apps**.
2.  Click **Create**.
3.  Select your **Subscription** and a **Resource Group**.
4.  Enter a **Name** for your Static Web App.
5.  Choose a **Region**.
6.  For **Deployment details**, select **GitHub**.
7.  Sign in to GitHub and select your **Organization**, **Repository**, and **Branch**.
8.  For **Build Presets**, select **Custom**.
9.  Set the **App location** to `/`.
10. Set the **Api location** to `api`.
11. Set the **Output location** to `/`.
12. Click **Review + create**, and then **Create**.
13. Once the Static Web App is deployed, it will give you a URL. Copy this URL.
14. Go back to your **Azure AD App registration** -\> **Authentication** and add this new URL as a **Single-page application (SPA)** redirect URI.

## Usage

Once deployed, you can navigate to your Azure Static Web App URL. You will be prompted to sign in with your Azure AD account. After signing in, you will see the weather dashboard. Click the "Sync Weather" button to fetch the latest weather data.

## Editing

As requested, to keep things simple, all code editing can be done directly in GitHub. Any changes pushed to your main branch will automatically trigger a new deployment to your Azure Static Web App.
