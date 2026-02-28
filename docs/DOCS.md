# Documentation


## Basic folder structure
IshowspeedBot/
│
├── src/
│   ├── index.js              # Entry point
│   │
│   ├── commands/
│   │   ├── news.js
│   │   ├── subscribers.js
│   │   └── bark.js
│   │
│   ├── services/
│   │   ├── youtubeService.js
│   │   ├── newsService.js
│   │   └── subscriberService.js
│   │
│   ├── events/
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   │
│   ├── voice/
│   │   └── barkPlayer.js
│   │
│   ├── utils/
│   │   └── logger.js
│   │
│   └── config/
│       └── constants.js
│
├── data/
│   └── state.json            # Store "already notified" flag
│
├── .env
├── package.json
└── README.md


