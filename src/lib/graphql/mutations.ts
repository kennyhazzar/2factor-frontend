import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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
  mutation RefreshTokens {
    refreshTokens {
      csrfToken
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
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

export const UPDATE_LANGUAGE_MUTATION = gql`
  mutation UpdateLanguage($input: UserUpdateLanguageInput!) {
    userUpdateLanguage(input: $input) {
      id
      language
    }
  }
`;
