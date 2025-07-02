# Parezar App - JSON Editor with Firebase Auth

A secure Next.js 15+ JSON editor application with Firebase authentication, built with TypeScript and shadcn/ui components.

## Features

- 🔒 **Secure Authentication**: Firebase Auth with email/password
- 📝 **JSON Editor**: Interactive JSON editing with react-json-view
- 🎨 **Modern UI**: Beautiful interface using shadcn/ui components
- 🔐 **Protected API**: Server-side Firebase Admin SDK for API security
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Firebase Auth (Client + Admin SDK)
- **JSON Editor**: Custom React component with interactive viewing
- **Deployment**: Optimized for EC2/server deployment

## Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `firebase.service.json` in the project root

### 3. Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Service Account

Copy `firebase.service.json.template` to `firebase.service.json` and fill in your actual Firebase service account credentials.

### 5. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## File Structure

```
parezar-app/
├── firebase.service.json          # Firebase Admin credentials
├── firebase.service.json.template # Template for service account
├── data/
│   └── myfile.json               # JSON data file
├── lib/
│   ├── firebaseClient.ts         # Firebase client setup
│   ├── firebaseAdmin.ts          # Firebase Admin setup
│   └── utils.ts                  # Utility functions
├── components/ui/                # shadcn/ui components
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Auth redirect logic
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── editor/
│   │   └── page.tsx            # JSON editor page
│   └── api/
│       └── config/
│           └── route.ts        # Protected API routes
└── docs/                       # Documentation
```

## Usage

1. **Authentication**: Sign in with your Firebase credentials
2. **Edit JSON**: Use the interactive editor to modify the JSON structure
3. **Save Changes**: Click "Save Changes" to persist your modifications
4. **Sign Out**: Use the sign out button to end your session

## Security Features

- **Protected Routes**: All editor routes require authentication
- **Server-side Verification**: API routes verify Firebase ID tokens
- **Secure File Operations**: JSON file operations are protected by authentication
- **Error Handling**: Comprehensive error handling for auth and API failures

## Deployment

### EC2 Deployment

1. **Server Setup**:
   ```bash
   # Install Node.js and npm
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Application Deployment**:
   ```bash
   # Clone and setup
   git clone <your-repo>
   cd parezar-app
   npm install
   npm run build
   
   # Set file permissions
   chmod 644 data/myfile.json
   chmod 600 firebase.service.json
   ```

3. **Environment Setup**:
   - Create `.env.local` with your Firebase config
   - Ensure `firebase.service.json` is properly configured
   - Verify file permissions for `data/myfile.json`

4. **Start Application**:
   ```bash
   npm start
   # Application will run on port 3000
   ```

### Process Management (Optional)

Use PM2 for production process management:

```bash
npm install -g pm2
pm2 start npm --name "parezar-app" -- start
pm2 save
pm2 startup
```

## Troubleshooting

### Common Issues

1. **Firebase Auth Errors**: Verify your Firebase config and service account key
2. **Permission Denied**: Check file permissions on `data/myfile.json`
3. **Dependency Conflicts**: Run `npm install --legacy-peer-deps` if you encounter peer dependency issues
4. **Module Not Found**: Run `npm install --legacy-peer-deps` to ensure all dependencies are installed
5. **Build Errors**: Verify TypeScript configuration and imports

### Logs

Check application logs for detailed error information:
```bash
# Development
npm run dev

# Production (with PM2)
pm2 logs parezar-app
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary. 