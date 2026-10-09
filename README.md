# WeChat — Real-Time Chat Application
LIVE- chat-app-wine-ten-36.vercel.app

WeChat is a real-time communication application built with React, Node.js, Express, and WebSockets. It allows users to exchange messages instantly, make audio and video calls, and share images.

The application uses WebRTC for real-time audio/video communication and Docker to containerize the frontend and backend, making deployment and self-hosting easier.

## Features

- **Real-Time Messaging:** Send and receive messages instantly using WebSockets.
- **Audio Calling:** Make real-time voice calls using WebRTC.
- **Video Calling:** Communicate face-to-face through real-time video and audio.
- **WebRTC Signaling:** Exchange call setup information through WebSockets.
- **User Authentication:** Authenticate users using JSON Web Tokens (JWT).
- **Image Sharing:** Upload and share images using Cloudinary.
- **Database Integration:** Store application data in MongoDB Atlas.
- **Containerized Deployment:** Run the frontend and backend using Docker.
- **Cloud Deployment:** Deploy the frontend and backend to publicly accessible hosting platforms.

## Tech Stack

| Component           | Technology              |
| ------------------- | ----------------------- |
| Frontend            | React, Vite, JavaScript |
| Backend             | Node.js, Express.js     |
| Real-Time Messaging | WebSockets              |
| Audio/Video Calling | WebRTC                  |
| Signaling           | WebSockets              |
| Database            | MongoDB Atlas           |
| Authentication      | JSON Web Tokens (JWT)   |
| Image Storage       | Cloudinary              |
| File Uploads        | Multer                  |
| Containerization    | Docker                  |
| Frontend Hosting    | Vercel                  |
| Backend Hosting     | Render                  |

## Architecture

The application uses a frontend, backend, and external services for persistence and media storage.

- **Frontend:** Handles the user interface, messaging, and audio/video call controls.
- **Backend:** Manages API requests, authentication, real-time messaging, and WebRTC signaling.
- **MongoDB Atlas:** Stores application data.
- **Cloudinary:** Stores uploaded images.
- **WebRTC:** Establishes real-time audio/video communication between users.

```text
                    User A
                       |
                 React Frontend
                       |
                HTTP / WebSocket
                       |
                 Express Backend
                  /           \
          MongoDB Atlas     Cloudinary
                       |
                WebRTC Signaling
                       |
                    User B
                       |
                 React Frontend

           User A <---- WebRTC ----> User B
                    Audio / Video
```

WebSockets are used to exchange signaling information needed to establish WebRTC calls. WebRTC then carries the audio/video media between peers when a direct connection is possible. Depending on network conditions, a TURN relay may be needed.

## Getting Started

### Prerequisites

For local development, you will need:

- Node.js and npm
- A MongoDB Atlas account
- A Cloudinary account
- Git

For containerized deployment, install Docker Desktop or Docker Engine with the Docker Compose plugin.

## Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/VaibhavPatidar26/ChatApp.git
cd ChatApp
```

Adjust the directory names below if your project uses a different structure.

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd server
npm install
```

Create a `.env` file in the backend directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=3000
```

Use the exact environment variable names referenced by your backend code. Add any additional variables required by your implementation.

Start the backend using the script defined in your backend `package.json`, for example:

```bash
npm run dev
```

### 3. Set Up the Frontend

Open a separate terminal and navigate to the frontend directory:

```bash
cd client/sockets
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

Ensure that the backend is running, MongoDB Atlas is reachable, and the backend CORS configuration permits the frontend origin.

## Run Using Docker

The application is available as prebuilt Docker images, allowing users to run it without cloning the application source code.

### Option 1: Docker Compose

Download the deployment files containing `compose.yaml` and the environment-variable examples. Create your own `backend.env` and `frontend.env` files with valid configuration values.

Example `frontend.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Example `backend.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=3000
```

Pull the images and start the containers:

```bash
docker compose pull
docker compose up -d
```

Open the frontend:

`http://localhost:5173`

The backend is exposed on port `3000`.

View logs:

```bash
docker compose logs -f
```

Stop the containers:

```bash
docker compose down
```

### Option 2: Run Individual Containers

Pull the published images:

```bash
docker pull vaibhav2201/wechat_frontend:latest
docker pull vaibhav2201/wechat_backend:latest
```

Create the required environment files, then start the backend:

```bash
docker run -d \
  --name wechat_backend \
  --env-file backend.env \
  -p 3000:3000 \
  vaibhav2201/wechat_backend:latest
```

Start the frontend:

```bash
docker run -d \
  --name wechat_frontend \
  --env-file frontend.env \
  -p 5173:5173 \
  vaibhav2201/wechat_frontend:latest
```

Visit `http://localhost:5173` in your browser.

**Docker deployment notes:**

- These commands assume the frontend container runs a Vite server on port `5173` and the backend listens on port `3000`.
- The frontend's backend URL must be reachable from the browser. A Docker Compose service name such as `backend` generally works between containers, but not directly from the user's browser.
- If the frontend image contains a production Vite build, `VITE_BACKEND_URL` is normally embedded at build time. Runtime environment variables alone will not update that build unless runtime configuration has been implemented.
- MongoDB Atlas and Cloudinary are external services, so they must be configured with valid credentials.

## Environment Variables

Configure your own credentials before starting the application.

| Variable                | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `VITE_BACKEND_URL`      | Backend URL used by the frontend                        |
| `MONGODB_URI`           | MongoDB Atlas connection string                         |
| `JWT_SECRET`            | Secret used for JWT signing and verification            |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                                   |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                                      |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                                   |
| `PORT`                  | Backend listening port, if supported by the application |

Never commit real credentials, API secrets, or environment files containing sensitive values to version control. Provide safe example files with placeholders instead.

## Deployment

### Frontend

The React + Vite frontend can be deployed on Vercel.

1. Import the frontend repository into Vercel.
2. Set the root directory to the folder containing the frontend `package.json`.
3. Configure the build command as `npm run build`.
4. Set the output directory to `dist`.
5. Configure `VITE_BACKEND_URL` to point to the publicly accessible backend URL.
6. Deploy the application.

### Backend

The Express backend can be deployed on Render or another Docker-compatible hosting platform.

1. Deploy the backend using the repository or the published Docker image.
2. Configure the required environment variables.
3. Ensure the application listens on the port provided by the hosting platform, where applicable, and binds to `0.0.0.0`.
4. Configure CORS to allow requests from the deployed frontend.
5. Verify that HTTP requests and WebSocket connections work over the public URL.

For secure public deployment, use HTTPS for HTTP traffic and `wss://` for WebSocket connections.

### WebRTC Networking

Successful audio/video calling depends on network connectivity between peers. Depending on the implementation and deployment environment, STUN and TURN servers may be required to establish reliable connections across NATs and restrictive networks.

## Docker Images

The published Docker images are available on Docker Hub:

- **Frontend:** [vaibhav2201/wechat_frontend](https://hub.docker.com/r/vaibhav2201/wechat_frontend)
- **Backend:** [vaibhav2201/wechat_backend](https://hub.docker.com/r/vaibhav2201/wechat_backend)

Users can pull these images and run the application without cloning the application source repository.

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Submit a pull request describing your changes.

Use your own development credentials and keep sensitive configuration out of version control.

## Security

- Never commit secrets or production credentials.
- Use strong, unique JWT secrets.
- Restrict database access to trusted sources where practical.
- Configure CORS for trusted frontend origins.
- Validate user input and uploaded files.
- Use HTTPS and secure WebSocket connections in production.
