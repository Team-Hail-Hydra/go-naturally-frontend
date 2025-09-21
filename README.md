# Go Naturally — Frontend

> **Immersive Eco-Learning Experience Built with Modern React**
> 
> A stunning **Vite + React + TypeScript** application featuring **3D avatars**, **interactive maps**, **gamification**, and **AI-powered environmental tracking** that transforms sustainability into an engaging adventure.
> 
---

## 🚀 Quick Overview

### 🛠️ **Tech Stack**
- ⚡ **Vite** — Lightning-fast build tool
- ⚛️ **React** — Modern UI library
- 🔷 **TypeScript** — Type-safe development
- 🎨 **Tailwind CSS** — Utility-first styling
- 🗺️ **Mapbox** — Interactive map features
- 🧑‍🎨 **ReadyPlayerMe** — 3D avatar animations

### 📁 **Entry Points**
- 🌐 [`index.html`](./index.html) / [`src/main.tsx`](./src/main.tsx)
- 🎨 [`src/index.css`](./src/index.css), [`src/App.css`](./src/App.css)
- 🔥 **Dev Server**: Vite with Hot Module Replacement

---

## ✨ Features

### 🏠 **Landing Page**
- 🎬 **Background Video** with SRT subtitles
- 📊 **Animated Counters** showing environmental impact
- 🌌 **Parallax Images** for immersive scrolling

### 👤 **User Onboarding**
- 🎯 **Multi-step Registration** flow
- 🏢 **Organization Management** (join/create schools & NGOs)
- 🎭 **Role Selection** (Student, Teacher, NGO)

### 🎮 **Interactive Game Page**
- 🕹️ **Browser-based Gaming** mechanics
- 🏆 **EcoPoints System** for engagement
- 📈 **Progress Tracking** and achievements

### 🧑‍🎨 **Avatar Creation**
- 🎨 **ReadyPlayerMe Integration** for 3D avatars
- 🎭 **Custom Layer System** for personalization
- 📸 **Avatar Upload** functionality

### 🗺️ **Interactive Map Interface**
- 📍 **Dynamic Markers** for plants, animals & litter
- 💡 **Lighting Presets** for visual appeal
- 🌍 **Real-time Environmental Data**

### 🌿 **Plant Upload System**
- 📸 **AI-powered Plant Recognition**
- 📍 **Geolocation Tagging**
- 🏆 **Automatic EcoPoints Rewards**

### 🎨 **UI Components**
- 🧩 **Reusable Primitives** (buttons, cards, inputs)
- 🔔 **Toast Notification System**
- 📱 **Mobile-responsive Design**

---

## 📂 Project Structure

```
📁 Go Naturally Frontend
├── 🌐 index.html                 # HTML entry point
├── ⚙️ vite.config.ts            # Vite configuration
├── 📦 package.json              # Scripts & dependencies
├── 📁 src/
│   ├── 🚀 main.tsx              # React bootstrap
│   ├── 🎯 App.tsx               # Main app component
│   ├── 📄 pages/                # Route components
│   │   ├── 🏠 landing.tsx       # Landing page
│   │   ├── 👋 welcome.tsx       # Onboarding flow
│   │   ├── 👤 register.tsx      # Registration
│   │   └── 🎮 game.tsx          # Game interface
│   ├── 🧩 components/           # Reusable components
│   │   ├── 🗺️ Map.tsx           # Interactive map
│   │   ├── 🧑‍🎨 AvatarCreator.tsx # Avatar creation
│   │   ├── 🌿 PlantUpload.tsx   # Plant upload UI
│   │   └── 🎨 ui/               # UI primitives
│   ├── 🎨 assets/               # Fonts, logos, images
│   └── 🛠️ utils/               # Helper functions
├── 📁 public/                   # Static assets
│   ├── 🎬 videos/               # Background videos
│   ├── 📝 subtitles/            # SRT subtitle files
│   └── 🖼️ images/               # Static images
```

### 🌟 **Notable Files**
- 📝 `public/go_naturally_landing_video.srt` — Landing page subtitles
- 🎬 `src/constants/landing_page_video_subtitles.ts` — Subtitle parser
- 🔧 `src/utils/srtParser.ts` — SRT parsing utilities
- 🔐 `src/utils/supabase.ts` — Supabase integration
- 🎭 `src/utils/ReadyPlayerMeAnimationLibrary.ts` — Avatar animations
- 💡 `src/utils/LightPresetManager.ts` — Dynamic map lighting
- 👥 `src/constants/team.ts` — Team member information

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

### 🔗 **API Configuration**
```env
VITE_API_URL=http://localhost:3000        # 🖥️ Backend API URL
```

### 🔐 **Supabase Configuration**
```env
VITE_SUPABASE_URL=your_supabase_url       # 🗄️ Supabase project URL
VITE_SUPABASE_ANON_KEY=your_anon_key      # 🔑 Supabase anonymous key
```

### 🗺️ **External Services**
```env
VITE_MAPBOX_TOKEN=your_mapbox_token       # 🗺️ Mapbox access token
VITE_READYPLAYERME_SUBDOMAIN=your_subdomain # 🧑‍🎨 Avatar service
```

💡 **Note**: Vite requires client-side variables to be prefixed with `VITE_`

---

## 🎯 Scripts

### 🔧 **Development Commands**

```bash
# 📦 Install dependencies
npm install

# 🔥 Start development server (with HMR)
npm run dev

# 🏗️ Build for production
npm run build

# 👀 Preview production build
npm run preview

# 🧹 Run code linting
npm run lint
```

