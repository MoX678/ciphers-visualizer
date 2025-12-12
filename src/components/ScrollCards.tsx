import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CipherCard } from "@/components/CipherCard";

gsap.registerPlugin(ScrollTrigger);

// Custom cipher icons
const CaesarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Outer ring */}
    <circle cx="12" cy="12" r="11" strokeWidth="2" />
    {/* Middle ring divider */}
    <circle cx="12" cy="12" r="7.5" strokeWidth="1" />
    {/* Inner ring */}
    <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
    {/* Center dot */}
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    
    {/* Radial lines (12 main divisions like clock) */}
    <line x1="12" y1="1" x2="12" y2="4" strokeWidth="0.8" />
    <line x1="12" y1="20" x2="12" y2="23" strokeWidth="0.8" />
    <line x1="1" y1="12" x2="4" y2="12" strokeWidth="0.8" />
    <line x1="20" y1="12" x2="23" y2="12" strokeWidth="0.8" />
    <line x1="3.2" y1="3.2" x2="5.3" y2="5.3" strokeWidth="0.8" />
    <line x1="18.7" y1="18.7" x2="20.8" y2="20.8" strokeWidth="0.8" />
    <line x1="20.8" y1="3.2" x2="18.7" y2="5.3" strokeWidth="0.8" />
    <line x1="3.2" y1="20.8" x2="5.3" y2="18.7" strokeWidth="0.8" />
    
    {/* Outer ring letters - larger and bolder */}
    <text x="10.8" y="3.5" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">A</text>
    <text x="17.3" y="7" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">D</text>
    <text x="19.8" y="13" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">G</text>
    <text x="16.8" y="19.5" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">J</text>
    <text x="10.8" y="22.8" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">N</text>
    <text x="3.8" y="19.5" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">Q</text>
    <text x="1.2" y="13" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">T</text>
    <text x="4" y="6.5" fontSize="2.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">W</text>
    
    {/* Inner ring letters (shifted by 3) - bolder */}
    <text x="10.8" y="6.2" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">D</text>
    <text x="15.2" y="8.5" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">G</text>
    <text x="16.8" y="12.8" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">J</text>
    <text x="14.8" y="17" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">M</text>
    <text x="10.8" y="18.8" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Q</text>
    <text x="6.2" y="16.5" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">T</text>
    <text x="4.8" y="12.8" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">W</text>
    <text x="6.2" y="9" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Z</text>
  </svg>
);

const MonoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Simplified substitution - two letter boxes with crossing arrows */}
    {/* Top row boxes */}
    <rect x="2" y="1" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="16" y="1" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    
    {/* Top row letters - larger */}
    <text x="3.5" y="5.8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">A</text>
    <text x="10.5" y="5.8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">B</text>
    <text x="17.5" y="5.8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">C</text>
    
    {/* Bottom row boxes */}
    <rect x="2" y="17" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="9" y="17" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="16" y="17" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    
    {/* Bottom row letters - scrambled */}
    <text x="3.5" y="21.8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">X</text>
    <text x="10.5" y="21.8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">K</text>
    <text x="17.5" y="21.8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">M</text>
    
    {/* Crossing arrows showing substitution */}
    <path d="M5 7.5 L5 16.5" strokeWidth="1.5" />
    <path d="M12 7.5 C12 10 16 13 19 16.5" strokeWidth="1.8" />
    <path d="M19 7.5 C19 10 15 13 12 16.5" strokeWidth="1.5" />
    
    {/* Arrow heads */}
    <path d="M4 14.5 L5 16.5 L6 14.5" strokeWidth="1.2" fill="none" />
    <path d="M18 14.5 L19 16.5 L20 14.5" strokeWidth="1.2" fill="none" />
    <path d="M11 14.5 L12 16.5 L13 14.5" strokeWidth="1.5" fill="none" />
  </svg>
);

const VigenereIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Vigenère disk - cipher wheel */}
    {/* Outer ring */}
    <circle cx="12" cy="12" r="11" strokeWidth="2" />
    {/* Middle ring */}
    <circle cx="12" cy="12" r="7.5" strokeWidth="1.5" />
    {/* Inner circle */}
    <circle cx="12" cy="12" r="3.5" strokeWidth="1.2" />
    {/* Center crosshair */}
    <line x1="10" y1="12" x2="14" y2="12" strokeWidth="1.5" />
    <line x1="12" y1="10" x2="12" y2="14" strokeWidth="1.5" />
    
    {/* Outer ring letters */}
    <text x="10.5" y="3.5" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">A</text>
    <text x="18.2" y="8.2" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">E</text>
    <text x="19.8" y="13.2" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">G</text>
    <text x="16.8" y="19.5" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">K</text>
    <text x="10.2" y="22.8" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">N</text>
    <text x="3.2" y="18.8" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">R</text>
    <text x="0.8" y="13" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">U</text>
    <text x="4.2" y="6.2" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">X</text>
    
    {/* Inner ring letters (offset for cipher effect) */}
    <text x="10.8" y="6.5" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">K</text>
    <text x="15.2" y="9.8" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">O</text>
    <text x="16.8" y="13.2" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Q</text>
    <text x="14.2" y="16.8" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">U</text>
    <text x="10.8" y="18.8" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">X</text>
    <text x="6.2" y="16.2" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">B</text>
    <text x="4.8" y="12.8" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">E</text>
    <text x="6.8" y="9.2" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">H</text>
  </svg>
);

const PlayfairIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {/* 5x5 Playfair grid */}
    <rect x="1" y="1" width="22" height="22" rx="0.5" strokeWidth="1.8" />
    
    {/* Horizontal lines */}
    <line x1="1" y1="5.4" x2="23" y2="5.4" strokeWidth="1" />
    <line x1="1" y1="9.8" x2="23" y2="9.8" strokeWidth="1" />
    <line x1="1" y1="14.2" x2="23" y2="14.2" strokeWidth="1" />
    <line x1="1" y1="18.6" x2="23" y2="18.6" strokeWidth="1" />
    
    {/* Vertical lines */}
    <line x1="5.4" y1="1" x2="5.4" y2="23" strokeWidth="1" />
    <line x1="9.8" y1="1" x2="9.8" y2="23" strokeWidth="1" />
    <line x1="14.2" y1="1" x2="14.2" y2="23" strokeWidth="1" />
    <line x1="18.6" y1="1" x2="18.6" y2="23" strokeWidth="1" />
    
    {/* Letters in grid - PLAYFIR keyword style */}
    <text x="2" y="4.8" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">P</text>
    <text x="6.2" y="4.8" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">L</text>
    <text x="10.6" y="4.8" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">A</text>
    <text x="15" y="4.8" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">Y</text>
    <text x="19.4" y="4.8" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">F</text>
    
    {/* Second row */}
    <text x="2.5" y="9.2" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">I</text>
    <text x="6.2" y="9.2" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">R</text>
    <text x="10.6" y="9.2" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">B</text>
    <text x="15" y="9.2" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">C</text>
    <text x="19" y="9.2" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">D</text>
    
    {/* Remaining rows with faded effect */}
    <text x="2" y="13.6" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">E</text>
    <text x="6" y="13.6" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">G</text>
    <text x="10.4" y="13.6" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">H</text>
    <text x="14.8" y="13.6" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">K</text>
    <text x="18.8" y="13.6" fontSize="3.8" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">M</text>
  </svg>
);

const RailFenceIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6 L6 18 L10 6 L14 18 L18 6 L22 18" />
    <circle cx="2" cy="6" r="1.5" fill="currentColor" />
    <circle cx="10" cy="6" r="1.5" fill="currentColor" />
    <circle cx="18" cy="6" r="1.5" fill="currentColor" />
    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
    <circle cx="14" cy="18" r="1.5" fill="currentColor" />
    <circle cx="22" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

const OTPIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {/* OTP Label - centered and prominent */}
    <text x="2" y="16" fontSize="9" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">OTP</text>
  </svg>
);

const TranspositionIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="9" y="3" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="16" y="3" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="2" y="15" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="9" y="15" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    <rect x="16" y="15" width="6" height="6" rx="0.5" strokeWidth="1.5" />
    
    {/* Letters in boxes */}
    <text x="3.5" y="8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">A</text>
    <text x="10.5" y="8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">B</text>
    <text x="17.5" y="8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">C</text>
    <text x="3.5" y="20" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">C</text>
    <text x="10.5" y="20" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">A</text>
    <text x="17.5" y="20" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">B</text>
    
    {/* Crossing arrows */}
    <path d="M5 9.5 L17 14.5" strokeWidth="1.2" strokeDasharray="2 1" />
    <path d="M12 9.5 L5 14.5" strokeWidth="1.2" strokeDasharray="2 1" />
    <path d="M19 9.5 L12 14.5" strokeWidth="1.2" strokeDasharray="2 1" />
  </svg>
);

const HillIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth="2" />
    <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1.5" />
    <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.5" />
    
    {/* Matrix numbers - larger and bolder */}
    <text x="4.5" y="9" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">3</text>
    <text x="14.5" y="9" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">2</text>
    <text x="4.5" y="19" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">5</text>
    <text x="14.5" y="19" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">7</text>
  </svg>
);

const PolyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="22" height="6" rx="1" strokeWidth="1.5" />
    <rect x="1" y="9" width="22" height="6" rx="1" strokeWidth="1.5" />
    <rect x="1" y="16" width="22" height="6" rx="1" strokeWidth="1.5" />
    <text x="3" y="7" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">ABC</text>
    <text x="3" y="14" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">BCD</text>
    <text x="3" y="21" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">CDE</text>
  </svg>
);

const DESIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    {/* Feistel network - DES structure */}
    {/* Top inputs L and R */}
    <rect x="2" y="1" width="8" height="4" rx="0.5" strokeWidth="0.8" />
    <rect x="14" y="1" width="8" height="4" rx="0.5" strokeWidth="0.8" />
    <text x="4" y="4" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">L</text>
    <text x="16" y="4" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">R</text>
    
    {/* Vertical lines down */}
    <line x1="6" y1="5" x2="6" y2="9" strokeWidth="0.8" />
    <line x1="18" y1="5" x2="18" y2="7" strokeWidth="0.8" />
    
    {/* F function box */}
    <rect x="13" y="7" width="10" height="5" rx="0.5" strokeWidth="1" />
    <text x="15.5" y="10.5" fontSize="4" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="900">F</text>
    
    {/* XOR symbol */}
    <circle cx="6" cy="11" r="2" strokeWidth="0.8" />
    <line x1="4" y1="11" x2="8" y2="11" strokeWidth="0.6" />
    <line x1="6" y1="9" x2="6" y2="13" strokeWidth="0.6" />
    
    {/* Connection from F to XOR */}
    <line x1="13" y1="9.5" x2="8" y2="11" strokeWidth="0.8" />
    
    {/* Cross-over lines */}
    <line x1="6" y1="13" x2="6" y2="16" strokeWidth="0.8" />
    <line x1="6" y1="16" x2="18" y2="19" strokeWidth="0.8" />
    <line x1="18" y1="12" x2="18" y2="16" strokeWidth="0.8" />
    <line x1="18" y1="16" x2="6" y2="19" strokeWidth="0.8" />
    
    {/* Bottom outputs */}
    <rect x="2" y="19" width="8" height="4" rx="0.5" strokeWidth="0.8" />
    <rect x="14" y="19" width="8" height="4" rx="0.5" strokeWidth="0.8" />
    <text x="4" y="22" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">L</text>
    <text x="16" y="22" fontSize="3" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">R</text>
  </svg>
);

const AESIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
    {/* AES Structure - Rounds with Key Expansion */}
    
    {/* Round boxes on left side */}
    <rect x="1" y="1" width="10" height="3.5" rx="0.3" strokeWidth="0.8" />
    <text x="3.5" y="3.3" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Pre</text>
    
    <rect x="1" y="5.5" width="10" height="3.5" rx="0.3" strokeWidth="0.8" />
    <text x="2.5" y="7.8" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Rnd1</text>
    
    <rect x="1" y="10" width="10" height="3.5" rx="0.3" strokeWidth="0.8" />
    <text x="2.5" y="12.3" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Rnd2</text>
    
    {/* Dots for more rounds */}
    <circle cx="6" cy="15" r="0.4" fill="currentColor" stroke="none" />
    <circle cx="6" cy="16.2" r="0.4" fill="currentColor" stroke="none" />
    
    <rect x="1" y="17.5" width="10" height="3.5" rx="0.3" strokeWidth="0.8" />
    <text x="2.5" y="19.8" fontSize="2.2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">RndN</text>
    
    {/* Arrows between rounds */}
    <line x1="6" y1="4.5" x2="6" y2="5.5" strokeWidth="0.6" />
    <line x1="6" y1="9" x2="6" y2="10" strokeWidth="0.6" />
    <line x1="6" y1="13.5" x2="6" y2="14.3" strokeWidth="0.6" />
    <line x1="6" y1="16.8" x2="6" y2="17.5" strokeWidth="0.6" />
    
    {/* Key expansion column on right */}
    <rect x="14" y="3" width="8" height="15" rx="0.3" strokeWidth="0.8" />
    <text x="15" y="6.5" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Key</text>
    <text x="14.5" y="9" fontSize="2" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="bold">Exp.</text>
    
    {/* K labels with arrows */}
    <text x="15" y="13" fontSize="2" fill="currentColor" stroke="none" fontFamily="serif" fontWeight="bold">K₀</text>
    <text x="15" y="16" fontSize="2" fill="currentColor" stroke="none" fontFamily="serif" fontWeight="bold">K₁</text>
    
    {/* Arrows from Key to rounds */}
    <line x1="14" y1="5" x2="11" y2="3" strokeWidth="0.6" />
    <line x1="14" y1="8" x2="11" y2="7" strokeWidth="0.6" />
    <line x1="14" y1="12" x2="11" y2="11.5" strokeWidth="0.6" />
    <line x1="14" y1="17" x2="11" y2="19" strokeWidth="0.6" />
    
    {/* Output arrow */}
    <line x1="6" y1="21" x2="6" y2="23" strokeWidth="0.6" />
  </svg>
);

