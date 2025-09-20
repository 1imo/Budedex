const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4003';

async function gqlRequest(query: string, variables: any = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/gql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    throw new Error("GraphQL request failed");
  }

  const result = await res.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error occurred");
  }

  return result.data;
}

export async function getStrains(page: number, limit: number, token?: string) {
  const query = `
    query GetStrains($page: Int!, $limit: Int!) {
      strains(page: $page, limit: $limit) {
        strains {
          name
          url
          type
          thc
          cbd
          rating
          review_count
          top_effect
          category
          image_path
          image_url
          description
          aliases
          positive_effects
          negative_effects
          flavors
          terpenes
          medical_benefits
          parents
          children
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(query, { page, limit }, token);
}

export async function getStrain(name: string, token?: string) {
  const query = `
    query GetStrain($name: String!) {
      strain(name: $name) {
        name
        url
        type
        thc
        cbd
        rating
        review_count
        top_effect
        category
        image_path
        image_url
        description
        aliases
        positive_effects
        negative_effects
        flavors
        terpenes
        medical_benefits
        parents
        children
      }
    }
  `;
  return gqlRequest(query, { name }, token);
}

export async function searchStrains(query: string, page: number, limit: number, token?: string) {
  const gqlQuery = `
    query SearchStrains($query: String!, $page: Int!, $limit: Int!) {
      searchStrains(query: $query, page: $page, limit: $limit) {
        strains {
          name
          url
          type
          thc
          cbd
          rating
          review_count
          top_effect
          category
          image_path
          image_url
          description
          positive_effects
          negative_effects
          flavors
          terpenes
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(gqlQuery, { query, page, limit }, token);
}

export async function getStrainsByCategory(category: string, page: number, limit: number, token?: string) {
  const query = `
    query GetStrainsByCategory($category: String!, $page: Int!, $limit: Int!) {
      strainsByCategory(category: $category, page: $page, limit: $limit) {
        strains {
          name
          url
          type
          thc
          cbd
          rating
          review_count
          top_effect
          category
          image_path
          image_url
          description
          positive_effects
          negative_effects
          flavors
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(query, { category, page, limit }, token);
}

export async function getStrainsByEffect(effect: string, page: number, limit: number, token?: string) {
  const query = `
    query GetStrainsByEffect($effect: String!, $page: Int!, $limit: Int!) {
      strainsByEffect(effect: $effect, page: $page, limit: $limit) {
        strains {
          name
          url
          type
          thc
          cbd
          rating
          review_count
          top_effect
          category
          image_path
          image_url
          description
          positive_effects
          negative_effects
          flavors
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(query, { effect, page, limit }, token);
}

export async function getLeaderboard(page: number, limit: number, token?: string) {
  const query = `
    query GetLeaderboard($page: Int!, $limit: Int!) {
      leaderboard(page: $page, limit: $limit) {
        entries {
          rank
          userId
          username
          score
        }
        currentUser {
          rank
          userId
          username
          score
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(query, { page, limit }, token);
}
