# Particle Party - Interactive Particle Simulation

A real-time, GPU-accelerated particle simulation built with Angular and WebGPU. Create, interact with, and observe complex particle systems with customizable physics properties.

*This only works with Browsers that support WebGPU!*

## Live Demo
See it running on: https://matthi1993.github.io/particle-party/


## Main Features

### Interactive Particle Simulation
- Real-time physics with GPU acceleration
- Multiple particle types with unique properties (color, size, mass, radius)
- Force interactions between different particle types
- Bounding sphere collision detection

### Visual Features
- Smooth particle rendering with glow effects
- Particle selection system with visual feedback
- Camera controls for zoom, pan, and navigation
- Real-time physics updates

### Creation Tools
- Brush tool for painting particles directly into the simulation
- Structure system for saving and reusing particle arrangements
- Random particle generation
- Physics presets for loading and saving configurations

### Physics Controls
- Visual force matrix editor for fine-tuning interactions
- Adjustable particle properties (mass, size, radius, color)
- Gravity control
- Real-time physics updates

## How to Run

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Modern browser with WebGPU support (Chrome Canary, Firefox Nightly, or Safari Technology Preview)

### Installation & Setup

1. Clone the repository
   ```bash
   git clone https://github.com/matthi1993/particle-party.git
   cd particle-party
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```
   or
   ```bash
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## How to Use

### Basic Controls
- Mouse: Click to paint particles or select existing ones
- Scroll: Zoom in/out
- Drag: Pan the camera around the simulation
- Menu: Use the sidebar to configure physics and particle properties

### Creating Particles
1. Select a particle type from the menu
2. Choose the brush tool (paint mode)
3. Click anywhere in the simulation to add particles
4. Adjust brush radius and count for different effects

### Configuring Physics
1. Open the "Forces" tab in the menu
2. Use the force matrix to set attraction/repulsion between particle types
3. Adjust particle properties (mass, size, radius) in the "Particles" tab
4. Watch the simulation update in real-time

### Saving Structures
1. Select particles you want to save as a structure
2. Click "Save Structure" in the menu
3. Give your structure a name
4. Use the structure brush to paint the saved arrangement

## Technology Stack

- Frontend: Angular 19
- Graphics: WebGPU for GPU-accelerated computation and rendering
- UI Components: PrimeNG with PrimeFlex
- Math: gl-matrix for vector/matrix operations
- Build Tool: Angular CLI

## Project Structure

```
src/
├── app/
│   ├── components/          # Angular components
│   │   ├── simulation/     # Main simulation component
│   │   ├── menu/          # UI controls and settings
│   │   ├── brush/         # Particle painting tools
│   │   └── simulation-edit/ # Simulation editing interface
│   ├── services/          # Data and business logic
│   ├── store/            # State management
│   └── model/            # Data models
├── scene/                # Core simulation engine
│   ├── gpu/             # WebGPU implementation
│   ├── model/           # Simulation data models
│   └── particle-simulation.ts # Main simulation class
└── assets/              # Static assets and presets
```

## Development

This is a work in progress application. The simulation uses WebGPU for high-performance particle physics calculations, making it capable of handling thousands of particles in real-time.

### Key Features in Development
- Enhanced particle selection and manipulation
- More complex physics interactions
- Additional rendering effects
- Performance optimizations

## License

This project is open source. Feel free to contribute or use it for your own projects.
