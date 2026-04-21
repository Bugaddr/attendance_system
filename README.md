# Secure Web-Based Attendance System

A secure, real-time web-based attendance system designed for educational institutions. Teachers can generate dynamic, time-limited QR codes, and students can check in securely using their smartphones.

## Key Features

- **Dynamic QR Codes**: Time-limited QR codes to prevent unauthorized sharing.
- **Geofencing & Location Validation**: Ensures students are physically present in the classroom by comparing their GPS coordinates with the teacher's location.
- **Identity Verification**: Requires photo capture during the check-in process to prevent proxy attendance.
- **Teacher Dashboard**: Real-time grid-based live attendance cards (similar to Google Meet UI) to monitor active sessions.
- **Secure Architecture**: Built with modern web technologies and deployed securely on the edge.

## Tech Stack

- **Frontend**: React, Vite
- **Maps & Geolocation**: Leaflet (`react-leaflet`)
- **QR Code Scanning**: HTML5-QRCode
- **Icons**: Lucide React
- **Backend & Database**: Cloudflare Pages Functions, Cloudflare D1 (SQLite)

## Setup Instructions

### Prerequisites

- Node.js installed
- Cloudflare Wrangler CLI (`npm i -g wrangler`)

### Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Initialize the local database:
   ```bash
   npx wrangler d1 execute attendance-db --local --file=./schema.sql
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

1. Create a Cloudflare D1 database:
   ```bash
   npx wrangler d1 create attendance-db
   ```
   *(Update `wrangler.toml` with the generated database ID if necessary).*

2. Apply the schema to the remote database:
   ```bash
   npx wrangler d1 execute attendance-db --remote --file=./schema.sql
   ```

3. Deploy using the included script:
   ```bash
   ./deploy.sh
   ```

## License

MIT License
