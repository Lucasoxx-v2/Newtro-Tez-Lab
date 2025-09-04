# Prompt Guide: Building the "Tez Lab" NFT Visualizer with Vanilla JS

## 1. Project Overview

**Goal:** Create a single-page web application called "Tez Lab" using only **vanilla HTML, CSS, and JavaScript**. This application will be an interactive portal for visualizing NFT collections from the Tezos blockchain and showcasing content from the Newtro Arts Collective.

**Core Technologies:**
- **HTML:** For the structure of the application.
- **CSS:** For all styling, responsiveness, and animations. You should aim to replicate a modern, dark-themed aesthetic similar to the reference design.
- **Vanilla JavaScript:** For all logic, including state management, API calls, DOM manipulation, and user event handling. **No frameworks or libraries like React, Vue, or jQuery are allowed.**

## 2. Core Architectural Patterns

### 2.1. State Management
- Implement a simple, global JavaScript object to hold the application's state. This object should track the `currentView`, loading status, error messages, and all fetched data (collections, artists, etc.).
- All UI updates should be driven by changes to this state object.

### 2.2. Rendering
- All HTML content will be rendered dynamically using JavaScript. You will create functions that generate HTML strings or DOM elements based on the current state and inject them into the main container.
- For example, create a `renderNftGrid(nfts)` function that takes an array of NFT objects and generates the HTML for a grid of cards.

### 2.3. Caching Strategy: Stale-While-Revalidate (SWR) for Artist Index
This is a critical performance optimization.
- **On first load** of the "Newtro Index" section, fetch the artist profiles.
- **Cache the result:** Store the array of artist profiles in the browser's `localStorage`. Along with the data, store a timestamp (expiry date, e.g., 1 hour from now).
- **On subsequent loads:**
    1.  **Instantly load from cache:** Immediately read the artist profiles from `localStorage` and render them. The UI should appear instantly.
    2.  **Check for staleness:** Check if the cached data's timestamp has expired.
    3.  **Revalidate in the background:** If it's stale, silently trigger a new API fetch in the background to get the latest artist list.
    4.  **Update cache:** Once the fresh data arrives, update the `localStorage` cache with the new data and a new timestamp. If the user is still on the page, you can subtly re-render the list.

## 3. API Integration Guide

The application will interact with two primary, public APIs.

### 3.1. Objkt.com API (Primary Source)
- **Type:** GraphQL
- **Endpoint:** `https://data.objkt.com/v3/graphql`
- **Method:** All requests should be `POST` requests with a JSON body containing `query` and `variables`.

#### **Key Queries:**

**A. Fetching Collection Info:**
Used in the "Explorer" and "Drops" sections to get a collection's name and description.
```graphql
query GetGalleryCollectionInfoV2($address: String!) {
  collection(where: {address: {_eq: $address}}, limit: 1) {
    name
    description
    creator { address tzdomain alias }
  }
}
```

**B. Fetching Tokens from a Collection:**
Used to get the NFTs within a collection.
```graphql
query GetCollectionTokensV2($address: String!) {
  collection(where: {address: {_eq: $address}}, limit: 1) {
    tokens(limit: 500, order_by: {pk: desc}) {
      pk
      token_id
      name
      display_uri
      thumbnail_uri
      mime
      creators(limit: 1) {
        holder { address tzdomain alias }
      }
    }
  }
}
```

**C. Batch Fetching Artist Profiles:**
This is the **most important query for performance** in the "Newtro Index". It fetches data for *multiple* artists in a single network request.
```graphql
query GetArtistProfiles($addresses: [String!]) {
  holder(where: {address: {_in: $addresses}}) {
    address
    tzdomain
    alias
    twitter
    instagram
  }
}
```

**D. Fetching an Artist's Creations (for Modal Viewer):**
This query is paginated. Use `offset` to load more works for infinite scrolling. It's crucial to filter `supply: { _gt: 0 }` to exclude burned tokens and prevent database errors.
```graphql
query GetCreationsByArtist($address: String!, $offset: Int!) {
  token(
    where: {
      creators: { holder: { address: { _eq: $address } } },
      supply: { _gt: 0 }
    },
    order_by: { pk: desc },
    limit: 8, # Page size
    offset: $offset
  ) {
    pk
    token_id
    name
    display_uri
    artifact_uri
    thumbnail_uri
    mime
    fa { contract }
    creators(limit: 1) {
      holder { address tzdomain alias }
    }
  }
}
```

