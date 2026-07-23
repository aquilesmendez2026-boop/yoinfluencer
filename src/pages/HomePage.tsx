import { Box } from "@chakra-ui/react";
import { Navbar } from "../organisms/Navbar";
import { Hero } from "../organisms/Hero";
import { LiveSection } from "../organisms/LiveSection";
import { AboutSection } from "../organisms/AboutSection";
import { FormatsSection } from "../organisms/FormatsSection";
import { ScheduleSection } from "../organisms/ScheduleSection";
import { ContenidosSection } from "../organisms/ContenidosSection";
import { SeccionesSection } from "../organisms/SeccionesSection";
import { StaffSection } from "../organisms/StaffSection";
import { RedesSection } from "../organisms/RedesSection";
import { LugaresSection } from "../organisms/LugaresSection";
import { BuzonSection } from "../organisms/BuzonSection";
import { Footer } from "../organisms/Footer";
import { ProfileNudge } from "../molecules/ProfileNudge";

export const HomePage = () => {
  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh" overflowX="hidden">
      <ProfileNudge />
      <Navbar />
      <Hero />
      <LiveSection />
      <AboutSection />
      <SeccionesSection />
      <ContenidosSection />
      <StaffSection />
      <FormatsSection />
      <LugaresSection />
      <ScheduleSection />
      <BuzonSection />
      <RedesSection />
      <Footer />
    </Box>
  );
};
