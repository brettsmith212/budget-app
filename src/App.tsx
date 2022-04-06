import { ThemeProvider } from "styled-components";
import { theme } from "./Theme";
import GlobalStyles from "./Global";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <>
        <GlobalStyles />
        <div>Budget App</div>
      </>
    </ThemeProvider>
  );
}

export default App;