const allCiphers = [
  // Historical Timeline Order
  {
    title: "Caesar Cipher",
    description: "The earliest known cipher, used by Julius Caesar around 50 BC to protect military messages.",
    icon: <CaesarIcon className="w-12 h-12" />,
    href: "/caesar",
    difficulty: "Easy" as const,
    category: "Classical",
    year: "~50 BC"
  },
  {
    title: "Monoalphabetic Cipher",
    description: "Ancient substitution technique where each letter maps to exactly one other letter.",
    icon: <MonoIcon className="w-12 h-12" />,
    href: "/monoalphabetic",
    difficulty: "Easy" as const,
    category: "Classical",
    year: "Ancient"
  },
  {
    title: "Vigenère Cipher",
    description: "Published in 1553, this polyalphabetic cipher was considered 'unbreakable' for 300 years.",
    icon: <VigenereIcon className="w-12 h-12" />,
    href: "/vigenere",
    difficulty: "Medium" as const,
    category: "Classical",
    year: "1553"
  },
  {
    title: "Playfair Cipher",
    description: "Invented in 1854 by Charles Wheatstone, first digraph substitution cipher used in warfare.",
    icon: <PlayfairIcon className="w-12 h-12" />,
    href: "/playfair",
    difficulty: "Medium" as const,
    category: "Classical",
    year: "1854"
  },
  {
    title: "Rail Fence Cipher",
    description: "Popular during the American Civil War (1861-1865), writes text in zigzag patterns.",
    icon: <RailFenceIcon className="w-12 h-12" />,
    href: "/railfence",
    difficulty: "Medium" as const,
    category: "Classical",
    year: "~1860s"
  },
  {
    title: "One-Time Pad",
    description: "Invented in 1882, the only mathematically proven unbreakable encryption method.",
    icon: <OTPIcon className="w-12 h-12" />,
    href: "/otp",
    difficulty: "Advanced" as const,
    category: "Modern",
    year: "1882"
  },
  {
    title: "Row Transposition",
    description: "Widely used in WWI (1914-1918), rearranges text based on keyword permutation.",
    icon: <TranspositionIcon className="w-12 h-12" />,
    href: "/transposition",
    difficulty: "Medium" as const,
    category: "Classical",
    year: "~1914"
  },
  {
    title: "Hill Cipher",
    description: "Created in 1929 by Lester Hill, first cipher to use linear algebra and matrices.",
    icon: <HillIcon className="w-12 h-12" />,
    href: "/hill",
    difficulty: "Advanced" as const,
    category: "Classical",
    year: "1929"
  },
  {
    title: "Polyalphabetic Ciphers",
    description: "Family of ciphers using multiple substitution alphabets, evolved through centuries.",
    icon: <PolyIcon className="w-12 h-12" />,
    href: "/polyalphabetic",
    difficulty: "Medium" as const,
    category: "Classical",
    year: "Various"
  },
  {
    title: "DES Encryption",
    description: "Adopted as US federal standard in 1977, pioneered modern symmetric encryption.",
    icon: <DESIcon className="w-12 h-12" />,
    href: "/des",
    difficulty: "Advanced" as const,
    category: "Modern",
    year: "1977"
  },
  {
    title: "AES Encryption",
    description: "Selected as the encryption standard in 2001, securing today's digital communications.",
    icon: <AESIcon className="w-12 h-12" />,
    href: "/aes",
    difficulty: "Advanced" as const,
    category: "Modern",
    year: "2001"
  },
];


