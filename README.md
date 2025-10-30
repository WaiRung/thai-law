# Thai Law Flashcard 🎴

An interactive flashcard application for learning Thai Law, built with Vue 3, TypeScript, and Tailwind CSS, optimized for mobile devices.

![Desktop View](https://github.com/user-attachments/assets/2234c1ab-f9e8-4a6c-8a70-959ce4eb3248)
![Mobile View](https://github.com/user-attachments/assets/50a4f2f1-08e5-4ad5-b3c2-80e6c92bca92)
![Flipped Card](https://github.com/user-attachments/assets/5c83e72a-e72f-4363-a491-edaddff83845)

## Features ✨

- **Interactive Flashcards**: Tap/click to flip cards and reveal answers
- **Progress Tracking**: Visual progress bar and completion counter
- **Navigation Controls**: Move forward, backward, or shuffle cards
- **Mobile-First Design**: Fully responsive and optimized for mobile devices
- **Smooth Animations**: Beautiful 3D flip animations
- **Thai Language Support**: Full Thai language interface with English subtitles
- **10 Law Topics**: Covers various aspects of Thai law including:
  - Civil and Commercial Law (กฎหมายแพ่ง)
  - Criminal Law (กฎหมายอาญา)
  - Family Law (กฎหมายครอบครัว)

## Tech Stack 🛠️

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

## Getting Started 🚀

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/WaiRung/thai-law-flashcard.git
cd thai-law-flashcard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure 📁

```
thai-law-flashcard/
├── src/
│   ├── components/
│   │   └── FlashCard.vue      # Flashcard component with flip animation
│   ├── data/
│   │   └── cards.ts           # Flashcard data (Thai law questions)
│   ├── types/
│   │   └── flashcard.ts       # TypeScript interfaces
│   ├── App.vue                # Main application component
│   ├── main.ts                # Application entry point
│   ├── style.css              # Global styles with Tailwind
│   └── vite-env.d.ts          # TypeScript declarations
├── public/
│   └── vite.svg               # App icon
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies
```

## How to Use 📖

1. **View Question**: The front of each card shows a question in Thai
2. **Flip Card**: Tap/click anywhere on the card to reveal the answer
3. **Navigate**: Use the navigation buttons to move between cards
4. **Shuffle**: Click the shuffle button to randomize card order
5. **Track Progress**: Monitor your progress with the progress bar and counter
6. **Reset**: Use the reset button to clear your progress

## Customization 🎨

### Adding New Cards

Edit `src/data/cards.ts` to add new flashcards:

```typescript
{
  id: 11,
  question: 'Your Thai law question',
  answer: 'Your answer',
  category: 'Category name'
}
```

### Styling

The app uses Tailwind CSS for styling. You can customize:
- Colors and gradients in component styles
- Mobile breakpoints in `@media` queries
- Animations and transitions

## Mobile Optimization 📱

- Touch-friendly interface with large tap targets
- Responsive design that adapts to all screen sizes
- No text selection or tap highlighting for better UX
- Optimized button sizes and spacing for mobile
- Viewport settings prevent unwanted zooming

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

ISC License

## Acknowledgments 🙏

Built with modern web technologies for effective Thai law education.