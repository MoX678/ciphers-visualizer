# 🔐 Cipher Visualizer

An interactive web application for visualizing and learning classical and modern cryptographic ciphers. Built with React, TypeScript, and Tailwind CSS.

![Cipher Visualizer](https://img.shields.io/badge/React-18-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss)

## 🎯 Overview

Cipher Visualizer is an educational tool designed to help students, understand how various encryption algorithms work through interactive visualizations. Each cipher includes step-by-step animations, detailed explanations, and hands-on encryption/decryption capabilities.

## ✨ Features

### 📚 Supported Ciphers

#### Classical Ciphers

- **Caesar Cipher** (~50 BC) - Simple letter shifting with animated cipher wheel
- **Monoalphabetic Cipher** - Custom letter substitution mapping
- **Vigenère Cipher** (1553) - Polyalphabetic cipher with Tabula Recta visualization
- **Playfair Cipher** (1854) - Digraph substitution with 5×5 key matrix
- **Rail Fence Cipher** - Transposition cipher with zigzag pattern visualization
- **Columnar Transposition** - Column-based rearrangement cipher

#### Modern Ciphers

- **Hill Cipher** - Matrix multiplication-based encryption with step-by-step math visualization
- **One-Time Pad** - Perfect secrecy with random key XOR operation
- **DES** (Data Encryption Standard) - Feistel network structure with 16 rounds
- **AES** (Advanced Encryption Standard) - Modern block cipher with SubBytes, ShiftRows, MixColumns, and AddRoundKey operations

### 🎨 Interactive Visualizations

- **Animated encryption/decryption** - Watch the cipher process step by step
- **Step navigation** - Move forward/backward through the encryption process
- **Real-time input/output** - See results as you type
- **Mobile responsive** - Full functionality on all device sizes



## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```bash
# Clone the repository
git clone https://github.com/MoX678/ciphers-visualizer.git  
cd cipher-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite** | Fast build tool and dev server |
| **React 18** | UI component library |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Beautiful UI components |
| **Framer Motion** | Smooth animations |

## 📁 Project Structure

```text
cipher-visualizer/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── ScrollCards.tsx
│   │   └── ...
│   ├── pages/           # Cipher implementation pages
│   │   ├── CaesarCipher.tsx
│   │   ├── VigenereCipher.tsx
│   │   ├── HillCipher.tsx
│   │   ├── AESCipher.tsx
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions
├── public/              # Static assets
└── package.json
```

## 🎓 Educational Use

Cipher Visualizer is perfect for:

- **Cryptography courses** - Demonstrate cipher mechanics visually
- **Self-learning** - Understand encryption through interaction
- **Teaching** - Show students how encryption works step by step

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-cipher`)
3. Commit your changes (`git commit -m 'Add new cipher'`)
4. Push to the branch (`git push origin feature/new-cipher`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

