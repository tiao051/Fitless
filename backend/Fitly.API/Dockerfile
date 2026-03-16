# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file
COPY ["backend/Fitly.API/Fitly.API.csproj", "./"]
RUN dotnet restore "Fitly.API.csproj"

# Copy source code
COPY backend/Fitly.API/ ./
RUN dotnet build "Fitly.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Fitly.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Create log directories
RUN mkdir -p /app/logs/api

COPY --from=publish /app/publish .

# Copy CSV data file for seeding
COPY scripts/data/fitly_data.csv ./data/

EXPOSE 5062
ENV ASPNETCORE_URLS=http://+:5062
ENTRYPOINT ["dotnet", "Fitly.API.dll"]
