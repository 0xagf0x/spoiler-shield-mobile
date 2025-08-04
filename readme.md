# Spoiler Shield Mobile

**AI-powered spoiler protection for social media browsing**

Never get spoiled again while browsing Reddit, Twitter, or other social platforms. Spoiler Shield uses advanced machine learning to detect and hide potential spoilers before you see them.

## 🚀 Features

### Core Protection
- **Real-time spoiler detection** using on-device ML models
- **Customizable watchlists** for shows, sports, movies, and more
- **Confidence-based filtering** with adjustable sensitivity levels
- **Smart blur overlays** that let you choose what to reveal

### Supported Platforms
- **Protected Reddit** - Browse subreddits safely with spoiler filtering
- **Protected Twitter** - Timeline browsing with spoiler detection
- **Protected News** - RSS feeds with content analysis
- **Text Analysis Tool** - Check any content for spoilers

### AI-Powered Intelligence
- **Multi-modal analysis** - Text, images, and context understanding
- **Temporal awareness** - Higher sensitivity during release windows
- **Learning algorithms** - Adapts to your preferences over time
- **Natural language processing** - Understands context, not just keywords

## 📱 Screenshots

[Coming Soon - Protected Reddit Feed, Spoiler Overlay, Watchlist Management]

## 🛠 Technical Stack

### Frontend
- **React Native** with Expo for cross-platform development
- **React Navigation** for seamless app navigation
- **AsyncStorage** for local data persistence
- **Expo Vector Icons** for consistent iconography

### AI/ML Engine
- **TensorFlow Lite** for on-device inference (Android)
- **Core ML** for on-device inference (iOS)
- **Natural Language Processing** for context understanding
- **Custom training pipeline** for spoiler-specific models

### APIs & Services
- **Reddit API** for protected browsing experience
- **Twitter API v2** for timeline and tweet analysis
- **RSS/News APIs** for protected news consumption
- **No user data collection** - all processing on-device

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│                UI Layer                 │
│  (React Native Components)              │
├─────────────────────────────────────────┤
│             Business Logic              │
│  • Content Fetching                     │
│  • Spoiler Detection Engine             │
│  • Watchlist Management                 │
├─────────────────────────────────────────┤
│               ML Engine                 │
│  • Text Classification Models           │
│  • Image Analysis (future)              │
│  • Context Understanding                │
│  • Confidence Scoring                   │
├─────────────────────────────────────────┤
│              Data Layer                 │
│  • Local Storage (AsyncStorage)         │
│  • API Clients (Reddit, Twitter)        │
│  • Model Storage & Loading              │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI
- iOS Simulator / Android Emulator OR physical device with Expo Go

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spoiler-shield-mobile.git
cd spoiler-shield-mobile

# Install dependencies
npm install

# Start the development server
npx expo start

# Scan QR code with Expo Go or press 'i'/'a' for simulators
```

### Setup Reddit API (Required)
1. Create Reddit app at https://www.reddit.com/prefs/apps
2. Get your client ID and secret
3. Add to your environment:
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

## 🧠 ML Model Architecture

### Current Implementation
- **Keyword matching** with fuzzy logic and context awareness
- **Confidence scoring** based on term relevance and context
- **Multi-term analysis** for compound spoiler detection

### Planned ML Enhancements
- **BERT-based text classification** for context understanding
- **Custom spoiler detection models** trained on social media data
- **Image analysis** for detecting spoilers in memes and screenshots
- **Temporal models** that understand release schedules and timing

### Model Training Pipeline
```python
# Planned training workflow
Data Collection → Text Preprocessing → Feature Engineering 
     ↓                 ↓                    ↓
Model Training → Validation → Mobile Optimization
     ↓              ↓              ↓
TensorFlow Lite ← Core ML ← Performance Testing
```

## 📊 Privacy & Security

### Data Protection
- **On-device processing** - your content never leaves your phone
- **No tracking** - we don't collect browsing data or analytics
- **Local storage only** - watchlists and preferences stored locally
- **Optional cloud sync** with end-to-end encryption

### API Usage
- Reddit/Twitter APIs used only for content fetching
- No content uploaded to our servers
- API keys stored securely on device
- Rate limiting and respect for platform ToS

## 🎯 Roadmap

### Phase 1: MVP (Current)
- [x] Basic spoiler detection engine
- [x] Watchlist management
- [x] Reddit API integration
- [x] Protected browsing interface
- [ ] iOS/Android app store deployment

### Phase 2: Enhanced ML (Next 3 months)
- [ ] TensorFlow Lite integration
- [ ] BERT-based text analysis
- [ ] Image spoiler detection
- [ ] Custom model training pipeline
- [ ] Improved confidence algorithms

### Phase 3: Platform Expansion (Next 6 months)
- [ ] Twitter API integration
- [ ] Instagram support (public posts)
- [ ] News aggregation with spoiler filtering
- [ ] Group protection features
- [ ] Premium subscription model

### Phase 4: Advanced Features
- [ ] AR spoiler scanning (camera-based)
- [ ] Social features and sharing
- [ ] Automated watchlist suggestions
- [ ] Integration with streaming platforms
- [ ] Enterprise/media company solutions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm start

# Build for production
expo build
```


## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details.

