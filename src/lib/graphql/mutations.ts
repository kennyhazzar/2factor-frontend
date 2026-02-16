import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        language
        theme
        hasVault
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: UserLoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        language
        theme
        hasVault
      }
    }
  }
`;

export const REFRESH_TOKENS_MUTATION = gql`
  mutation RefreshTokens($input: RefreshTokenInput) {
    refreshTokens(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($input: RefreshTokenInput) {
    logout(input: $input) {
      success
    }
  }
`;

export const UPDATE_VAULT_MUTATION = gql`
  mutation UpdateVault($input: UpdateVaultInput!) {
    updateVault(input: $input) {
      encryptedData
      iv
      version
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        language
        theme
        hasVault
      }
    }
  }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount($authKey: String!) {
    deleteAccount(authKey: $authKey)
  }
`;

export const UPDATE_THEME_MUTATION = gql`
  mutation UpdateTheme($input: UserUpdateThemeInput!) {
    userUpdateTheme(input: $input) {
      id
      theme
    }
  }
`;
