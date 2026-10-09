export const environment = {
  production: true,
  // TODO: point this at your hosted API, e.g. 'https://kudzis-api.azurewebsites.net/api'.
  // Vercel cannot host ASP.NET Core — deploy HotelBooking.Api to Azure/App Service
  // (or any .NET host) with a SQL database, enable CORS for your Vercel domain,
  // then put that URL here and redeploy.
  apiBaseUrl: 'https://YOUR-API-HOST/api',
};
