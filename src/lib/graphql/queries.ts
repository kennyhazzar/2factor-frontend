import { gql } from "@apollo/client";

export const AUTH_SALT_QUERY = gql`
  query AuthSalt($email: String!) {
    authSalt(email: $email) {
      salt
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      language
      theme
      hasVault
      createdAt
      updatedAt
    }
  }
`;

export const GET_VAULT_QUERY = gql`
  query GetVault($authKey: String!) {
    vault(authKey: $authKey) {
      encryptedData
      iv
      version
    }
  }
`;
