# Contributing to PizzaDAO Global Party Map

Thank you for your interest in contributing to the PizzaDAO Global Party Map! We welcome contributions from everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/pizzadaocitymap.git
    cd pizzadaocitymap
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Start development server**:
    ```bash
    npm run dev
    ```

## How to Contribute

### Code Changes
- Create a new branch for your feature or fix: `git checkout -b feature/my-new-feature`.
- Make your changes.
- Ensure the app runs without errors.
- Push your branch and submit a **Pull Request**.

### Updating Map Data
The map data is powered by a live Google Sheet.
- **To add a party**: Please contact the PizzaDAO team to get added to the official Google Sheet.
- **Developers**: The CSV structure is validated in `src/main.js`. If you need to change the data schema, please open an issue first to discuss the changes, as this impacts the live sheet structure.

## Code Style
- Use standard JavaScript (ES Modules).
- Use Tailwind CSS for styling.
- Keep components modular.

Thank you for helping us build the Global Pizza Party! 🍕