### 3.2. TzKT.io API (Fallback Source)
- **Type:** REST
- **Base URL:** `https://api.tzkt.io/v1`
- **Purpose:** Use this API as a fallback if Objkt.com is down or fails for a specific request.

#### **Key Endpoints:**

**A. Fetching Tokens:**
- **URL:** `https://api.tzkt.io/v1/tokens?contract={CONTRACT_ADDRESS}&limit=500`
- **Usage:** A fallback for fetching a collection's NFTs. Note that it provides less rich data than Objkt (e.g., no `mime` type).

**B. Fetching Basic Contract Info:**
- **URL:** `https://api.tzkt.io/v1/contracts/{CONTRACT_ADDRESS}`
- **Usage:** A fallback to get a collection's name (`alias`) if the Objkt query fails.

## 4. Section Implementation Details

### 4.1. Header & Navigation
- A sticky header with navigation buttons.
- Clicking a button should update the `currentView` in the global state object and trigger a re-render of the main content area, showing the correct section.

### 4.2. Newtro Index (Artist Catalog)
This is the most complex section. Implement it using this exact logic:
1.  **Define Curated Contracts:** Hardcode this list of contracts. This is the source of truth for the artist list.
    ```javascript
    const CURATED_CONTRACTS = [
      "KT1SnjkFfEjcJDAHXrj8GoLq174ZNjyKbXgG",
      "KT1Muk6E8Ma2nkZJjseFzp172aoCHr9frsjh",
      "KT1C2rNotE5J4Db59CttRVim3JNR8jG5D9Jg",
      // ... and the rest
    ];
    ```
2.  **Aggregate Creators:**
    - For *each* contract in `CURATED_CONTRACTS`, fetch its tokens using the Objkt API. Use `Promise.all` to run these fetches in parallel for speed.
    - From the combined list of all tokens from all collections, extract the creator's address for each token.
3.  **Deduplicate:** Create a unique list of artist wallet addresses using a `Set`.
4.  **Batch Fetch Profiles:** Use the **`GetArtistProfiles`** GraphQL query to fetch profile data for the entire unique list of addresses in **a single API call**.
5.  **Render:** Display the fetched artist profiles in a responsive grid.
6.  **Implement Caching:** Wrap this entire logic in the SWR caching pattern described above.

### 4.3. Events Section
- **Data Source:** Use a local JavaScript file (e.g., `eventsData.js`) that exports an array of event objects.
- **Content Rendering:** Each event has an `articleContent` property which is a multi-line string that acts like Markdown.
- **Create a `MarkdownRenderer` function in JS:** This function will parse the string line by line and generate the appropriate HTML. It must support:
    - `## Heading 2` -> `<h2>`
    - `### Heading 3` -> `<h3>`
    - `youtube:VIDEO_ID` -> An embedded YouTube iframe.
    - `tweet:TWEET_URL` -> A styled placeholder for a Tweet embed. You may need a CORS proxy or a dedicated API (like vxtwitter) to fetch tweet data reliably.
    - Regular text lines -> `<p>`
- **UI Flow:** Show a grid of event summary cards. When a card is clicked, hide the grid and show the detailed article view for that event, rendered using your `MarkdownRenderer`. Include a "Back" button to return to the grid.

### 4.4. Modal Viewer
- When an artist's card is clicked, open a full-screen modal viewer.
- **Initial Load:** Fetch the first page of the artist's creations (e.g., 8 items) using the paginated `GetCreationsByArtist` query (`offset: 0`).
- **Infinite Scroll:** When the user clicks the "next" arrow on the last loaded artwork, trigger another fetch for the next page by increasing the `offset` (e.g., `offset: 8`, then `offset: 16`, etc.). Append the new results to your existing list of NFTs. This creates a seamless browsing experience.

---
This guide provides the complete architectural and logical blueprint. Follow these instructions precisely to build a high-performance, feature-rich application using only foundational web technologies.
