import { ThemeProvider } from "styled-components";
import { theme } from "./Theme";
import GlobalStyles from "./Global";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <>
        <GlobalStyles />
        <Navbar />
        <Hero />
      </>
    </ThemeProvider>
  );
}

export default App;
