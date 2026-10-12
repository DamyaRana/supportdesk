
import { gql } from '@apollo/client/core';

export const GET_TICKETS = gql`
  query GetTickets {
    tickets {
      id
      title
      description
      category
      priority
      status
      createdAt
      updatedAt
    }
  }
`;


export const DELETE_TICKET = gql`
  mutation DeleteTicket($id: ID!) {
    deleteTicket(id: $id) {
      id
      title
      status
    }
  }
`;



export const CREATE_TICKET = gql`
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      id
      title
      description
      category
      priority
      status
      createdAt
      updatedAt
    }
  }
`;



export const UPDATE_TICKET = gql`
  mutation UpdateTicket($input: UpdateTicketInput!) {
    updateTicket(input: $input) {
      id
      title
      description
      category
      priority
      status
      createdAt
      updatedAt
    }
  }
`;

