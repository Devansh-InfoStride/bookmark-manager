##Directory Structure 
```
.
├── public/                 # Static assets served directly
│   ├── index.html          # Main entry point
│   ├── favicon.ico         # Browser icon
│   └── manifest.json       # PWA metadata
├── src/                    # Application source code
│   ├── assets/             # Raw resources (images, fonts, data)
│   ├── styles/             # Global and component-specific CSS
│   ├── scripts/            # Core logic and entry points
│   │   ├── components/     # Reusable UI elements
│   │   ├── utils/          # Helper functions
│   │   └── services/       # API and data fetching logic
│   └── pages/              # View-level components
├── tests/                  # Unit and integration tests
├── .gitignore              # Git exclusion rules
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```