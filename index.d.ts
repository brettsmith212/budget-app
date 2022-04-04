import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      header: string;
      body: string;
      section: string;
      card: string;
      footer: string;
      fontColostring;
      hr: string;
      modal: string;
      voted: string;
    };
    fontSize: {
      input: string;
      h1: string;
      h2: string;
      h3: string;
      h4: string;
    };
  }
}
