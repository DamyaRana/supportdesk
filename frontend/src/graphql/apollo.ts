
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
} from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
});

// Attach the JWT token to every GraphQL request.
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');

  return {
    headers: {
      ...headers,
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  };
});

// Log GraphQL and network errors.
const errorLink = onError(
  ({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach((error) => {
        console.error(
          `[GraphQL error]: ${error.message}`,
        );
      });
    }

    if (networkError) {
      console.error(
        `[Network error]: ${networkError.message}`,
      );
    }
  },
);

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
