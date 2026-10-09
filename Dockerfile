# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY HotelBooking.Api/*.csproj HotelBooking.Api/
COPY HotelBooking.Data/*.csproj HotelBooking.Data/
COPY HotelBooking.Core/*.csproj HotelBooking.Core/
RUN dotnet restore HotelBooking.Api/HotelBooking.Api.csproj
COPY . .
RUN dotnet publish HotelBooking.Api/HotelBooking.Api.csproj -c Release -o /app/publish --no-restore

# ---- run ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
# Render injects $PORT; default 8080 for local `docker run`.
CMD ASPNETCORE_URLS=http://*:${PORT:-8080} dotnet HotelBooking.Api.dll
