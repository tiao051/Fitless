# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file
COPY ["Fitly.API.csproj", "./"]
RUN dotnet restore "Fitly.API.csproj"

# Copy source code
COPY . .
RUN dotnet build "Fitly.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Fitly.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 5062
ENV ASPNETCORE_URLS=http://+:5062
ENTRYPOINT ["dotnet", "Fitly.API.dll"]
