# Collaborative Setup Instructions

Hi there! Follow these steps to access the chat-scribe-chatlog-analyzer application remotely:

## Access Links

- **Frontend Access**: [https://3s058406-8080.euw.devtunnels.ms/](https://3s058406-8080.euw.devtunnels.ms/)
- **Backend API**: [https://3s058406-3000.euw.devtunnels.ms/](https://3s058406-3000.euw.devtunnels.ms/)

## Setup Instructions

1. Open the frontend link in your browser: [https://3s058406-8080.euw.devtunnels.ms/](https://3s058406-8080.euw.devtunnels.ms/)

2. The application should connect to the backend automatically

3. If you encounter any connection issues, try:
   - Refreshing the page
   - Clearing your browser cache
   - Ensuring you're signed in (if authentication is required)

## For Local Development (Optional)

If you're collaborating on the code, create a `.env` file with these settings:

```
# LiveShare configuration using Dev Tunnels
VITE_API_URL=https://3s058406-3000.euw.devtunnels.ms/api
VITE_BACKEND_URL=https://3s058406-3000.euw.devtunnels.ms
VITE_FRONTEND_URL=https://3s058406-8080.euw.devtunnels.ms
VITE_LIVESHARE_MODE=true
```

## Troubleshooting

If you encounter any issues:
1. Check if both services are running
2. Verify the tunnel URLs are still active
3. Contact the project owner for assistance 