### 🚀 **Quick Start**

```bash
# 1️⃣ Clone and install
git clone <repository-url>
cd go-naturally-frontend
npm install

# 2️⃣ Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3️⃣ Launch development server
npm run dev
```

🎉 **Ready!** Visit `http://localhost:5173` to see your app in action!

---

## 💡 Development Notes

### 🎬 **Landing Page Features**
- **Background Video**: Auto-playing with SRT subtitle overlay
- **Smooth Animations**: Intersection Observer for scroll-triggered effects
- **Performance**: Optimized video loading and lazy components

### 🧩 **Component Architecture**
- **UI Primitives**: Reusable components in `src/components/ui/`
- **Feature Components**: Complex components with business logic
- **Custom Hooks**: Shared state management and utilities

### 🧑‍🎨 **Avatar System**
- **ReadyPlayerMe Integration**: 3D avatar creation and animation
- **Custom Layers**: Additional personalization options
- **Performance**: Optimized 3D rendering with caching

### 🗺️ **Map Integration**
- **Mapbox GL JS**: High-performance vector maps
- **Dynamic Lighting**: Real-time lighting presets
- **Custom Markers**: Eco-friendly marker designs

### 🔐 **Authentication Flow**
- **Supabase Auth**: Secure user authentication
- **Role-based Access**: Student, Teacher, NGO permissions
- **Token Management**: Automatic token refresh

---

## 🏭 Building for Production

### 1️⃣ **Configure Environment**
```bash
# Production environment variables
VITE_API_URL=https://your-api-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
# ... other production values
```

### 2️⃣ **Build Application**
```bash
npm run build  # 🏗️ Creates optimized build in dist/
```

### 3️⃣ **Deploy Static Assets**
Deploy the `dist/` folder to:
- 🌐 **Netlify** — Drag & drop or Git integration
- ⚡ **Vercel** — Automatic deployments
- 🐙 **GitHub Pages** — Free static hosting
- 🌩️ **CloudFlare Pages** — Edge deployment

---

## 🔌 Third-party Integrations

### 🗄️ **Supabase**
- 🔐 **Authentication** — User management and JWT tokens
- 💾 **Database** — PostgreSQL with real-time subscriptions
- 📁 **Storage** — File uploads and CDN

### 🧑‍🎨 **ReadyPlayerMe**
- 🎭 **Avatar Creation** — 3D character customization
- 🎬 **Animations** — Pre-built animation library
- 📱 **Cross-platform** — Web and mobile support

### 🗺️ **Mapbox**
- 🌍 **Interactive Maps** — Vector-based mapping
- 📍 **Geocoding** — Address to coordinates conversion
- 🎨 **Custom Styling** — Branded map themes

---

## 🎯 Where to Start

### 🔍 **Explore the Codebase**
1. 🚀 **Bootstrap**: Start with `src/main.tsx`
2. 🏠 **Landing**: Check out `src/pages/landing.tsx`
3. 👋 **Onboarding**: Review `src/pages/welcome.tsx`
4. 🗺️ **Maps**: Dive into `src/components/Map.tsx`
5. 👥 **Team**: See `src/constants/team.ts`

### 🛠️ **Development Workflow**
1. 📝 **Plan**: Check issues and project board
2. 🌿 **Branch**: Create feature branch from `main`
3. 💻 **Code**: Follow TypeScript and React best practices
4. 🧪 **Test**: Run linting and manual testing
5. 🔄 **PR**: Submit pull request with detailed description

---

## 🆘 Support & Contact

- 🐛 **Issues**: [GitHub Issues](https://github.com/Team-Hail-Hydra/go-naturally-frontend/issues)
- 💬 **Discussions**: Join our community chat
- 🔒 **Security**: Contact maintainers directly for sensitive issues
- 📚 **Docs**: Check our [Wiki](https://github.com/Team-Hail-Hydra/go-naturally-frontend/wiki)

---
## Demo Video
[![Youtube Video](https://github.com/user-attachments/assets/83a5c5d2-5a9d-47db-baae-af84da3f0608)](https://www.youtube.com/watch?v=Ibk7X8G6O_I)
---
## 🏆 Why Go Naturally Frontend?

> **🌟 Next-Generation Environmental Engagement Platform**
> 
> Built with cutting-edge web technologies, stunning visuals, and gamification mechanics that make sustainability irresistibly engaging.

### ✨ **Key Highlights**
- 🎨 **Stunning UI/UX** — Award-winning design principles
- ⚡ **Lightning Fast** — Vite-powered development & deployment
- 🎮 **Gamified Experience** — EcoPoints, leaderboards & achievements
- 🤖 **AI-Powered** — Smart plant/animal recognition
- 📱 **Mobile-First** — Responsive design for all devices
- 🌍 **Global Ready** — Internationalization support
- ♿ **Accessible** — WCAG 2.1 compliant
- 🔒 **Secure** — Enterprise-grade security practices

### 🎯 **Perfect For**
- 🏫 **Educational Institutions** — Engaging environmental curriculum
- 🌱 **NGOs** — Community-driven sustainability initiatives  
- 👨‍🎓 **Students** — Interactive learning and real-world impact
- 🏢 **Organizations** — Corporate sustainability programs

---

**🌍 Go Naturally — Frontend** is the client-facing interface for the Go Naturally platform, helping communities engage in ecological initiatives, events, and gamified actions. Designed for scalability and ease of use, it leverages modern web technologies and integrations to deliver a rich, interactive experience.

**Built with 💚 by Team Hail Hydra | Smart India Hackathon 2025**
