import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CaesarCipher from "./pages/CaesarCipher";
import VigenereCipher from "./pages/VigenereCipher";
import TranspositionCipher from "./pages/TranspositionCipher";
import HillCipher from "./pages/HillCipher";
import MonoalphabeticCipher from "./pages/MonoalphabeticCipher";
import PolyalphabeticCipher from "./pages/PolyalphabeticCipher";
import AESCipher from "./pages/AESCipher";
import OneTimePadCipher from "./pages/OneTimePadCipher";
import PlayfairCipher from "./pages/PlayfairCipher";
import DESCipher from "./pages/DESCipher";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/caesar" element={<CaesarCipher />} />
          <Route path="/vigenere" element={<VigenereCipher />} />
          <Route path="/transposition" element={<TranspositionCipher />} />
          <Route path="/hill" element={<HillCipher />} />
          <Route path="/monoalphabetic" element={<MonoalphabeticCipher />} />
          <Route path="/polyalphabetic" element={<PolyalphabeticCipher />} />
          <Route path="/aes" element={<AESCipher />} />
          <Route path="/otp" element={<OneTimePadCipher />} />
          <Route path="/playfair" element={<PlayfairCipher />} />
          <Route path="/des" element={<DESCipher />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
