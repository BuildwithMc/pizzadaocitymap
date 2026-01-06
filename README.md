# PizzaDAO Global Party Map 🌍🍕

An interactive 3D globe visualization for the PizzaDAO Global Pizza Party. This application allows users to explore pizza party events worldwide, featuring smooth animations, custom branding, and real-time event details.

![PizzaDAO Map Preview](./public/pizzadao-logo.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBuildwithMc%2FPIZZADAOMAP)

## ✨ Features

-   **3D Globe Visualization**: Immersive Mapbox GL JS globe with atmospheric fog and star background.
-   **Interactive Markers**: Custom PizzaDAO character markers for every event city.
-   **City Search**: Real-time autocomplete search to quickly find and fly to any participating city.
-   **Event Details**: Glassmorphism-styled info cards displaying:
    -   Host Name
    -   Event Status
    -   **Registration Link** (Dynamic button)
    -   **City Drive Link** (Dynamic button)
    -   Telegram Community Link
-   **Advanced View Controls**:
    -   **Zoom In/Out**: Dedicated buttons for precise navigation.
    -   **Map Modes**: Switch between **Street**, **Satellite**, and **Hybrid** views.
    -   **Theme Toggle**: Switch between **Light** and **Dark** modes (Street view).
    -   **2D/3D Toggle**: Switch between Globe and Mercator projections.
-   **Geolocation**: "Locate Me" feature that auto-flies to user's location and finds the **closest 5 parties**.
-   **Auto-Rotation**: Smooth, slow rotation when the map is idle to showcase the global scale.
-   **Responsive Design**: Fully mobile-responsive UI with Tailwind CSS.

## 🛠️ Tech Stack

-   **Frontend**: Vanilla JavaScript (ES Modules)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Map Rendering**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) (v3)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v16.0.0 or higher)
-   npm (v7.0.0 or higher)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/BuildwithMc/PIZZADAOMAP.git
    cd PIZZADAOMAP
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Building for Production

To create a production-ready build:

```bash
npm run build
```

This will generate the optimized files in the `dist` directory.

## 📂 Project Structure

```
PIZZADAOMAP/
├── public/              # Static assets (Logos, Icons)
├── src/
│   ├── cities.csv       # (Optional) Local backup of city data
│   ├── main.js          # Core application logic (Mapbox, Logic, Animations)
│   └── style.css        # Global styles and Tailwind directives
├── index.html           # Main HTML entry point
├── tailwind.config.js   # Tailwind Theme Configuration
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## 🎨 Customization

### Mapbox Token
The Mapbox access token is configured in `src/main.js`. Replace it with your own token if you fork this project.

### Data

**Live Data Integration** 🟢
This map is powered by a live Google Sheet. The application fetches data in real-time using `PapaParse` to process the CSV export.

-   **Source**: A public Google Sheet CSV URL.
-   **Updates**: To add a new party, the Google Sheet must be updated. Changes reflect on the map immediately after a refresh.
-   **Structure**: The code automatically parses coordinate formats (JSON arrays or "lat, lng" strings).

### Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit changes or update map data.

This project enforces a [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming environment for all.

## 📄 License

This project is created for **PizzaDAO**.

---
*Built with ❤️ and 🍕 by the PizzaDAO Community.*
