You are an AI assistant that generates a complete Next.js 15+ frontend in TypeScript, using the shadcn/ui component library for styling. The application must allow users to sign in with Firebase Auth, then load and edit a JSON file (hosted on the same server and exposed via a protected API route). Follow these requirements exactly:

1. **Project & Tech Stack**

   * Use Next.js 15+ with the App Router (`app/` directory).
   * All code must be in TypeScript.
   * Use shadcn/ui components (e.g., `<Button>`, `<Input>`, `<Card>`, etc.) for forms, layout, and styling.
   * Use `react-json-view` for JSON editing.
   * Use Firebase Auth for user login (email/password).
   * Include both client‐side (Firebase SDK) and server‐side (Firebase Admin SDK) setup.

2. **Firebase Setup**

   * In `lib/firebaseClient.ts`, initialize Firebase with a placeholder config object and export the `auth` instance.
   * In `lib/firebaseAdmin.ts`, initialize Firebase Admin using a service account JSON (`firebase.service.json`) and export the `admin` instance.

3. **Folder Structure**

   ```
   my-json-editor/
   ├─ firebase.service.json             ← Firebase Admin key
   ├─ next.config.js
   ├─ tsconfig.json
   ├─ package.json
   ├─ data/
   │   └─ myfile.json                   ← initial JSON (e.g., `{}`)
   ├─ lib/
   │   ├─ firebaseClient.ts             ← Firebase client init
   │   └─ firebaseAdmin.ts              ← Firebase Admin init
   └─ app/
       ├─ layout.tsx                    ← Root layout (imports shadcn globals)
       ├─ globals.css                   ← shadcn and any global styles
       ├─ page.tsx                      ← Redirect logic (checks auth state)
       ├─ login/
       │   └─ page.tsx                  ← Login screen (shadcn form, email/password)
       ├─ editor/
       │   └─ page.tsx                  ← Protected JSON editor (shadcn container)
       └─ api/
           └─ config/
               └─ route.ts              ← GET/POST handler, verifies Firebase Admin token, read/write `data/myfile.json`
   ```

4. **Root Layout (`app/layout.tsx`)**

   * Use `<html lang="en">` and a `<body>` wrapping `<>{children}</>`.
   * Import any global CSS from `globals.css`.

5. **Global Styles (`app/globals.css`)**

   * Include shadcn’s base styles (tailwind or similar) and any minimal overrides.

6. **Root Page (`app/page.tsx`)**

   * A client component (`"use client"`).
   * On mount, call `onAuthStateChanged(auth, user => { … })`.
   * If `user` exists, redirect to `/editor`; otherwise, redirect to `/login`.
   * Display a minimal “Redirecting…” message.

7. **Login Page (`app/login/page.tsx`)**

   * A client component.
   * Use shadcn/ui `<Card>`, `<Input>`, `<Label>`, `<Button>` for layout:

     * A centered card with a heading “Sign In.”
     * Two `<Input>` fields (email, password) each wrapped in `<Label>` and styled via shadcn.
     * A `<Button>` labeled “Sign In.”
   * On submit, call `signInWithEmailAndPassword(auth, email, password)`.
   * If login succeeds, the `onAuthStateChanged` handler in the root page will redirect.
   * If error, show a shadcn/ui `<Alert>` or `<Toast>` with the error message.

8. **Editor Page (`app/editor/page.tsx`)**

   * A client component.
   * Use `onAuthStateChanged` to ensure the user is signed in; if not, redirect to `/login`.
   * Once signed in, call `user.getIdToken()` to obtain the Firebase ID token.
   * Fetch JSON from `/api/config` (automatically served by our API route), attaching `Authorization: Bearer <ID_TOKEN>`.
   * Use shadcn/ui `<Card>`, `<Button>`, and `<Textarea>` (if needed) as wrappers, but embed `<ReactJson>` for the actual JSON editor inside a styled container.
   * When the user edits/adds/deletes within `<ReactJson>`, update component state.
   * Include a `<Button>` labeled “Save Changes,” which sends a `POST /api/config` request with `body: JSON.stringify(updatedJson)` and the same `Authorization` header.
   * On success, show a shadcn/ui `<Toast>` or `<Alert>` with “Saved successfully!”; on failure, show the error.

9. **API Route (`app/api/config/route.ts`)**

   * Export two functions: `export async function GET(req: Request)` and `export async function POST(req: Request)`.
   * Both must read `req.headers.get("authorization")`, verify with `await admin.auth().verifyIdToken(idToken)`, and return `401` if invalid.
   * **GET**: Read `data/myfile.json` using Node’s `fs` (synchronous or asynchronous) and return the raw JSON with `Content-Type: application/json`.
   * **POST**: Parse the request JSON (`await req.json()`), validate it’s an object, then write it back to `data/myfile.json` with `fs.writeFileSync(path, JSON.stringify(obj, null, 2));` Return a success message or error accordingly.

10. **TypeScript Types**

    * Add minimal typing for the JSON editor state, e.g. `type JsonData = Record<string, unknown>;`
    * Annotate all function parameters and return types in `route.ts` (use `NextResponse` or `Response`).
    * In client components, type `useState<JsonData | null>` and `useState<string | null>` for tokens.

11. **Error Handling & Redirects**

    * If any fetch in the editor page returns a non‐OK status, show an error via shadcn `<Alert>`.
    * If at any point `onAuthStateChanged` reports `user === null`, immediately `router.replace("/login")`.

12. **Environment Variables**

    * Use `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` for client config.
    * Load them in `lib/firebaseClient.ts` via `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`, etc.
    * Do not expose `firebase.service.json` or any secret keys to the client.

13. **Running & Deployment Instructions**

    * Explain how to install dependencies:

      ```bash
      npm install
      npm run dev   # for development
      npm run build # for production build
      npm start     # to start the server
      ```
    * Show where to place `firebase.service.json` (project root) and how to set environment variables (e.g., in `.env.local`):

      ```
      NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
      NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
      ```
    * Remind to run on EC2 (port 3000) and ensure `data/myfile.json` has correct file permissions.

14. **Shadcn/UI Integration**

    * Use shadcn’s `<Form>`, `<FormField>`, `<FormItem>`, `<FormControl>`, `<FormLabel>`, and `<FormMessage>` for the login form’s validation.
    * Wrap the editor UI in a shadcn `<Card>` with `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, and `<CardFooter>` containing the “Save” and “Sign Out” buttons.
    * Use shadcn `<ToastProvider>` (or `<AlertDialog>`) to show success/error toasts when saving or on auth errors.

---

**Generate all files** (`.tsx`, `.ts`, CSS, config) exactly as described, ensuring TypeScript types are correct, shadcn/UI imports are used, and Firebase is properly initialized. Include comments where helpful.
