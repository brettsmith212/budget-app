import React from "react";
import styled from "styled-components";
import { theme } from "../Theme";

const NavbarContainer = styled.div`
  padding: 4rem;
  margin-bottom: 4rem;
  display: flex;
  justify-content: space-between;
`;

const LogoContainer = styled.div`
  h3 {
    font-size: ${theme.fontSize.h3};
  }
`;

const MenuContainer = styled.div`
  display: flex;
  gap: 2rem;

  a {
    font-size: ${theme.fontSize.h4};
  }

  a:hover {
    transform: scale(1.05);
  }
`;

const Navbar: React.FC = () => {
  return (
    <NavbarContainer>
      <LogoContainer>
        <h3>Budget App</h3>
      </LogoContainer>
      <MenuContainer>
        <a href="">Home</a>
        <a href="">Dashboard</a>
      </MenuContainer>
    </NavbarContainer>
  );
};

export default Navbar;