export function ScrollCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);




 useEffect(() => {
    const timer = setTimeout(() => {
      // Set initial state for the cipher section - responsive scaling
      if (sectionRef.current) {
        const isMobile = window.innerWidth < 768;
        gsap.set(sectionRef.current, {
          scale: isMobile ? 0.7 : 0.5,
          opacity: 0.3,
          y: 50,
        });
      }

      const ctx = gsap.context(() => {
        // Responsive scale up animation for the cipher section
        const isMobile = window.innerWidth < 768;
        const scaleAnimation = gsap.to(sectionRef.current, {
          scale: 1,
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          duration: isMobile ? 1 : 1.5,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: isMobile ? 'top 90%' : 'top 80%',
            end: isMobile ? 'top 30%' : 'top 20%',
            scrub: isMobile ? 0.3 : 0.5,
          },
        });

        // Enhanced stagger cards animation with responsive delays
        const cards = cardsRef.current?.querySelectorAll('.cipher-card');
        if (cards) {
          gsap.fromTo(
            cards,
            {
              y: isMobile ? 40 : 60,
              opacity: 0,
              scale: isMobile ? 0.95 : 0.9,
              rotationX: 15
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              rotationX: 0,
              duration: isMobile ? 0.6 : 0.8,
              stagger: {
                amount: isMobile ? 0.6 : 1.0,
                from: "start",
                ease: "power2.out"
              },
              ease: 'back.out(1.2)',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: isMobile ? 'top 70%' : 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
        
        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();
      });

      // Handle window resize for responsive animations
      const handleResize = () => {
        ScrollTrigger.refresh();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        ctx.revert();
        window.removeEventListener('resize', handleResize);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const scrollToCiphers = () => {
    const section = sectionRef.current;
    if (section) {
      const offsetTop = section.offsetTop;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative">
        <div className="text-center p-4 max-w-4xl mx-auto">


          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-fade-in [animation-delay:200ms]">
                 Ciphers            
          <span className=" neon-text ml-2">
             Visualizer
            </span>
          </h1>



          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:600ms]">
            <Button
              size="lg"
              onClick={scrollToCiphers}
              className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300 transform hover:scale-105"
            >
              Explore Ciphers
            </Button>
          </div>
              <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
          <span className="font-mono text-sm">scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>

    
        </div>
      </section>

      {/* Cipher Grid Section - Full Screen */}
      <section 
        ref={sectionRef}
        className="min-h-screen w-full bg-gradient-to-br from-background via-background/98 to-background/95 backdrop-blur-2xl border-t border-white/20 flex items-center justify-center relative overflow-hidden"
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center max-w-none relative z-10 py-8 sm:py-12 lg:py-16">
          {/* Enhanced Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 mt-4 sm:mt-6 lg:mt-8">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground/90 max-w-2xl lg:max-w-4xl mx-auto leading-relaxed px-4">
              Explore the complete collection of{' '}
              <span className="text-primary font-semibold">cryptographic algorithms</span>{' '}
              from ancient to modern
            </p>
            
            {/* Decorative Elements */}
            <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
              <div className="w-8 sm:w-12 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div className="w-8 sm:w-16 h-px bg-gradient-to-r from-primary/50 to-transparent" />
            </div>
            

          </div>
          
          {/* Responsive Cipher Grid */}
          <div className="flex-1 flex flex-col justify-center max-w-none" ref={cardsRef}>
            <div className="w-full px-2 sm:px-4 lg:px-6">
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-3 lg:gap-4 mx-auto max-w-[1600px]">
                {allCiphers.map((cipher, index) => (
                  <div 
                    key={`overview-${cipher.title}`}
                    className="cipher-card group"
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <CipherCard
                      {...cipher}
                      delay={0}
                      className="h-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20"
                    />
                  </div>
                ))}
              </div>
              
              {/* Grid Footer */}
              <div className="text-center mt-8 sm:mt-12 lg:mt-16">
                <p className="text-xs sm:text-sm text-muted-foreground/70">
                  Click any cipher to start your cryptographic journey
                </p>
                <div className="w-16 sm:w-20 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-4" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
