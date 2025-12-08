import LetterGlitch from '../components/LetterGlitch';
import { ScrollCards } from "@/components/ScrollCards";
import { SmoothScroll } from "../components/SmoothScroll";


const Index = () => {
  return (
      <SmoothScroll>  
      <div className="min-h-screen relative">
        {/* Background Letter Glitch - Full Screen */}
        <div className="fixed inset-0 z-0">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
          />
        </div>

        {/* Main Interactive Cards Experience - Full Screen */}
        <div className="relative z-10">
          <ScrollCards />
        </div>
      </div>
      </SmoothScroll>
  );
};

export default Index;
