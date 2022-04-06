import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      bgHeader: string;
      bgBody: string;
      bgSection: string;
      bgCard: string;
      bgFooter: string;
      fontDefault: string;
      fontGreen: string;
      fontLightGreen: string;
      fontDarkGreen: string;
      hr: string;
      bgModal: string;
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
