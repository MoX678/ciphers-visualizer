import { CipherCard } from "@/components/CipherCard";
import { 
  KeyRound, 
  Shuffle, 
  Grid3X3, 
  Key, 
  Rows3, 
  Lock, 
  Shield,
  Layers,
  FileKey,
  SquareAsterisk
} from "lucide-react";
import LetterGlitch from '../components/LetterGlitch';

const ciphers = [
  {
    title: "Caesar Cipher",
    description: "Classic substitution cipher that shifts each letter by a fixed number of positions.",
    icon: <KeyRound className="w-6 h-6" />,
    href: "/caesar",
  },
  {
    title: "Vigenère Cipher",
    description: "Polyalphabetic cipher using a keyword to determine shifting patterns.",
    icon: <Key className="w-6 h-6" />,
    href: "/vigenere",
  },
  {
    title: "Monoalphabetic Cipher",
    description: "Simple substitution where each letter maps to exactly one other letter.",
    icon: <Shuffle className="w-6 h-6" />,
    href: "/monoalphabetic",
  },
  {
    title: "Hill Cipher",
    description: "Matrix-based encryption using linear algebra for letter transformation.",
    icon: <Grid3X3 className="w-6 h-6" />,
    href: "/hill",
  },
  {
    title: "Playfair Cipher",
    description: "Digraph substitution cipher using a 5×5 key matrix.",
    icon: <SquareAsterisk className="w-6 h-6" />,
    href: "/playfair",
  },
  {
    title: "Row Transposition",
    description: "Rearranges plaintext characters based on a keyword permutation pattern.",
    icon: <Rows3 className="w-6 h-6" />,
    href: "/transposition",
  },
  {
    title: "Polyalphabetic Ciphers",
    description: "Uses multiple substitution alphabets to encrypt the message.",
    icon: <Layers className="w-6 h-6" />,
    href: "/polyalphabetic",
  },
  {
    title: "One-Time Pad",
    description: "Theoretically unbreakable cipher using random keys of equal message length.",
    icon: <FileKey className="w-6 h-6" />,
    href: "/otp",
  },
  {
    title: "DES Encryption",
    description: "Data Encryption Standard - symmetric block cipher with 56-bit key.",
    icon: <Lock className="w-6 h-6" />,
    href: "/des",
  },
  {
    title: "AES Encryption",
    description: "Advanced Encryption Standard - modern symmetric encryption algorithm.",
    icon: <Shield className="w-6 h-6" />,
    href: "/aes",
  
  },
];

const Index = () => {
  return (
    /* <div className="min-h-screen bg-background grid-bg"></div>*/
    <div className="min-h-screen relative">
      {/* Background Letter Glitch */}
      <div className="fixed inset-0 z-0">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center">

            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Ciphers
              <span className="neon-text block mt-2">DeepDive</span>
            </h1>
            

          </div>
        </div>
      </section>

      {/* Cipher Grid */}
      <section className="container mx-auto px-4 pb-20 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ciphers.map((cipher, index) => (
            <CipherCard
              key={cipher.title}
              {...cipher}
              delay={index * 100}
            />
          ))}
        </div>
      </section>


    </div>
  );
};

export default Index;
